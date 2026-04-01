// seed/seed.js
import {
  initDb,
  usersDb,
  coursesDb,
  sessionsDb,
  bookingsDb,
} from "../models/_db.js";
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";
import { UserModel } from "../models/userModel.js";

const iso = (d) => new Date(d).toISOString();

async function wipeAll() {
  // Remove all documents to guarantee a clean seed
  await Promise.all([
    usersDb.remove({}, { multi: true }),
    coursesDb.remove({}, { multi: true }),
    sessionsDb.remove({}, { multi: true }),
    bookingsDb.remove({}, { multi: true }),
  ]);
  // Compact files so you’re not looking at stale data on disk
  await Promise.all([
    usersDb.compactDatafile(),
    coursesDb.compactDatafile(),
    sessionsDb.compactDatafile(),
    bookingsDb.compactDatafile(),
  ]);
}

async function ensureDemoStudent() {
  const bcrypt = await import("bcrypt");
  const hash = await bcrypt.default.hash("student123", 10);

  let student = await UserModel.findByEmail("fiona@student.local");
  if (!student) {
    student = await UserModel.create({
      name: "Fiona",
      email: "fiona@student.local",
      password: hash,
      role: "student",

    });
  }
  return student;
}

async function createWeekendWorkshop() {
  const instructor = await UserModel.create({
    name: "Maya",
    email: "maya@yoga.local",
    role: "instructor",
  });
  const course = await CourseModel.create({
    title: "Spring Mindfulness Retreat",
    level: "beginner",
    type: "WEEKEND_WORKSHOP",
    allowDropIn: false,
    startDate: "2026-05-09",
    endDate: "2026-05-10",
    price: 120,
    location: "Glasgow Yoga Centre, 15 Bath Street, Glasgow, G2 1HY",
    instructorId: instructor._id,
    sessionIds: [],
    description: "A rejuvenating weekend retreat combining mindfulness meditation, restorative yoga and breathing exercises.",
  });

  const base = new Date("2026-05-09T09:00:00"); // Saturday 9am
  const sessions = [];
  for (let i = 0; i < 5; i++) {
    const start = new Date(base.getTime() + i * 2 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 90 * 60 * 1000); // 90 min sessions
    const s = await SessionModel.create({
      courseId: course._id,
      startDateTime: iso(start),
      endDateTime: iso(end),
      capacity: 12,
      bookedCount: 0,
    });
    sessions.push(s);
  }
  await CourseModel.update(course._id, {
    sessionIds: sessions.map((s) => s._id),
  });
  return { course, sessions, instructor };
}

async function createWeeklyBlock() {
  const instructor = await UserModel.create({
    name: "Sarah",
    email: "sarah@yoga.local",
    role: "instructor",
  });
  const course = await CourseModel.create({
    title: "Beginner Hatha Yoga",
    level: "beginner",
    type: "WEEKLY_BLOCK",
    allowDropIn: true,
    startDate: "2026-04-07",
    endDate: "2026-06-23",
    price: 12,
    location: "Glasgow Yoga Centre, 15 Bath Street, Glasgow, G2 1HY",
    instructorId: instructor._id,
    sessionIds: [],
    description: "A gentle introduction to yoga postures, breathing techniques and relaxation.",
  });

  const first = new Date("2026-04-07T18:00:00"); // Tuesday 6pm
  const sessions = [];
  for (let i = 0; i < 12; i++) {
    const start = new Date(first.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour sessions
    const s = await SessionModel.create({
      courseId: course._id,
      startDateTime: iso(start),
      endDateTime: iso(end),
      capacity: 15,
      bookedCount: 0,
    });
    sessions.push(s);
  }
  await CourseModel.update(course._id, {
    sessionIds: sessions.map((s) => s._id),
  });
  return { course, sessions, instructor };
}

async function verifyAndReport() {
  const [users, courses, sessions, bookings] = await Promise.all([
    usersDb.count({}),
    coursesDb.count({}),
    sessionsDb.count({}),
    bookingsDb.count({}),
  ]);
  console.log("— Verification —");
  console.log("Users   :", users);
  console.log("Courses :", courses);
  console.log("Sessions:", sessions);
  console.log("Bookings:", bookings);
  if (courses === 0 || sessions === 0) {
    throw new Error("Seed finished but no courses/sessions were created.");
  }
}

async function createOrganiser() {
  const bcrypt = await import("bcrypt");
  const hash = await bcrypt.default.hash("organiser123", 10);
  await UserModel.create({
    name: "Studio Admin",
    email: "organiser@yoga.local",
    password: hash,
    role: "organiser",
  });
  console.log("Organiser seeded: organiser@yoga.local / organiser123");
}

async function run() {
  console.log("Initializing DB…");
  await initDb();

  console.log("Wiping existing data…");
  await wipeAll();

  console.log("Creating demo student…");
  const student = await ensureDemoStudent();

  console.log("Creating weekend workshop…");
  const w = await createWeekendWorkshop();

  console.log("Creating weekly block…");
  const b = await createWeeklyBlock();

  console.log("Creating organiser…");
  await createOrganiser();

  await verifyAndReport();

  console.log("\n✅ Seed complete.");
  console.log("Student ID           :", student._id);
  console.log(
    "Workshop course ID   :",
    w.course._id,
    "(sessions:",
    w.sessions.length + ")"
  );
  console.log(
    "Weekly block course ID:",
    b.course._id,
    "(sessions:",
    b.sessions.length + ")"
  );
}

run().catch((err) => {
  console.error("❌ Seed failed:", err?.stack || err);
  process.exit(1);
});
