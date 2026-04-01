This project was developed as part of Web Application Development 2 coursework.

# Yoga Booking System

This is a web application for a Yoga & Mindfulness Studio booking system.  
It was built using Node.js, Express, Mustache templates and NeDB.

---

## Live Site

https://yoga-booking-system-for-cw.onrender.com/

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

### Test Accounts

- Organiser  
  Email: organiser@yoga.local  
  Password: organiser123  

- Student  
   Email: fiona@student.local
   Password: student123

  Or create a new account using the Register page

---

## Features implemented

### Public
- View homepage with available courses  
- Browse courses  
- View course details and sessions  

### Users
- Register and login  
- Book full courses  
- Book individual sessions (if allowed)  
- Booking confirmation  

### Organiser
- Organiser dashboard  
- Add, edit and delete courses  
- Manage sessions  
- View class lists  
- Manage users  

---

## Testing

Run tests with:

npm test


All tests should pass.