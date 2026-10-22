import mongoose from "mongoose";
import { env } from "./config/env.js";
import { AcademicClassModel, SubjectModel, ChapterModel } from "./modules/curriculum/curriculum.models.js";
import { getBengaliClass, getBengaliSubject, getBengaliChapter } from "./modules/curriculum/curriculumBengali.js";

async function migrate() {
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected successfully.");

  // 1. Classes
  const classes = await AcademicClassModel.find({});
  console.log(`Found ${classes.length} classes to check/update.`);
  let updatedClasses = 0;
  for (const c of classes) {
    const bn = getBengaliClass(c.name);
    await AcademicClassModel.updateOne({ _id: c._id }, { $set: { nameBn: bn } });
    updatedClasses++;
  }
  console.log(`Updated ${updatedClasses} classes with Bengali names.`);

  // 2. Subjects
  const subjects = await SubjectModel.find({});
  console.log(`Found ${subjects.length} subjects to check/update.`);
  let updatedSubjects = 0;
  for (const s of subjects) {
    const bn = getBengaliSubject(s.name);
    await SubjectModel.updateOne({ _id: s._id }, { $set: { nameBn: bn } });
    updatedSubjects++;
  }
  console.log(`Updated ${updatedSubjects} subjects with Bengali names.`);

  // 3. Chapters
  const chapters = await ChapterModel.find({});
  console.log(`Found ${chapters.length} chapters to check/update.`);
  let updatedChapters = 0;
  for (const ch of chapters) {
    const bn = getBengaliChapter(ch.name);
    await ChapterModel.updateOne({ _id: ch._id }, { $set: { nameBn: bn } });
    updatedChapters++;
  }
  console.log(`Updated ${updatedChapters} chapters with Bengali names.`);

  console.log("\nMigration completed successfully!");
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
