// controllers/viewsController.js
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";
import {
  bookCourseForUser,
  bookSessionForUser,
} from "../services/bookingService.js";
import { BookingModel } from "../models/bookingModel.js";

const fmtDate = (iso) =>
  new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
const fmtDateOnly = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
const fmtType = (type) => {
  const types = {
    'WEEKLY_BLOCK': 'Weekly Block',
    'WEEKEND_WORKSHOP': 'Weekend Workshop'
  };
  return types[type] || type;
};

export const homePage = async (req, res, next) => {
  try {
    const courses = await CourseModel.list();
    const cards = await Promise.all(
      courses.map(async (c) => {
        const sessions = await SessionModel.listByCourse(c._id);
        const nextSession = sessions[0];
        return {
          id: c._id,
          title: c.title,
          level: c.level,
          type: fmtType(c.type),
          allowDropIn: c.allowDropIn,
          startDate: c.startDate ? fmtDateOnly(c.startDate) : "",
          endDate: c.endDate ? fmtDateOnly(c.endDate) : "",
          nextSession: nextSession ? fmtDate(nextSession.startDateTime) : "TBA",
          sessionsCount: sessions.length,
          description: c.description,
        };
      })
    );
    res.render("home", { title: "Yoga Courses", courses: cards });
  } catch (err) {
    next(err);
  }
};

export const courseDetailPage = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const course = await CourseModel.findById(courseId);
    if (!course)
      return res
        .status(404)
        .render("error", { title: "Not found", message: "Course not found" });

    const sessions = await SessionModel.listByCourse(courseId);
    const rows = sessions.map((s) => ({
      id: s._id,
      start: fmtDate(s.startDateTime),
      end: fmtDate(s.endDateTime),
      capacity: s.capacity,
      booked: s.bookedCount ?? 0,
      remaining: Math.max(0, (s.capacity ?? 0) - (s.bookedCount ?? 0)),
      allowDropIn: course.allowDropIn === true || course.allowDropIn === 'on',
      user: req.user ? { _id: req.user.id } : null,
    }));

    res.render("course", {
      title: course.title,
      course: {
        id: course._id,
        title: course.title,
        level: course.level,
        type: fmtType(course.type),
        allowDropIn: course.allowDropIn,
        startDate: course.startDate ? fmtDateOnly(course.startDate) : "",
        endDate: course.endDate ? fmtDateOnly(course.endDate) : "",
        description: course.description,
        price: course.price ? `£${course.price}` : "Contact us for pricing",
        location: course.location || "Location TBC",
      },
      sessions: rows,
    });
  } catch (err) {
    next(err);
  }
};

export const postBookCourse = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id || req.user._id;  // ← fix this line
    const booking = await bookCourseForUser(userId, courseId);
    res.redirect(`/bookings/${booking._id}?status=${booking.status}`);
  } catch (err) {
    res.status(400).render("error", { title: "Booking failed", message: err.message });
  }
};

export const postBookSession = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id || req.user._id;  // ← fix this line
    const booking = await bookSessionForUser(userId, sessionId);
    res.redirect(`/bookings/${booking._id}?status=${booking.status}`);
  } catch (err) {
    const message = err.code === "DROPIN_NOT_ALLOWED"
      ? "Drop-ins are not allowed for this course."
      : err.message;
    res.status(400).render("error", { title: "Booking failed", message });
  }
};

export const bookingConfirmationPage = async (req, res, next) => {
  try {
    const bookingId = req.params.bookingId;
    const booking = await BookingModel.findById(bookingId);
    if (!booking)
      return res
        .status(404)
        .render("error", { title: "Not found", message: "Booking not found" });

    res.render("booking_confirmation", {
      title: "Booking confirmation",
      booking: {
        id: booking._id,
        type: booking.type,
        status: req.query.status || booking.status,
        createdAt: booking.createdAt ? fmtDate(booking.createdAt) : "",
      },
    });
  } catch (err) {
    next(err);
  }
};

export const courseBookPage = async (req, res, next) => {
  try {
    const course = await CourseModel.findById(req.params.id);
    if (!course)
      return res.status(404).render("error", { title: "Not found", message: "Course not found" });
    const sessions = await SessionModel.listByCourse(course._id);
    const rows = sessions.map((s) => ({
      start: fmtDate(s.startDateTime),
      remaining: Math.max(0, (s.capacity ?? 0) - (s.bookedCount ?? 0)),
    }));
    res.render("course_book", {
      title: `Book: ${course.title}`,
      course: {
        id: course._id,
        title: course.title,
        level: course.level,
        type: course.type,
        allowDropIn: course.allowDropIn,
        description: course.description,
        startDate: course.startDate ? fmtDateOnly(course.startDate) : "",
        endDate: course.endDate ? fmtDateOnly(course.endDate) : "",
      },
      sessions: rows,
      sessionsCount: rows.length,
      user: req.user || null,
    });
  } catch (err) { next(err); }
};

export const sessionBookPage = async (req, res, next) => {
  try {
    const session = await SessionModel.findById(req.params.id);
    if (!session)
      return res.status(404).render("error", { title: "Not found", message: "Session not found" });
    const course = await CourseModel.findById(session.courseId);
    res.render("session_book", {
      title: "Book Session",
      session: {
        id: session._id,
        start: fmtDate(session.startDateTime),
        end: fmtDate(session.endDateTime),
        remaining: Math.max(0, (session.capacity ?? 0) - (session.bookedCount ?? 0)),
      },
      course: course ? { id: course._id, title: course.title } : null,
      user: req.user || null,
    });
  } catch (err) { next(err); }
};