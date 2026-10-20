import mongoose from "mongoose";
import { UserModel } from "../auth/auth.models.js";
import { PaperModel } from "../papers/paper.models.js";
import { QuestionBankItemModel } from "../question-bank/questionBank.models.js";
import { SharedLinkModel } from "../shared-links/sharedLink.models.js";
import { SupportTicketModel } from "../support/support.models.js";
import { PaymentRequestModel } from "../billing/billing.models.js";
import { getCurriculumLookupMaps } from "../curriculum/curriculum.service.js";
import { ApiError } from "../../utils/http.js";

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  return parts.join(" ");
}

export async function getAdminDashboardStats() {
  const mem = process.memoryUsage();
  const memUsage = {
    rssMb: Math.round(mem.rss / (1024 * 1024)),
    heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
    heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024)),
    externalMb: Math.round(mem.external / (1024 * 1024))
  };

  const [
    totalUsers,
    totalPapers,
    totalQuestions,
    openTickets,
    totalSharedLinks,
    freeUsers,
    proUsers,
    ultraUsers,
    diamondUsers,
    recentUsers,
    recentTickets,
    recentPapers,
    recentLinks,
    pendingRequestsCount,
    bankBySubject,
    bankByType,
    bankByDifficulty,
    bankByNature,
    papersBySubject,
    sharedLinksStats,
    curriculumMaps
  ] = await Promise.all([
    UserModel.countDocuments(),
    PaperModel.countDocuments(),
    QuestionBankItemModel.countDocuments(),
    SupportTicketModel.countDocuments({ status: { $in: ["open", "in_progress"] } }),
    SharedLinkModel.countDocuments(),
    UserModel.countDocuments({ plan: "free" }),
    UserModel.countDocuments({ plan: { $in: ["pro", "standard"] } }),
    UserModel.countDocuments({ plan: "ultra" }),
    UserModel.countDocuments({ plan: "diamond" }),
    UserModel.find().sort({ createdAt: -1 }).limit(6).select("-passwordHash").lean(),
    SupportTicketModel.find().sort({ updatedAt: -1 }).limit(6).lean(),
    PaperModel.find().sort({ createdAt: -1 }).limit(6).lean(),
    SharedLinkModel.find().sort({ createdAt: -1 }).limit(6).lean(),
    PaymentRequestModel.countDocuments({ status: "pending" }),

    QuestionBankItemModel.aggregate([
      {
        $group: {
          _id: { subjectId: "$subjectId", classId: "$classId" },
          count: { $sum: 1 },
          chapters: { $addToSet: "$chapterId" },
          mcqCount: { $sum: { $cond: [{ $eq: ["$type", "mcq"] }, 1, 0] } },
          cqCount: { $sum: { $cond: [{ $eq: ["$type", "cq"] }, 1, 0] } }
        }
      },
      {
        $project: {
          subjectId: "$_id.subjectId",
          classId: "$_id.classId",
          count: 1,
          chapterCount: { $size: "$chapters" },
          mcqCount: 1,
          cqCount: 1
        }
      },
      { $sort: { count: -1 } }
    ]),

    QuestionBankItemModel.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
    QuestionBankItemModel.aggregate([{ $group: { _id: "$difficulty", count: { $sum: 1 } } }]),
    QuestionBankItemModel.aggregate([{ $group: { _id: "$nature", count: { $sum: 1 } } }]),
    PaperModel.aggregate([
      { $group: { _id: "$subject", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]),
    SharedLinkModel.aggregate([
      {
        $group: {
          _id: null,
          totalVisits: { $sum: "$visits" },
          protectedCount: { $sum: { $cond: ["$isProtected", 1, 0] } }
        }
      }
    ]),
    getCurriculumLookupMaps()
  ]);

  const estRevenue = proUsers * 500 + ultraUsers * 1000;
  const visitsTotal = sharedLinksStats[0]?.totalVisits || 0;
  const protectedLinksCount = sharedLinksStats[0]?.protectedCount || 0;

  const questionTypeCounts = {
    mcq: bankByType.find((t) => t._id === "mcq")?.count || 0,
    cq: bankByType.find((t) => t._id === "cq")?.count || 0
  };

  const questionDifficultyCounts = {
    easy: bankByDifficulty.find((d) => d._id === "easy")?.count || 0,
    medium: bankByDifficulty.find((d) => d._id === "medium")?.count || 0,
    hard: bankByDifficulty.find((d) => d._id === "hard")?.count || 0
  };

  const questionNatureCounts = {
    theory: bankByNature.find((n) => n._id === "theory")?.count || 0,
    mathematical: bankByNature.find((n) => n._id === "mathematical")?.count || 0
  };

  const activityFeed: Array<{
    id: string;
    type: "user_signup" | "paper_created" | "support_ticket" | "shared_link";
    title: string;
    subtitle: string;
    timestamp: string;
    badge?: string;
  }> = [];

  recentUsers.forEach((u) => {
    activityFeed.push({
      id: `act_user_${u.id}`,
      type: "user_signup",
      title: `${u.name || "New User"} joined`,
      subtitle: `${u.email} · Plan: ${u.plan.toUpperCase()}`,
      timestamp: u.createdAt,
      badge: u.role === "admin" ? "Admin" : u.plan.toUpperCase()
    });
  });

  recentPapers.forEach((p) => {
    activityFeed.push({
      id: `act_paper_${p.id}`,
      type: "paper_created",
      title: `Paper created: "${p.name}"`,
      subtitle: `${p.subject} (${p.className}) · ${p.totalMarks} Marks · ${p.questions?.length || 0} Questions`,
      timestamp: (p as any).createdAt || (p as any).updatedAt || new Date().toISOString(),
      badge: p.examType || "Exam"
    });
  });

  recentTickets.forEach((t) => {
    activityFeed.push({
      id: `act_ticket_${t.id}`,
      type: "support_ticket",
      title: `Ticket: ${t.subject}`,
      subtitle: `${t.userName || "User"} (${t.userEmail}) · Category: ${t.category || "General"}`,
      timestamp: (t as any).updatedAt ? new Date((t as any).updatedAt).toISOString() : new Date().toISOString(),
      badge: t.status.toUpperCase()
    });
  });

  recentLinks.forEach((l) => {
    activityFeed.push({
      id: `act_link_${l.id}`,
      type: "shared_link",
      title: `Public Link created for ${l.paperName || "Question Paper"}`,
      subtitle: `${l.subject || "Subject"} · Mode: ${l.mode} · Visits: ${l.visits || 0}`,
      timestamp: (l as any).createdAt ? new Date((l as any).createdAt).toISOString() : new Date().toISOString(),
      badge: l.isProtected ? "Protected" : "Public"
    });
  });

  activityFeed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    totals: {
      users: totalUsers,
      papers: totalPapers,
      questions: totalQuestions,
      sharedLinks: totalSharedLinks,
      sharedVisits: visitsTotal,
      protectedSharedLinks: protectedLinksCount,
      openTickets,
      pendingPaymentRequests: pendingRequestsCount,
      revenue: estRevenue
    },
    plans: {
      free: freeUsers,
      pro: proUsers,
      ultra: ultraUsers,
      diamond: diamondUsers
    },
    system: {
      nodeVersion: process.version,
      platform: `${process.platform} (${process.arch})`,
      uptimeSeconds: Math.floor(process.uptime()),
      uptimeFormatted: formatUptime(process.uptime()),
      memory: memUsage,
      database: {
        status: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        name: "examcraft",
        host: mongoose.connection.readyState === 1 ? "Primary DB (Secure)" : "Disconnected"
      }
    },
    questionBankAnalytics: {
      bySubject: bankBySubject.map((s: any) => ({
        subject: (s.subjectId ? curriculumMaps.subjectMap.get(s.subjectId) : "") || "General",
        className: (s.classId ? curriculumMaps.classMap.get(s.classId) : "") || "SSC / HSC",
        count: s.count,
        chapters: s.chapterCount,
        mcqCount: s.mcqCount,
        cqCount: s.cqCount
      })),
      byType: questionTypeCounts,
      byDifficulty: questionDifficultyCounts,
      byNature: questionNatureCounts
    },
    popularPaperSubjects: papersBySubject.map((p: any) => ({
      subject: p._id || "Unspecified",
      count: p.count
    })),
    activityFeed: activityFeed.slice(0, 15),
    recentUsers: recentUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      plan: u.plan,
      createdAt: u.createdAt
    })),
    recentTickets: recentTickets.map((t) => ({
      id: t.id,
      userName: t.userName,
      userEmail: t.userEmail,
      subject: t.subject,
      status: t.status,
      category: t.category,
      priority: t.priority,
      replies: Math.max(0, (t.messages || []).length - 1),
      updatedAt: t.updatedAt
    }))
  };
}

