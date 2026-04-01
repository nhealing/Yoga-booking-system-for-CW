// routes/views.js
import { Router } from "express";
import {
  homePage,
  courseDetailPage,
  courseBookPage,
  sessionBookPage,
  postBookCourse,
  postBookSession,
  bookingConfirmationPage,
} from "../controllers/viewsController.js";
import { coursesListPage } from "../controllers/coursesListController.js";
import { verify } from "../auth/auth.js";

const router = Router();

router.get("/", homePage);
router.get("/courses", coursesListPage);
router.get("/courses/:id", courseDetailPage);
router.get("/courses/:id/book", verify, courseBookPage);      
router.post("/courses/:id/book", verify, postBookCourse);     
router.get("/sessions/:id/book", verify, sessionBookPage);   
router.post("/sessions/:id/book", verify, postBookSession);   
router.get("/bookings/:bookingId", bookingConfirmationPage);

export default router;