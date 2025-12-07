import { AuthRequest } from "../middlewares/auth";
import { Response } from "express";
import { pool } from "../config/db";

// Create a booking
export const createBooking = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });

  const { vehicle_id, rent_start_date, rent_end_date } = req.body;
  const customer_id = req.user.id;

  try {
    // 1️⃣ Check if vehicle exists and is available
    const vehicleResult = await pool.query(
      "SELECT * FROM vehicles WHERE id=$1 AND availability_status='available'",
      [vehicle_id]
    );
    const vehicle = vehicleResult.rows[0];
    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found or not available" });
    }

    // 2️⃣ Check overlapping bookings
    const overlapQuery = await pool.query(
      `SELECT * FROM bookings
       WHERE vehicle_id=$1
       AND status IN ('active','pending')
       AND rent_start_date <= $3 AND rent_end_date >= $2`,
      [vehicle_id, rent_start_date, rent_end_date]
    );
    if (overlapQuery.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Vehicle already booked for selected dates" });
    }

    // 3️⃣ Calculate total price
    const start = new Date(rent_start_date);
    const end = new Date(rent_end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const total_price = days * vehicle.daily_rent_price;

    // 4️⃣ Insert booking
    const bookingResult = await pool.query(
      `INSERT INTO bookings (customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status)
       VALUES ($1,$2,$3,$4,$5,'active') RETURNING *`,
      [customer_id, vehicle_id, rent_start_date, rent_end_date, total_price]
    );

    // 5️⃣ Update vehicle status to "booked"
    await pool.query("UPDATE vehicles SET availability_status='booked' WHERE id=$1", [vehicle_id]);

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: bookingResult.rows[0]
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get bookings
export const getBookings = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });

  try {
    let query = `
      SELECT b.*, u.name AS customer_name, v.vehicle_name, v.type, v.registration_number, v.daily_rent_price
      FROM bookings b
      JOIN users u ON b.customer_id=u.id
      JOIN vehicles v ON b.vehicle_id=v.id
    `;

    if (req.user.role === "customer") {
      query += ` WHERE b.customer_id=${req.user.id}`;
    }

    const result = await pool.query(query);
    res.status(200).json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update booking
export const updateBooking = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });

  const { bookingId } = req.params;
  const { status } = req.body;

  try {
    const bookingResult = await pool.query("SELECT * FROM bookings WHERE id=$1", [bookingId]);
    const booking = bookingResult.rows[0];
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    // Customer can only cancel their own booking before start date
    if (req.user.role === "customer") {
      if (booking.customer_id !== req.user.id) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
      if (status !== "cancelled") {
        return res.status(403).json({ success: false, message: "Customers can only cancel bookings" });
      }
      if (new Date(booking.rent_start_date) <= new Date()) {
        return res.status(400).json({ success: false, message: "Cannot cancel after rental has started" });
      }
    }

    // Admin can only mark as returned or cancelled
    if (req.user.role === "admin" && status !== "returned" && status !== "cancelled") {
      return res.status(400).json({ success: false, message: "Invalid status update" });
    }

    // Update booking status
    await pool.query("UPDATE bookings SET status=$1 WHERE id=$2", [status, bookingId]);

    // Update vehicle availability
    if (status === "cancelled" || status === "returned") {
      await pool.query("UPDATE vehicles SET availability_status='available' WHERE id=$1", [booking.vehicle_id]);
    }

    res.status(200).json({
      success: true,
      message: status === "cancelled" ? "Booking cancelled successfully" : "Booking marked as returned",
      data: { ...booking, status }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
