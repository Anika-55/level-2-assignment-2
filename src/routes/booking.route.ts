import { Router } from "express";
import { auth } from "../middlewares/auth";
import {
  createBooking,
  getBookings,
  updateBooking
} from "../controllers/booking.controller";

const router = Router();

// Protected routes for bookings
router.post("/", auth, createBooking);
router.get("/", auth, getBookings);
router.put("/:bookingId", auth, updateBooking);

export default router;
