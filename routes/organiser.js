// routes/organiser.js
import { Router } from 'express';
import { verifyOrganiser } from '../auth/auth.js';
import {
  dashboard, showAddCourse, addCourse,
  showEditCourse, editCourse, deleteCourse,
  listSessions, classList,
  listUsers, deleteUser, showAddOrganiser, addOrganiser,
  showAddSession, addSession,
  deleteSession    // ← add this
} from '../controllers/organiserController.js';
const router = Router();

// All organiser routes are protected
router.use(verifyOrganiser);

router.get('/', dashboard);

// Course CRUD
router.get('/courses/new', showAddCourse);
router.post('/courses', addCourse);
router.get('/courses/:id/edit', showEditCourse);
router.post('/courses/:id/edit', editCourse);
router.post('/courses/:id/delete', deleteCourse);

// Sessions and class list
router.get('/courses/:id/sessions', listSessions);
router.get('/courses/:id/classlist', classList);
router.get('/courses/:id/sessions/new', showAddSession);
router.post('/courses/:id/sessions', addSession);
router.post('/sessions/:id/delete', deleteSession);

// User management
router.get('/users', listUsers);
router.post('/users/:id/delete', deleteUser);
router.get('/users/new', showAddOrganiser);
router.post('/users/new', addOrganiser);

export default router;