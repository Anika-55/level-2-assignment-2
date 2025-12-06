import { AuthRequest } from "../middlewares/auth";
import { Response } from "express";
import { pool } from "../config/db";

// Create Booking (Customer/Admin)
export const createBooking = async (req: AuthRequest, res: Response) => {
  const { car_id, rent_start_date, rent_end_date } = req.body;
  const customer_id = req.user.id;

  try {
    // Check car exists & available
    const carResult = await pool.query("SELECT * FROM cars WHERE id=$1", [car_id]);
    const car = carResult.rows[0];

    if (!car) {
      return res.status(404).json({ success: false, message: "Car not found" });
    }

    // Prevent overlapping bookings
    const overlapQuery = await pool.query(
      `SELECT * FROM bookings 
       WHERE car_id=$1 
       AND status IN ('approved', 'ongoing') 
       AND (
            rent_start_date <= $3
            AND rent_end_date >= $2
           )`,
      [car_id, rent_start_date, rent_end_date]
    );

    if (overlapQuery.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "This car is already booked during selected dates"
      });
    }

    // Calculate total price
    const start = new Date(rent_start_date);
    const end = new Date(rent_end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const total_price = days * car.price_per_day;

    // Insert booking (status pending)
    const bookingResult = await pool.query(
      `INSERT INTO bookings (customer_id, car_id, rent_start_date, rent_end_date, total_price, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [customer_id, car_id, rent_start_date, rent_end_date, total_price]
    );

    res.status(201).json({
      success: true,
      message: "Booking created, waiting for approval",
      data: bookingResult.rows[0]
    });

  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// View Bookings
export const getBookings = async (req: AuthRequest, res: Response) => {
  try {
    let query = `
      SELECT b.*, u.name AS customer_name,
             c.brand, c.model, c.price_per_day
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN cars c ON b.car_id = c.id
    `;

    // Customers only see their own bookings
    if (req.user.role === "customer") {
      query += ` WHERE b.customer_id=${req.user.id}`;
    }

    const result = await pool.query(query);
    res.status(200).json({ success: true, data: result.rows });

  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Booking Status (Admin/Customer - Cancel only)
export const updateBooking = async (req: AuthRequest, res: Response) => {
  const { bookingId } = req.params;
  const { status } = req.body;

  try {
    const bookingResult = await pool.query("SELECT * FROM bookings WHERE id=$1", [bookingId]);
    const booking = bookingResult.rows[0];

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Customer restrictions
    if (req.user.role === "customer") {
      if (status !== "cancelled") {
        return res.status(403).json({
          success: false,
          message: "Customers can only cancel bookings"
        });
      }
      if (new Date(booking.rent_start_date) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Cannot cancel after rental has started"
        });
      }
    }

    // Update booking status
    await pool.query("UPDATE bookings SET status=$1 WHERE id=$2", [status, bookingId]);

    // Make car available again if returned/cancelled
    if (status === "returned" || status === "cancelled") {
      await pool.query("UPDATE cars SET available=true WHERE id=$1", [booking.car_id]);
    }

    res.status(200).json({
      success: true,
      message: "Booking status updated",
      data: { ...booking, status }
    });

  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