export async function getAdminUsersList(options: { search?: string; role?: string; plan?: string }) {
  const filter: Record<string, any> = {};
  if (options.search) {
    const safeSearch = escapeRegex(options.search.trim());
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { email: { $regex: safeSearch, $options: "i" } },
      { id: { $regex: safeSearch, $options: "i" } }
    ];
  }
  if (options.role && options.role !== "all") filter.role = options.role;
  if (options.plan && options.plan !== "all") filter.plan = options.plan;

  const users = await UserModel.find(filter).sort({ createdAt: -1 }).select("-passwordHash").lean();
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    plan: u.plan,
    status: u.verified ? "active" : "pending",
    createdAt: u.createdAt,
    updatedAt: u.updatedAt
  }));
}

export async function updateUserPlan(userId: string, plan: "free" | "pro" | "ultra" | "standard") {
  const user = await UserModel.findOneAndUpdate(
    { id: userId },
    { plan, updatedAt: new Date().toISOString() },
    { new: true }
  ).select("-passwordHash");
  if (!user) throw new ApiError(404, "User not found");
  return user;
}

export async function updateUserRole(userId: string, role: "user" | "admin") {
  const user = await UserModel.findOneAndUpdate(
    { id: userId },
    { role, updatedAt: new Date().toISOString() },
    { new: true }
  ).select("-passwordHash");
  if (!user) throw new ApiError(404, "User not found");
  return user;
}

