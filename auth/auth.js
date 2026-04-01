// auth/auth.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/userModel.js';

// Login Middleware
// Verifies credentials, issues JWT, and sets cookie
// This method runs before handle_login
export const login = async (req, res, next) => {
  try {
    // Extracting email and password from the form submission
    const { email, password } = req.body;

    // Reject if email or password is missing
    if (!email || !password) {
      return res.status(400).render('auth/login', {
        title: 'Sign In',
        error: 'Please enter your email and password.'
      });
    }

    // Look up the user in the database by email
    const user = await UserModel.findByEmail(email);

    // If the user is not in the db, show an error message
    if (!user) {
      return res.status(401).render('auth/login', {
        title: 'Sign In',
        error: 'No account found with that email. Please register first.'
      });
    }

    // Give an error if the user has no password
    if (!user.password) {
      return res.status(401).render('auth/login', {
        title: 'Sign In',
        error: 'Invalid account. Please register again.'
      });
    }

    // Compare the provided password with the hashed password in the database
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(403).render('auth/login', {
        title: 'Sign In',
        error: 'Incorrect password.'
      });
    }

    // If the password is correct, create a JWT token
    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
      console.error('ACCESS_TOKEN_SECRET is not set');
      return res.status(500).send('Server misconfiguration');
    }

    // Encode id, email AND role in the token
    const payload = { id: user._id, email: user.email, role: user.role, name: user.name };
    // Sign the token with the secret and set an expiration time of 2 hours
    const accessToken = jwt.sign(payload, secret, { expiresIn: '2h' });

    // Set the JWT as an HTTP-only cookie with appropriate security flags
    res.cookie('jwt', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 2 * 60 * 60 * 1000 // 2 hours
    });

    // Attaching the decoded user to req so that handle_login can read the role to redirect to the right page
    req.user = payload;

    // Proceed to handle_login in the controller
    return next(); 

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).send('Internal Server Error');
  }
};

// Verify any logged in user 
export const verify = (req, res, next) => {
  const accessToken = req.cookies?.jwt;
  if (!accessToken) {
    return res.redirect('/auth/login');
  }
  try {
    const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.user = payload; // { id, email, role, name }
    return next();
  } catch (e) {
    return res.redirect('/auth/login');
  }
};

// Verify organiser to make sure only organisers can access organiser pages
export const verifyOrganiser = (req, res, next) => {
  const accessToken = req.cookies?.jwt;
  if (!accessToken) {
    return res.redirect('/auth/login');
  }
  try {
    const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    // Reject access if the user's role is not an organiser
    if (payload.role !== 'organiser') {
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: 'This page is for organisers only.'
      });
    }
    req.user = payload;
    return next();
  } catch (e) {
    return res.redirect('/auth/login');
  }
};