This project was developed as part of Web Application Development 2 coursework.

# Yoga Booking System

This is a web application for a Yoga & Mindfulness Studio booking system.  
It was built using Node.js, Express, Mustache templates and NeDB.

---

## Live Site

https://yoga-booking-system-for-cw.onrender.com/

Note: The live site is hosted on Render.com free tier and may take 30-60 seconds to load on first visit.

---

## How to run the project

1. Install dependencies:

npm install


2. Create a `.env` file in the root folder with:

PORT=3000
NODE_ENV=development
ACCESS_TOKEN_SECRET=your-secret-key


3. Seed the database:

npm run seed


4. Start the server:

npm start


5. Open in browser:

http://localhost:3000

---

### Test Accounts

- Organiser  
  Email: organiser@yoga.local  
  Password: organiser123  

- Student  
  Email: fiona@student.local  
  Password: student123  

Or create a new account using the Register page.

---

## Features implemented

### Public
- View homepage with available courses
- Browse and filter courses by level, type and drop-in availability
- Search courses by title or description
- View course details, sessions, price and location

### Users
- Register and login
- Book full courses
- Book individual drop-in sessions where available
- View booking confirmation with status

### Organiser
- Organiser dashboard
- Add, edit and delete courses including price and location
- Add and delete sessions
- View class lists with participant names and booking status
- Add and delete organiser accounts
- Remove user accounts

---

## Testing

Run tests with:

npm test

Note: Make sure the server is not running before running tests.

All 21 tests should pass.