// controllers/organiserController.js
import { CourseModel } from '../models/courseModel.js';
import { SessionModel } from '../models/sessionModel.js';
import { BookingModel } from '../models/bookingModel.js';
import { UserModel } from '../models/userModel.js';
import bcrypt from 'bcrypt';

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    weekday: 'short', year: 'numeric', month: 'short',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

const fmtType = (type) => {
  const types = {
    'WEEKLY_BLOCK': 'Weekly Block',
    'WEEKEND_WORKSHOP': 'Weekend Workshop'
  };
  return types[type] || type;
};

// GET /organiser
export const dashboard = async (req, res, next) => {
  try {
    const courses = await CourseModel.list();
    const enriched = await Promise.all(courses.map(async (c) => {
      const sessions = await SessionModel.listByCourse(c._id);
      return {
        id: c._id,
        title: c.title,
        level: c.level,
        type: fmtType(c.type),
        sessionsCount: sessions.length
      };
    }));
    res.render('organiser/dashboard', { title: 'Organiser Dashboard', user: req.user, courses: enriched });
  } catch (err) { next(err); }
};

// GET /organiser/courses/new
export const showAddCourse = (req, res) => {
  res.render('organiser/course_form', { title: 'Add Course', user: req.user });
};

// POST /organiser/courses
export const addCourse = async (req, res, next) => {
  try {
    const { title, description, level, type, allowDropIn, startDate, endDate, price, location } = req.body;
    await CourseModel.create({
      title, description, level, type,
      allowDropIn: allowDropIn === 'on' || allowDropIn === true,
      startDate, endDate,
      price: parseFloat(price) || 0,
      location,
      sessionIds: []
    });
    res.redirect('/organiser');
  } catch (err) { next(err); }
};

// GET /organiser/courses/:id/edit
export const showEditCourse = async (req, res, next) => {
  try {
    const course = await CourseModel.findById(req.params.id);
    if (!course) return res.status(404).render('error', { title: 'Not found', message: 'Course not found' });
    res.render('organiser/course_form', { title: 'Edit Course', user: req.user, course: { ...course, id: course._id } });
  } catch (err) { next(err); }
};

// POST /organiser/courses/:id/edit
export const editCourse = async (req, res, next) => {
  try {
    const { title, description, level, type, allowDropIn, startDate, endDate, price, location } = req.body;
    await CourseModel.update(req.params.id, {
      title, description, level, type,
      allowDropIn: allowDropIn === 'on' || allowDropIn === true,
      startDate, endDate,
      price: parseFloat(price) || 0,
      location
    });
    res.redirect('/organiser');
  } catch (err) { next(err); }
};

// POST /organiser/courses/:id/delete
export const deleteCourse = async (req, res, next) => {
  try {
    const sessions = await SessionModel.listByCourse(req.params.id);
    for (const s of sessions) {
      await SessionModel.deleteById(s._id);
    }
    await CourseModel.deleteById(req.params.id);
    res.redirect('/organiser');
  } catch (err) { next(err); }
};

// GET /organiser/courses/:id/sessions
export const listSessions = async (req, res, next) => {
  try {
    const course = await CourseModel.findById(req.params.id);
    if (!course) return res.status(404).render('error', { title: 'Not found', message: 'Course not found' });
    const sessions = await SessionModel.listByCourse(req.params.id);
    const rows = sessions.map(s => ({
      id: s._id, start: fmtDate(s.startDateTime), end: fmtDate(s.endDateTime),
      capacity: s.capacity, booked: s.bookedCount ?? 0
    }));
    res.render('organiser/sessions', { title: `Sessions: ${course.title}`, user: req.user, course: { id: course._id, title: course.title }, sessions: rows });
  } catch (err) { next(err); }
};

// GET /organiser/courses/:id/classlist
export const classList = async (req, res, next) => {
  try {
    const course = await CourseModel.findById(req.params.id);
    if (!course) return res.status(404).render('error', { title: 'Not found', message: 'Course not found' });
    const bookings = await BookingModel.listByCourse(req.params.id);
    const participants = await Promise.all(bookings.map(async (b) => {
      const user = await UserModel.findById(b.userId);
      return {
        name: user?.name || 'Unknown',
        email: user?.email || 'Unknown',
        status: b.status,
        type: b.type
      };
    }));
    res.render('organiser/classlist', {
      title: `Class List: ${course.title}`,
      user: req.user,
      course: { id: course._id, title: course.title },
      participants
    });
  } catch (err) { next(err); }
};

// GET /organiser/users
export const listUsers = async (req, res, next) => {
  try {
    const users = await UserModel.findAll();
    const rows = users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role }));
    res.render('organiser/users', { title: 'Manage Users', user: req.user, users: rows });
  } catch (err) { next(err); }
};

// POST /organiser/users/:id/delete
export const deleteUser = async (req, res, next) => {
  try {
    await UserModel.deleteById(req.params.id);
    res.redirect('/organiser/users');
  } catch (err) { next(err); }
};

// GET /organiser/users/new
export const showAddOrganiser = (req, res) => {
  res.render('organiser/organiser_form', { title: 'Add Organiser', user: req.user });
};

// POST /organiser/users/new
export const addOrganiser = async (req, res, next) => {
  try {
    const { name, email, pass } = req.body;
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.render('organiser/organiser_form', { title: 'Add Organiser', user: req.user, error: 'Email already in use.' });
    }
    const hash = await bcrypt.hash(pass, 10);
    await UserModel.create({ name, email, password: hash, role: 'organiser' });
    res.redirect('/organiser/users');
  } catch (err) { next(err); }
};

// GET /organiser/courses/:id/sessions/new
export const showAddSession = async (req, res, next) => {
  try {
    const course = await CourseModel.findById(req.params.id);
    if (!course) return res.status(404).render('error', { title: 'Not found', message: 'Course not found' });
    res.render('organiser/session_form', { title: 'Add Session', user: req.user, course: { id: course._id, title: course.title } });
  } catch (err) { next(err); }
};

// POST /organiser/courses/:id/sessions
export const addSession = async (req, res, next) => {
  try {
    const { startDateTime, endDateTime, capacity } = req.body;
    const session = await SessionModel.create({
      courseId: req.params.id,
      startDateTime: new Date(startDateTime).toISOString(),
      endDateTime: new Date(endDateTime).toISOString(),
      capacity: parseInt(capacity),
      bookedCount: 0
    });
    const course = await CourseModel.findById(req.params.id);
    await CourseModel.update(req.params.id, {
      sessionIds: [...(course.sessionIds || []), session._id]
    });
    res.redirect(`/organiser/courses/${req.params.id}/sessions`);
  } catch (err) { next(err); }
};

// POST /organiser/sessions/:id/delete
export const deleteSession = async (req, res, next) => {
  try {
    // Get the session first so we know which course to redirect back to
    const session = await SessionModel.findById(req.params.id);
    if (!session) return res.status(404).render('error', { title: 'Not found', message: 'Session not found' });

    const courseId = session.courseId;

    // Delete the session from the database
    await SessionModel.deleteById(req.params.id);

    // Remove the session id from the course's sessionIds array
    const course = await CourseModel.findById(courseId);
    await CourseModel.update(courseId, {
      sessionIds: (course.sessionIds || []).filter(id => id !== req.params.id)
    });

    res.redirect(`/organiser/courses/${courseId}/sessions`);
  } catch (err) { next(err); }
};