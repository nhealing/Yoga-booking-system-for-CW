// middlewares/demoUser.js
import jwt from 'jsonwebtoken';

// Middleware to attach user info from JWT token to req.user and res.locals.user
// If no valid token exists the user will be set to null (anonymous user/logged out)
export const attachDemoUser = (req, res, next) => {
  const token = req.cookies?.jwt;
  if (token) {
    try {
      // Verify and decode the JWT token
      const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      // Attach to req so it can be used in controllers
      req.user = payload;
      // Also attach to res.locals so it can be used in views
      res.locals.user = payload;
      // A check if the user is an organiser for conditional features in the header template
      res.locals.user.isOrganiser = payload.role === 'organiser'; 
    } catch {
      // If the token is invalid or expire the user is treated as not logged in
      req.user = null;
      res.locals.user = null;
    }
  } else {
    // If no token is present the user is treated as not logged in
    req.user = null;
    res.locals.user = null;
  }
  next();
};