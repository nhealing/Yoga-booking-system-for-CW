// controllers/authController.js
import bcrypt from 'bcrypt';
import { UserModel } from '../models/userModel.js';

// Number of bcrypt salt rounds for hashing passwords
const SALT_ROUNDS = 10;

// GET /auth/register
// Renders the registration form
export const show_register = (req, res) => {
  res.render('auth/register', { title: 'Register' });
};

// POST /auth/register
// Validates new registrations, creates a new user, and redirects to login
export const post_register = async (req, res) => {
  const { name, email, pass } = req.body;

  // Checks that all fields are filled in and that the password is at least 8 characters long
  if (!name || !email || !pass) {
    return res.status(400).render('auth/register', {
      title: 'Register',
      error: 'All fields are required.'
    });
  }

  // Enforce a minimum password length of 8 characters
  if (pass.length < 8) {
    return res.status(400).render('auth/register', {
      title: 'Register',
      error: 'Password must be at least 8 characters.'
    });
  }

  try {
    // Check if a user with the same email already exists
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(400).render('auth/register', {
        title: 'Register',
        error: `An account with email "${email}" already exists.`
      });
    }

    // Hash the password and create a new user in the database
    const hashedPassword = await bcrypt.hash(pass, SALT_ROUNDS);
    // Create the newly registered user with the role student
    await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role: 'student' // self-registered users are always students
    });

    // Redirect to the login page after successful registration
    res.redirect('/auth/login');
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).send('Internal Server Error');
  }
};

// GET /auth/login
// Renders the login form
export const show_login = (req, res) => {
  res.render('auth/login', { title: 'Sign In' });
};

// POST /auth/login — runs after auth middleware
// Redirects users to the appropriate page based on their role
export const handle_login = (req, res) => {
  // req.user is set by the login middleware in auth.js
  if (req.user?.role === 'organiser') {
    return res.redirect('/organiser');
  }
  res.redirect('/courses');
};

// GET /auth/logout
export const logout = (req, res) => {
  // Clearing the cookie effectively logs the user out and redirects to the homepage
  res.clearCookie('jwt').redirect('/');
};