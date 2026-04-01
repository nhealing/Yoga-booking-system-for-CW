// routes/auth.js
import { Router } from 'express';
import { login } from '../auth/auth.js';
import {
  show_register,
  post_register,
  show_login,
  handle_login,
  logout
} from '../controllers/authController.js';

const router = Router();

router.get('/register', show_register);
router.post('/register', post_register);

router.get('/login', show_login);
router.post('/login', login, handle_login); // login middleware runs first

router.get('/logout', logout);

export default router;