export async function deleteUser(userId: string) {
  const user = await UserModel.findOneAndDelete({ id: userId });
  if (!user) throw new ApiError(404, "User not found");
  return { id: userId };
}

export async function getAdminPapersList(options: { search?: string; subject?: string; limit?: number; skip?: number }) {
  const limit = options.limit || 50;
  const skip = options.skip || 0;
  const filter: Record<string, any> = {};

  if (options.search) {
    const safeSearch = escapeRegex(options.search.trim());
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { subject: { $regex: safeSearch, $options: "i" } },
      { className: { $regex: safeSearch, $options: "i" } }
    ];
  }
  if (options.subject && options.subject !== "all") {
    filter.subject = options.subject;
  }

  const [papers, total] = await Promise.all([
    PaperModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    PaperModel.countDocuments(filter)
  ]);

  const ownerIds = [...new Set(papers.map((p) => p.ownerId))];
  const owners = await UserModel.find({ id: { $in: ownerIds } }).select("id name email plan").lean();
  const ownerMap = new Map(owners.map((o) => [o.id, o]));

  const papersWithAuthors = papers.map((p) => {
    const owner = ownerMap.get(p.ownerId);
    const questions = (p as any).questions || [];
    return {
      id: p.id,
      name: p.name,
      subject: p.subject,
      className: p.className,
      examType: p.examType,
      duration: p.duration,
      totalMarks: p.totalMarks,
      layout: p.layout,
      status: p.status,
      questionsCount: questions.length,
      mcqCount: questions.filter((q: any) => q.type === "mcq").length,
      cqCount: questions.filter((q: any) => q.type === "cq").length,
      ownerId: p.ownerId,
      ownerName: owner?.name || "Unknown Author",
      ownerEmail: owner?.email || "N/A",
      ownerPlan: owner?.plan || "free",
      createdAt: (p as any).createdAt,
      updatedAt: (p as any).updatedAt
    };
  });

  return { papers: papersWithAuthors, total, limit, skip };
}

export async function deleteAdminPaper(paperId: string) {
  const paper = await PaperModel.findOne({ id: paperId });
  if (!paper) throw new ApiError(404, "Paper not found");

  await PaperModel.deleteOne({ id: paperId });
  await SharedLinkModel.deleteMany({ paperId });
  return { id: paperId };
}

export async function getAdminTicketsList() {
  return SupportTicketModel.find().sort({ updatedAt: -1 }).lean();
}

export async function replyAdminTicket(ticketId: string, message: string, status?: string) {
  const ticket = await SupportTicketModel.findOne({ id: ticketId });
  if (!ticket) throw new ApiError(404, "Support ticket not found");

  ticket.messages = ticket.messages || [];
  ticket.messages.push({
    id: `reply_${Date.now()}`,
    senderId: "admin",
    senderName: "ExamCraft Admin",
    senderRole: "admin",
    message,
    createdAt: new Date()
  });

  if (status) {
    ticket.status = status as any;
  } else if (ticket.status === "open") {
    ticket.status = "in_progress";
  }

  ticket.updatedAt = new Date();
  await ticket.save();
  return ticket;
}

export async function updateAdminTicketStatus(ticketId: string, status: "open" | "in_progress" | "resolved" | "closed") {
  const ticket = await SupportTicketModel.findOneAndUpdate(
    { id: ticketId },
    { status, updatedAt: new Date() },
    { new: true }
  );
  if (!ticket) throw new ApiError(404, "Support ticket not found");
  return ticket;
}

export async function getAdminSystemDiagnostics() {
  const mem = process.memoryUsage();
  const [usersCount, papersCount, questionsCount, linksCount, ticketsCount] = await Promise.all([
    UserModel.countDocuments(),
    PaperModel.countDocuments(),
    QuestionBankItemModel.countDocuments(),
    SharedLinkModel.countDocuments(),
    SupportTicketModel.countDocuments()
  ]);

  return {
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptimeSeconds: Math.floor(process.uptime()),
      uptimeFormatted: formatUptime(process.uptime()),
      pid: process.pid,
      memoryUsage: {
        rssMb: Math.round(mem.rss / (1024 * 1024)),
        heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024)),
        heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
        externalMb: Math.round(mem.external / (1024 * 1024))
      }
    },
    database: {
      state: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
      name: "examcraft",
      host: mongoose.connection.readyState === 1 ? "Primary DB (Secure)" : "Disconnected",
      collections: {
        users: usersCount,
        papers: papersCount,
        questionBank: questionsCount,
        sharedLinks: linksCount,
        supportTickets: ticketsCount
      }
    }
  };
}
