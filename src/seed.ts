import bcrypt from "bcryptjs";
import mongoose, { Schema } from "mongoose";
import { env } from "./config/env.js";
import { plans } from "./modules/plans/plan.service.js";
import type { Paper, Question } from "./modules/shared/types.js";

const DEMO_PASSWORD = "Password123!";
const now = () => new Date().toISOString();

const userSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], required: true },
    plan: { type: String, enum: ["free", "standard", "pro"], required: true },
    verified: { type: Boolean, default: false },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  { versionKey: false }
);

const paperSchema = new Schema({}, { strict: false, versionKey: false });
const questionBankSchema = new Schema({}, { strict: false, versionKey: false });
const organizationSchema = new Schema({}, { strict: false, versionKey: false });
const supportTicketSchema = new Schema({}, { strict: false, versionKey: false });
const planSchema = new Schema({}, { strict: false, versionKey: false });
const notificationSchema = new Schema({}, { strict: false, versionKey: false });
const sharedLinkSchema = new Schema({}, { strict: false, versionKey: false });
const billingPaymentSchema = new Schema({}, { strict: false, versionKey: false });
const couponSchema = new Schema({}, { strict: false, versionKey: false });

const User = mongoose.model("SeedUser", userSchema, "users");
const PaperModel = mongoose.model("SeedPaper", paperSchema, "papers");
const QuestionBankItem = mongoose.model("SeedQuestionBankItem", questionBankSchema, "question_bank_items");
const Organization = mongoose.model("SeedOrganization", organizationSchema, "organizations");
const SupportTicket = mongoose.model("SeedSupportTicket", supportTicketSchema, "support_tickets");
const Plan = mongoose.model("SeedPlan", planSchema, "plans");
const Notification = mongoose.model("SeedNotification", notificationSchema, "notifications");
const SharedLink = mongoose.model("SeedSharedLink", sharedLinkSchema, "shared_links");
const BillingPayment = mongoose.model("SeedBillingPayment", billingPaymentSchema, "billing_payments");
const Coupon = mongoose.model("SeedCoupon", couponSchema, "coupons");

async function upsertMany<T extends { id: string }>(model: mongoose.Model<any>, docs: T[]) {
  if (!docs.length) return;

  await model.bulkWrite(
    docs.map((doc) => ({
      updateOne: {
        filter: { id: doc.id },
        update: { $set: doc },
        upsert: true
      }
    }))
  );
}

function makeQuestion(id: string, title: string, answerIndex = 0): Question {
  return {
    id,
    title,
    marks: 1,
    type: "mcq",
    explanation: "Seeded explanation for demo review.",
    options: [
      { id: `${id}_a`, label: "A", text: "Correct answer", isCorrect: answerIndex === 0 },
      { id: `${id}_b`, label: "B", text: "Alternative answer", isCorrect: answerIndex === 1 },
      { id: `${id}_c`, label: "C", text: "Distractor answer", isCorrect: answerIndex === 2 },
      { id: `${id}_d`, label: "D", text: "Another distractor", isCorrect: answerIndex === 3 }
    ]
  };
}

async function seed() {
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required to seed the database.");
  }

  if (env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
    throw new Error(
      "SAFETY HALT: Seeding demo accounts with default credentials is not allowed in production! " +
      "If you intentionally want to run this, set ALLOW_PRODUCTION_SEED=true and define SEED_ADMIN_PASSWORD in environment."
    );
  }

  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: env.NODE_ENV !== "production"
  });

  const timestamp = now();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || DEMO_PASSWORD;
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const users = [
    {
      id: "usr_demo_teacher",
      name: "Ayesha Rahman",
      email: "teacher@examcraft.app",
      passwordHash,
      role: "user",
      plan: "pro",
      verified: true,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "usr_demo_admin",
      name: "ExamCraft Admin",
      email: "admin@examcraft.app",
      passwordHash,
      role: "admin",
      plan: "pro",
      verified: true,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ] as const;

  await User.bulkWrite(
    users.map((user) => ({
      updateOne: {
        filter: { email: user.email },
        update: { $set: user },
        upsert: true
      }
    }))
  );

  const physicsQuestions = [
    makeQuestion("q_phy_1", "What is the SI unit of force?"),
    makeQuestion("q_phy_2", "Which law explains action and reaction?", 1),
    makeQuestion("q_phy_3", "What device measures electric current?", 2)
  ];

  const papers: Paper[] = [
    {
      id: "paper_sample_1",
      ownerId: "usr_demo_teacher",
      name: "SSC Physics Model Test",
      subject: "Physics",
      className: "Class 10",
      examType: "Model Test",
      duration: "45 minutes",
      totalMarks: 30,
      instructions: "Choose the correct answer. Each question carries equal marks.",
      questionNumberStyle: "numeric",
      optionLabelStyle: "upper-alpha",
      questionsPerPage: 10,
      layout: "split",
      status: "draft",
      questions: physicsQuestions,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "paper_sample_2",
      ownerId: "usr_demo_teacher",
      name: "Chemistry Chapter Test",
      subject: "Chemistry",
      className: "Class 9",
      examType: "Chapter Test",
      duration: "30 minutes",
      totalMarks: 20,
      instructions: "Answer all questions and show necessary reasoning.",
      questionNumberStyle: "numeric",
      optionLabelStyle: "upper-alpha",
      questionsPerPage: 8,
      layout: "single",
      status: "published",
      questions: [
        makeQuestion("q_chem_1", "Which particle has a negative charge?", 1),
        makeQuestion("q_chem_2", "What is the chemical symbol for sodium?", 2)
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ];

  await upsertMany(PaperModel, papers);

  await upsertMany(QuestionBankItem, [
    // ==========================================
    // PHYSICS (12 Questions)
    // ==========================================
    {
      id: "bank_phy_1",
      ownerId: "usr_demo_teacher",
      category: "Physics",
      difficulty: "easy",
      title: "What is the SI unit of force?",
      marks: 1,
      options: ["Newton", "Joule", "Pascal", "Watt"],
      correctIndex: 0,
      explanation: "Force is measured in Newtons ($N = \\text{kg}\\cdot\\text{m}/\\text{s}^2$), named after Sir Isaac Newton.",
      usageCount: 24,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_phy_2",
      ownerId: "usr_demo_teacher",
      category: "Physics",
      difficulty: "medium",
      title: "What is the speed of light in vacuum?",
      marks: 1,
      options: ["$3 \\times 10^8 \\text{ m/s}$", "$3 \\times 10^6 \\text{ m/s}$", "$3 \\times 10^{10} \\text{ m/s}$", "$1.5 \\times 10^8 \\text{ m/s}$"],
      correctIndex: 0,
      explanation: "The speed of light in vacuum is an exact universal constant: $c \\approx 2.998 \\times 10^8 \\text{ m/s}$.",
      usageCount: 19,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_phy_3",
      ownerId: "usr_demo_teacher",
      category: "Physics",
      difficulty: "medium",
      title: "Which law states that force is directly proportional to the rate of change of momentum?",
      marks: 1,
      options: ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Law of Universal Gravitation"],
      correctIndex: 1,
      explanation: "Newton's Second Law of Motion states $F = \\frac{dp}{dt} = m \\cdot a$.",
      usageCount: 16,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_phy_4",
      ownerId: "usr_demo_teacher",
      category: "Physics",
      difficulty: "easy",
      title: "What is the kinetic energy of an object of mass $m$ moving with velocity $v$?",
      marks: 1,
      options: ["$E_k = mv$", "$E_k = \\frac{1}{2}mv^2$", "$E_k = mgh$", "$E_k = 2mv^2$"],
      correctIndex: 1,
      explanation: "Kinetic energy is given by $E_k = \\frac{1}{2}mv^2$.",
      usageCount: 22,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_phy_5",
      ownerId: "usr_demo_teacher",
      category: "Physics",
      difficulty: "easy",
      title: "Which instrument is used to measure electric potential difference?",
      marks: 1,
      options: ["Ammeter", "Voltmeter", "Galvanometer", "Ohmmeter"],
      correctIndex: 1,
      explanation: "A voltmeter connected in parallel across components measures potential difference (voltage).",
      usageCount: 15,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_phy_6",
      ownerId: "usr_demo_teacher",
      category: "Physics",
      difficulty: "medium",
      title: "What is the gravitational potential energy of an object of mass $m$ raised to height $h$ near Earth's surface?",
      marks: 1,
      options: ["$U = mgh$", "$U = \\frac{1}{2}mgh$", "$U = \\frac{mgh^2}{2}$", "$U = mg/h$"],
      correctIndex: 0,
      explanation: "Gravitational potential energy is $U = mgh$ where $g \\approx 9.8 \\text{ m/s}^2$.",
      usageCount: 11,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_phy_7",
      ownerId: "usr_demo_teacher",
      category: "Physics",
      difficulty: "easy",
      title: "According to Ohm's Law, what is the relation between voltage ($V$), current ($I$), and resistance ($R$)?",
      marks: 1,
      options: ["$V = I/R$", "$V = IR$", "$I = VR$", "$R = VI$"],
      correctIndex: 1,
      explanation: "Ohm's Law states that current through a conductor is proportional to voltage: $V = IR$.",
      usageCount: 20,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_phy_8",
      ownerId: "usr_demo_teacher",
      category: "Physics",
      difficulty: "hard",
      title: "Which formula correctly represents Snell's Law of refraction?",
      marks: 1,
      options: ["$n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2$", "$n_1 \\cos\\theta_1 = n_2 \\cos\\theta_2$", "$\\frac{n_1}{\\sin\\theta_1} = \\frac{n_2}{\\sin\\theta_2}$", "$n_1 n_2 = \\sin\\theta_1 \\sin\\theta_2$"],
      correctIndex: 0,
      explanation: "Snell's Law relates refractive indices to angles of incidence and refraction: $n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2$.",
      usageCount: 9,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_phy_9",
      ownerId: "usr_demo_teacher",
      category: "Physics",
      difficulty: "easy",
      title: "What is the standard value of acceleration due to gravity ($g$) at sea level on Earth?",
      marks: 1,
      options: ["$8.9 \\text{ m/s}^2$", "$9.8 \\text{ m/s}^2$", "$10.8 \\text{ m/s}^2$", "$9.8 \\text{ cm/s}^2$"],
      correctIndex: 1,
      explanation: "Standard Earth gravitational acceleration is $g \\approx 9.80665 \\text{ m/s}^2$.",
      usageCount: 18,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_phy_10",
      ownerId: "usr_demo_teacher",
      category: "Physics",
      difficulty: "hard",
      title: "What is the escape velocity of an object projected from the surface of the Earth?",
      marks: 1,
      options: ["$7.9 \\text{ km/s}$", "$11.2 \\text{ km/s}$", "$16.7 \\text{ km/s}$", "$25.0 \\text{ km/s}$"],
      correctIndex: 1,
      explanation: "Escape velocity from Earth is $v_e = \\sqrt{\\frac{2GM}{R}} \\approx 11.2 \\text{ km/s}$.",
      usageCount: 8,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_phy_11",
      ownerId: "usr_demo_teacher",
      category: "Physics",
      difficulty: "medium",
      title: "What is the equivalent resistance when two $10\\,\\Omega$ resistors are connected in parallel?",
      marks: 1,
      options: ["$20\\,\\Omega$", "$10\\,\\Omega$", "$5\\,\\Omega$", "$2.5\\,\\Omega$"],
      correctIndex: 2,
      explanation: "$\\frac{1}{R_p} = \\frac{1}{10} + \\frac{1}{10} = \\frac{2}{10} \\implies R_p = 5\\,\\Omega$.",
      usageCount: 13,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_phy_12",
      ownerId: "usr_demo_teacher",
      category: "Physics",
      difficulty: "medium",
      title: "A sound wave travels at $340 \\text{ m/s}$ with a wavelength of $1.7 \\text{ m}$. What is its frequency?",
      marks: 1,
      options: ["$170 \\text{ Hz}$", "$200 \\text{ Hz}$", "$340 \\text{ Hz}$", "$578 \\text{ Hz}$"],
      correctIndex: 1,
      explanation: "Using wave equation $v = f\\lambda \\implies f = \\frac{v}{\\lambda} = \\frac{340}{1.7} = 200 \\text{ Hz}$.",
      usageCount: 10,
      createdAt: timestamp,
      updatedAt: timestamp
    },

    // ==========================================
    // CHEMISTRY (12 Questions)
    // ==========================================
    {
      id: "bank_chem_1",
      ownerId: "usr_demo_teacher",
      category: "Chemistry",
      difficulty: "easy",
      title: "What is the chemical symbol for Sodium?",
      marks: 1,
      options: ["So", "Sd", "Na", "Sm"],
      correctIndex: 2,
      explanation: "Sodium's symbol comes from its Latin name Natrium: Na.",
      usageCount: 26,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_chem_2",
      ownerId: "usr_demo_teacher",
      category: "Chemistry",
      difficulty: "medium",
      title: "Which gas is evolved when dilute hydrochloric acid reacts with zinc metal?",
      marks: 1,
      options: ["Oxygen ($O_2$)", "Hydrogen ($H_2$)", "Chlorine ($Cl_2$)", "Carbon dioxide ($CO_2$)"],
      correctIndex: 1,
      explanation: "$\\text{Zn} + 2\\text{HCl} \\rightarrow \\text{ZnCl}_2 + \\text{H}_2\\uparrow$.",
      usageCount: 17,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_chem_3",
      ownerId: "usr_demo_teacher",
      category: "Chemistry",
      difficulty: "easy",
      title: "What is the pH value of pure neutral water at $25^\\circ\\text{C}$?",
      marks: 1,
      options: ["0", "7", "14", "1"],
      correctIndex: 1,
      explanation: "At $25^\\circ\\text{C}$, pure water has $[H^+] = 10^{-7} \\text{ M}$, so $\\text{pH} = -\\log(10^{-7}) = 7$.",
      usageCount: 25,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_chem_4",
      ownerId: "usr_demo_teacher",
      category: "Chemistry",
      difficulty: "medium",
      title: "What is the value of Avogadro's constant ($N_A$)?",
      marks: 1,
      options: ["$6.022 \\times 10^{23} \\text{ mol}^{-1}$", "$6.626 \\times 10^{-34} \\text{ J}\\cdot\\text{s}$", "$3.00 \\times 10^8 \\text{ m/s}$", "$9.81 \\text{ m/s}^2$"],
      correctIndex: 0,
      explanation: "Avogadro's constant is $N_A \\approx 6.02214076 \\times 10^{23} \\text{ mol}^{-1}$.",
      usageCount: 18,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_chem_5",
      ownerId: "usr_demo_teacher",
      category: "Chemistry",
      difficulty: "hard",
      title: "Which quantum number determines the three-dimensional shape of an atomic orbital?",
      marks: 1,
      options: ["Principal quantum number ($n$)", "Azimuthal quantum number ($l$)", "Magnetic quantum number ($m$)", "Spin quantum number ($s$)"],
      correctIndex: 1,
      explanation: "The azimuthal (orbital angular momentum) quantum number $l$ dictates orbital geometry (s, p, d, f).",
      usageCount: 7,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_chem_6",
      ownerId: "usr_demo_teacher",
      category: "Chemistry",
      difficulty: "medium",
      title: "What is the general molecular formula for Alkane hydrocarbons?",
      marks: 1,
      options: ["$C_n H_{2n}$", "$C_n H_{2n+2}$", "$C_n H_{2n-2}$", "$C_n H_n$"],
      correctIndex: 1,
      explanation: "Alkanes are saturated hydrocarbons following the general formula $C_n H_{2n+2}$.",
      usageCount: 16,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_chem_7",
      ownerId: "usr_demo_teacher",
      category: "Chemistry",
      difficulty: "easy",
      title: "What is the most abundant gas by volume in Earth's atmosphere?",
      marks: 1,
      options: ["Oxygen ($O_2$)", "Carbon dioxide ($CO_2$)", "Nitrogen ($N_2$)", "Argon ($Ar$)"],
      correctIndex: 2,
      explanation: "Nitrogen makes up approximately $78.08\\%$ of Earth's atmosphere by volume.",
      usageCount: 21,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_chem_8",
      ownerId: "usr_demo_teacher",
      category: "Chemistry",
      difficulty: "hard",
      title: "What is the oxidation state of Manganese ($Mn$) in Potassium Permanganate ($\\text{KMnO}_4$)?",
      marks: 1,
      options: ["+2", "+4", "+6", "+7"],
      correctIndex: 3,
      explanation: "$(+1) + x + 4(-2) = 0 \\implies x - 7 = 0 \\implies x = +7$.",
      usageCount: 11,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_chem_9",
      ownerId: "usr_demo_teacher",
      category: "Chemistry",
      difficulty: "easy",
      title: "How many valence electrons are present in a neutral Oxygen atom (atomic number 8)?",
      marks: 1,
      options: ["2", "4", "6", "8"],
      correctIndex: 2,
      explanation: "Electronic configuration of Oxygen ($Z=8$) is $1s^2 2s^2 2p^4$, having 6 valence electrons.",
      usageCount: 19,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_chem_10",
      ownerId: "usr_demo_teacher",
      category: "Chemistry",
      difficulty: "medium",
      title: "Which transition metal is used as the primary catalyst in the Haber process for ammonia synthesis?",
      marks: 1,
      options: ["Nickel (Ni)", "Iron (Fe)", "Platinum (Pt)", "Copper (Cu)"],
      correctIndex: 1,
      explanation: "Finely divided Iron (Fe) with molybdenum or potassium oxide promoter catalyzes $\\text{N}_2 + 3\\text{H}_2 \\rightleftharpoons 2\\text{NH}_3$.",
      usageCount: 14,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_chem_11",
      ownerId: "usr_demo_teacher",
      category: "Chemistry",
      difficulty: "hard",
      title: "What is the approximate $\\text{H}-\\text{O}-\\text{H}$ bond angle in a water molecule ($H_2O$)?",
      marks: 1,
      options: ["$90.0^\\circ$", "$104.5^\\circ$", "$109.5^\\circ$", "$120.0^\\circ$"],
      correctIndex: 1,
      explanation: "Due to lone pair repulsion on oxygen, the tetrahedral angle is compressed from $109.5^\\circ$ to $104.5^\\circ$.",
      usageCount: 12,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_chem_12",
      ownerId: "usr_demo_teacher",
      category: "Chemistry",
      difficulty: "easy",
      title: "Which gas turns clear lime water (calcium hydroxide solution) milky?",
      marks: 1,
      options: ["Oxygen ($O_2$)", "Nitrogen ($N_2$)", "Carbon dioxide ($CO_2$)", "Hydrogen ($H_2$)"],
      correctIndex: 2,
      explanation: "$\\text{CO}_2$ reacts with $\\text{Ca(OH)}_2$ to precipitate insoluble calcium carbonate $\\text{CaCO}_3$.",
      usageCount: 23,
      createdAt: timestamp,
      updatedAt: timestamp
    },

    // ==========================================
    // BIOLOGY (12 Questions)
    // ==========================================
    {
      id: "bank_bio_1",
      ownerId: "usr_demo_teacher",
      category: "Biology",
      difficulty: "easy",
      title: "Which organelle is universally known as the powerhouse of eukaryotic cells?",
      marks: 1,
      options: ["Ribosome", "Nucleus", "Mitochondria", "Golgi apparatus"],
      correctIndex: 2,
      explanation: "Mitochondria generate cellular chemical energy through oxidative phosphorylation and ATP synthesis.",
      usageCount: 28,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_bio_2",
      ownerId: "usr_demo_teacher",
      category: "Biology",
      difficulty: "easy",
      title: "Which pigment absorbs sunlight energy for photosynthesis in green plants?",
      marks: 1,
      options: ["Carotenoid", "Chlorophyll", "Hemoglobin", "Melanin"],
      correctIndex: 1,
      explanation: "Chlorophyll pigments located in thylakoid membranes absorb light in red and blue wavelengths.",
      usageCount: 22,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_bio_3",
      ownerId: "usr_demo_teacher",
      category: "Biology",
      difficulty: "medium",
      title: "How many muscular chambers are in the human heart?",
      marks: 1,
      options: ["2", "3", "4", "6"],
      correctIndex: 2,
      explanation: "The human heart features four distinct chambers: right atrium, left atrium, right ventricle, and left ventricle.",
      usageCount: 17,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_bio_4",
      ownerId: "usr_demo_teacher",
      category: "Biology",
      difficulty: "medium",
      title: "Which human ABO blood type is considered the universal red blood cell donor?",
      marks: 1,
      options: ["A positive", "AB positive", "O negative", "B negative"],
      correctIndex: 2,
      explanation: "Type O negative red cells lack A, B, and Rh antigens, avoiding recipient immunological rejection.",
      usageCount: 20,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_bio_5",
      ownerId: "usr_demo_teacher",
      category: "Biology",
      difficulty: "hard",
      title: "In double-stranded DNA, which nitrogenous base pairs with Adenine (A)?",
      marks: 1,
      options: ["Cytosine (C)", "Guanine (G)", "Thymine (T)", "Uracil (U)"],
      correctIndex: 2,
      explanation: "Adenine forms two complementary hydrogen bonds with Thymine in DNA (replaced by Uracil in RNA).",
      usageCount: 15,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_bio_6",
      ownerId: "usr_demo_teacher",
      category: "Biology",
      difficulty: "easy",
      title: "In which part of the human digestive system does the vast majority of nutrient absorption take place?",
      marks: 1,
      options: ["Stomach", "Small intestine", "Large intestine", "Esophagus"],
      correctIndex: 1,
      explanation: "The small intestine (duodenum, jejunum, ileum) has massive surface area lined with villi and microvilli.",
      usageCount: 19,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_bio_7",
      ownerId: "usr_demo_teacher",
      category: "Biology",
      difficulty: "medium",
      title: "Which pancreatic hormone acts to lower elevated blood glucose concentrations?",
      marks: 1,
      options: ["Glucagon", "Insulin", "Thyroxine", "Adrenaline"],
      correctIndex: 1,
      explanation: "Beta cells of the islets of Langerhans secrete insulin to facilitate cellular uptake of glucose.",
      usageCount: 16,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_bio_8",
      ownerId: "usr_demo_teacher",
      category: "Biology",
      difficulty: "medium",
      title: "Which type of cellular division reduces chromosome number by half to produce haploid gametes?",
      marks: 1,
      options: ["Mitosis", "Meiosis", "Binary fission", "Budding"],
      correctIndex: 1,
      explanation: "Meiosis is reductional division consisting of meiosis I and II yielding four genetically diverse haploid daughter cells.",
      usageCount: 18,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_bio_9",
      ownerId: "usr_demo_teacher",
      category: "Biology",
      difficulty: "easy",
      title: "What high-energy molecule serves as the direct energy currency for biochemical work in living cells?",
      marks: 1,
      options: ["Glucose", "ATP (Adenosine triphosphate)", "DNA", "Lipid"],
      correctIndex: 1,
      explanation: "Hydrolysis of the terminal phosphoanhydride bond in ATP releases $\\approx 30.5 \\text{ kJ/mol}$ of usable energy.",
      usageCount: 23,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_bio_10",
      ownerId: "usr_demo_teacher",
      category: "Biology",
      difficulty: "hard",
      title: "What is the microscopic structural and functional filtering unit of the human kidney?",
      marks: 1,
      options: ["Neuron", "Nephron", "Alveolus", "Hepatocyte"],
      correctIndex: 1,
      explanation: "Each kidney contains roughly one million nephrons composed of a glomerulus and renal tubule.",
      usageCount: 11,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_bio_11",
      ownerId: "usr_demo_teacher",
      category: "Biology",
      difficulty: "easy",
      title: "Prolonged dietary deficiency of Vitamin C (ascorbic acid) causes which nutritional disorder?",
      marks: 1,
      options: ["Rickets", "Beriberi", "Scurvy", "Pellagra"],
      correctIndex: 2,
      explanation: "Vitamin C is essential for collagen synthesis; deficiency causes scurvy characterized by bleeding gums and poor wound healing.",
      usageCount: 21,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_bio_12",
      ownerId: "usr_demo_teacher",
      category: "Biology",
      difficulty: "medium",
      title: "Which digestive enzyme present in human saliva initiates the chemical breakdown of dietary starch into maltose?",
      marks: 1,
      options: ["Pepsin", "Salivary Amylase (Ptyalin)", "Lipase", "Trypsin"],
      correctIndex: 1,
      explanation: "Salivary amylase cleaves $\\alpha(1\\rightarrow4)$ glycosidic bonds in starch into maltose and dextrins.",
      usageCount: 14,
      createdAt: timestamp,
      updatedAt: timestamp
    },

    // ==========================================
    // MATHEMATICS (12 Questions)
    // ==========================================
    {
      id: "bank_math_1",
      ownerId: "usr_demo_teacher",
      category: "Mathematics",
      difficulty: "easy",
      title: "What is the fundamental trigonometric identity $\\sin^2\\theta + \\cos^2\\theta$ equal to for any angle $\\theta$?",
      marks: 1,
      options: ["0", "1", "$\\tan\\theta$", "$\\sec\\theta$"],
      correctIndex: 1,
      explanation: "From the Pythagorean theorem applied to the unit circle: $\\sin^2\\theta + \\cos^2\\theta = 1$.",
      usageCount: 27,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_math_2",
      ownerId: "usr_demo_teacher",
      category: "Mathematics",
      difficulty: "medium",
      title: "What are the real roots of the quadratic equation $x^2 - 5x + 6 = 0$?",
      marks: 1,
      options: ["$x = 2, 3$", "$x = -2, -3$", "$x = 1, 6$", "$x = -1, -6$"],
      correctIndex: 0,
      explanation: "Factoring: $(x - 2)(x - 3) = 0 \\implies x = 2 \\text{ or } x = 3$.",
      usageCount: 21,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_math_3",
      ownerId: "usr_demo_teacher",
      category: "Mathematics",
      difficulty: "medium",
      title: "What is the first derivative $\\frac{d}{dx}(x^3)$ with respect to $x$?",
      marks: 1,
      options: ["$3x$", "$3x^2$", "$x^2$", "$\\frac{x^4}{4}$"],
      correctIndex: 1,
      explanation: "By the power rule of differentiation: $\\frac{d}{dx}(x^n) = n x^{n-1} \\implies 3x^2$.",
      usageCount: 19,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_math_4",
      ownerId: "usr_demo_teacher",
      category: "Mathematics",
      difficulty: "easy",
      title: "What is the formula for the geometric area of a circle with radius $r$?",
      marks: 1,
      options: ["$2\\pi r$", "$\\pi r^2$", "$\\frac{4}{3}\\pi r^3$", "$\\pi d$"],
      correctIndex: 1,
      explanation: "Circle area is calculated by $A = \\pi r^2$.",
      usageCount: 25,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_math_5",
      ownerId: "usr_demo_teacher",
      category: "Mathematics",
      difficulty: "easy",
      title: "If $\\log_{10}(x) = 3$, what is the exact numeric value of $x$?",
      marks: 1,
      options: ["30", "100", "1000", "3000"],
      correctIndex: 2,
      explanation: "By logarithmic definition: $\\log_b(x) = y \\iff b^y = x \\implies 10^3 = 1000$.",
      usageCount: 17,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_math_6",
      ownerId: "usr_demo_teacher",
      category: "Mathematics",
      difficulty: "medium",
      title: "What is the formula for the sum of the interior angles of a convex polygon with $n$ sides?",
      marks: 1,
      options: ["$(n - 1) \\times 180^\\circ$", "$(n - 2) \\times 180^\\circ$", "$(n + 2) \\times 180^\\circ$", "$2n \\times 90^\\circ$"],
      correctIndex: 1,
      explanation: "Any convex $n$-gon can be partitioned into $n - 2$ triangles, giving total interior sum $(n - 2) \\times 180^\\circ$.",
      usageCount: 14,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_math_7",
      ownerId: "usr_demo_teacher",
      category: "Mathematics",
      difficulty: "medium",
      title: "Evaluate the definite Riemann integral $\\int_0^2 2x \\, dx$:",
      marks: 1,
      options: ["2", "4", "6", "8"],
      correctIndex: 1,
      explanation: "$\\int_0^2 2x \\, dx = \\left[ x^2 \\right]_0^2 = 2^2 - 0 = 4$.",
      usageCount: 16,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_math_8",
      ownerId: "usr_demo_teacher",
      category: "Mathematics",
      difficulty: "hard",
      title: "What are the Cartesian coordinates of the vertex of the parabola $y = (x - 3)^2 + 4$?",
      marks: 1,
      options: ["$(-3, 4)$", "$(3, 4)$", "$(3, -4)$", "$(-3, -4)$"],
      correctIndex: 1,
      explanation: "In vertex form $y = a(x - h)^2 + k$, the coordinates of the vertex are $(h, k) = (3, 4)$.",
      usageCount: 12,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_math_9",
      ownerId: "usr_demo_teacher",
      category: "Mathematics",
      difficulty: "easy",
      title: "What is the Euclidean distance between the origin $(0, 0)$ and point $(3, 4)$?",
      marks: 1,
      options: ["5", "7", "12", "25"],
      correctIndex: 0,
      explanation: "$d = \\sqrt{(3 - 0)^2 + (4 - 0)^2} = \\sqrt{9 + 16} = \\sqrt{25} = 5$.",
      usageCount: 22,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_math_10",
      ownerId: "usr_demo_teacher",
      category: "Mathematics",
      difficulty: "hard",
      title: "What is the probability of obtaining a total sum of 7 when rolling two fair six-sided dice simultaneously?",
      marks: 1,
      options: ["$\\frac{1}{12}$", "$\\frac{1}{6}$", "$\\frac{5}{36}$", "$\\frac{7}{36}$"],
      correctIndex: 1,
      explanation: "Favorable outcomes: $(1,6),(2,5),(3,4),(4,3),(5,2),(6,1)$ (6 outcomes out of 36) $\\implies \\frac{6}{36} = \\frac{1}{6}$.",
      usageCount: 13,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_math_11",
      ownerId: "usr_demo_teacher",
      category: "Mathematics",
      difficulty: "medium",
      title: "Solve the linear simultaneous equations: $2x + y = 7$ and $x - y = 2$:",
      marks: 1,
      options: ["$x = 3, y = 1$", "$x = 2, y = 3$", "$x = 4, y = -1$", "$x = 1, y = 5$"],
      correctIndex: 0,
      explanation: "Adding both equations: $3x = 9 \\implies x = 3$. Substituting: $3 - y = 2 \\implies y = 1$.",
      usageCount: 18,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_math_12",
      ownerId: "usr_demo_teacher",
      category: "Mathematics",
      difficulty: "hard",
      title: "Evaluate the standard trigonometric limit $\\lim_{x \\to 0} \\frac{\\sin x}{x}$ (where $x$ is in radians):",
      marks: 1,
      options: ["0", "1", "$\\infty$", "Undefined"],
      correctIndex: 1,
      explanation: "By squeeze theorem or L'Hôpital's rule: $\\lim_{x\\to 0} \\frac{\\cos x}{1} = \\cos(0) = 1$.",
      usageCount: 11,
      createdAt: timestamp,
      updatedAt: timestamp
    },

    // ==========================================
    // ICT (12 Questions)
    // ==========================================
    {
      id: "bank_ict_1",
      ownerId: "usr_demo_teacher",
      category: "ICT",
      difficulty: "easy",
      title: "Which of the following peripheral devices operates primarily as an input device?",
      marks: 1,
      options: ["Monitor", "Keyboard", "Speaker", "Projector"],
      correctIndex: 1,
      explanation: "A keyboard encodes alphanumeric keystrokes into electrical input signals for the operating system.",
      usageCount: 26,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_ict_2",
      ownerId: "usr_demo_teacher",
      category: "ICT",
      difficulty: "easy",
      title: "What does the widely used web acronym HTML stand for?",
      marks: 1,
      options: ["HyperText Markup Language", "HighText Machine Language", "Hyperlinks Text Multi Language", "Home Tool Markup Language"],
      correctIndex: 0,
      explanation: "HTML stands for HyperText Markup Language, the structural standard for World Wide Web documents.",
      usageCount: 29,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_ict_3",
      ownerId: "usr_demo_teacher",
      category: "ICT",
      difficulty: "easy",
      title: "How many binary digits (bits) comprise one standard computer byte?",
      marks: 1,
      options: ["4", "8", "16", "32"],
      correctIndex: 1,
      explanation: "By definition, 1 standard byte consists of 8 bits (capable of storing 256 unique values).",
      usageCount: 24,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_ict_4",
      ownerId: "usr_demo_teacher",
      category: "ICT",
      difficulty: "medium",
      title: "Which network protocol provides end-to-end cryptographic encryption for World Wide Web communications?",
      marks: 1,
      options: ["HTTP", "HTTPS", "FTP", "SMTP"],
      correctIndex: 1,
      explanation: "HTTPS (HyperText Transfer Protocol Secure) encapsulates HTTP within TLS/SSL encryption.",
      usageCount: 21,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_ict_5",
      ownerId: "usr_demo_teacher",
      category: "ICT",
      difficulty: "medium",
      title: "What is the binary (base-2) representation of the decimal integer 13?",
      marks: 1,
      options: ["1011", "1101", "1110", "1001"],
      correctIndex: 1,
      explanation: "$13_{10} = (1 \\times 2^3) + (1 \\times 2^2) + (0 \\times 2^1) + (1 \\times 2^0) = 1101_2$.",
      usageCount: 17,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_ict_6",
      ownerId: "usr_demo_teacher",
      category: "ICT",
      difficulty: "easy",
      title: "Which hardware component executes program instructions and performs arithmetic calculations in a computer?",
      marks: 1,
      options: ["Hard Disk Drive (HDD)", "Central Processing Unit (CPU)", "Power Supply Unit (PSU)", "Graphics Processing Unit (GPU)"],
      correctIndex: 1,
      explanation: "The CPU is the central electronic circuitry executing instructions of computer programs via fetch-decode-execute cycles.",
      usageCount: 27,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_ict_7",
      ownerId: "usr_demo_teacher",
      category: "ICT",
      difficulty: "easy",
      title: "Which computer memory technology is volatile and loses its stored contents when power is turned off?",
      marks: 1,
      options: ["ROM (Read-Only Memory)", "RAM (Random Access Memory)", "Flash Memory", "Magnetic Storage"],
      correctIndex: 1,
      explanation: "RAM is volatile high-speed temporary memory requiring constant electrical power to maintain state.",
      usageCount: 25,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_ict_8",
      ownerId: "usr_demo_teacher",
      category: "ICT",
      difficulty: "medium",
      title: "What is the default TCP destination port designated for unencrypted HTTP web server traffic?",
      marks: 1,
      options: ["21", "25", "80", "443"],
      correctIndex: 2,
      explanation: "Port 80 is the standard assigned port for unencrypted HTTP traffic; port 443 is used for HTTPS.",
      usageCount: 16,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_ict_9",
      ownerId: "usr_demo_teacher",
      category: "ICT",
      difficulty: "medium",
      title: "Which linear computer data structure operates strictly on the First-In, First-Out (FIFO) principle?",
      marks: 1,
      options: ["Stack", "Queue", "Binary Tree", "Heap"],
      correctIndex: 1,
      explanation: "A Queue operates on FIFO where elements are enqueued at the back and dequeued from the front.",
      usageCount: 18,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_ict_10",
      ownerId: "usr_demo_teacher",
      category: "ICT",
      difficulty: "hard",
      title: "What is the worst-case time complexity of the Binary Search algorithm on a sorted list of $n$ elements?",
      marks: 1,
      options: ["$O(1)$", "$O(n)$", "$O(\\log n)$", "$O(n^2)$"],
      correctIndex: 2,
      explanation: "Binary search repeatedly halves the search space at each iteration, resulting in logarithmic $O(\\log n)$ complexity.",
      usageCount: 14,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_ict_11",
      ownerId: "usr_demo_teacher",
      category: "ICT",
      difficulty: "easy",
      title: "What unique numerical label identifies each device connected to a computer network using the Internet Protocol?",
      marks: 1,
      options: ["MAC Address", "IP Address", "SSID", "URL"],
      correctIndex: 1,
      explanation: "An IP address (IPv4 or IPv6) serves as the host or network interface identification and location addressing.",
      usageCount: 22,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "bank_ict_12",
      ownerId: "usr_demo_teacher",
      category: "ICT",
      difficulty: "hard",
      title: "Which cryptographic cipher is a symmetric key specification established by NIST as the global standard?",
      marks: 1,
      options: ["RSA", "Diffie-Hellman", "AES (Advanced Encryption Standard)", "ECC (Elliptic Curve Cryptography)"],
      correctIndex: 2,
      explanation: "AES (Advanced Encryption Standard) is a symmetric block cipher with key sizes of 128, 192, and 256 bits.",
      usageCount: 12,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ]);

  await upsertMany(Organization, [
    {
      id: "org_demo_teacher",
      ownerId: "usr_demo_teacher",
      type: "school",
      name: "North Star Model School",
      logoUrl: "",
      address: "Dhaka, Bangladesh",
      phone: "+880 1700 000000",
      website: "https://example.edu",
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ]);

  await upsertMany(SupportTicket, [
    {
      id: "tkt_1",
      ownerId: "usr_demo_teacher",
      subject: "Need DOCX formatting help",
      description: "The exported DOCX needs a cleaner header for our school format.",
      status: "open",
      replies: [
        {
          id: "reply_1",
          authorId: "usr_demo_admin",
          message: "Thanks, we are reviewing the formatting template.",
          createdAt: timestamp
        }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: "tkt_2",
      ownerId: "usr_demo_teacher",
      subject: "Payment approval pending",
      description: "My Pro plan payment has been submitted and is waiting for approval.",
      status: "in_progress",
      replies: [],
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ]);

  await upsertMany(Plan, plans.map((plan) => ({ id: `plan_${plan.code}`, ...plan, updatedAt: timestamp })));

  await upsertMany(Notification, [
    {
      id: "ntf_1",
      ownerId: "usr_demo_teacher",
      title: "Export ready",
      message: "Your SSC Physics Model Test PDF export is ready.",
      read: false,
      createdAt: timestamp
    },
    {
      id: "ntf_2",
      ownerId: "usr_demo_teacher",
      title: "Subscription active",
      message: "Your Pro plan is active until 2026-07-15.",
      read: true,
      createdAt: timestamp
    }
  ]);

  await upsertMany(SharedLink, [
    {
      id: "share_demo_1",
      ownerId: "usr_demo_teacher",
      paperId: "paper_sample_1",
      token: "demo-physics-model-test",
      expiresAt: "2026-07-15T00:00:00.000Z",
      createdAt: timestamp
    }
  ]);

  await upsertMany(BillingPayment, [
    {
      id: "pay_demo_1",
      ownerId: "usr_demo_teacher",
      plan: "pro",
      amount: 1200,
      method: "bkash",
      transactionId: "DEMO-TXN-001",
      status: "approved",
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ]);

  await upsertMany(Coupon, [
    {
      id: "coupon_demo_1",
      code: "WELCOME20",
      discountPercent: 20,
      active: true,
      createdBy: "usr_demo_admin",
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ]);

  console.log("Database seeded successfully.");
  console.log(`Demo teacher: teacher@examcraft.app / ${DEMO_PASSWORD}`);
  console.log(`Demo admin: admin@examcraft.app / ${DEMO_PASSWORD}`);
}

seed()
  .catch((error) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
