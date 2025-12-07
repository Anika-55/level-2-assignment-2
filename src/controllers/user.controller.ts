import { Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middlewares/auth";
import bcrypt from "bcrypt";

// Get all users (admin only)
export const getAllUsers = async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`SELECT id, name, email, phone, role FROM users`);
    res.status(200).json({
      success: true,
      message: result.rows.length ? "Users retrieved" : "No users found",
      data: result.rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete user (admin only, only if no active bookings)
export const deleteUser = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;

  try {
    // Check for active bookings
    const bookings = await pool.query(
      "SELECT * FROM bookings WHERE customer_id=$1 AND status='active'",
      [userId]
    );

    if (bookings.rows.length) {
      return res.status(400).json({ success: false, message: "Cannot delete user with active bookings" });
    }

    const result = await pool.query("DELETE FROM users WHERE id=$1 RETURNING *", [userId]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// Update user
export const updateUser = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Not authenticated" });

  const { userId } = req.params;
  const { name, email, phone, password, role } = req.body;

  if (req.user.role !== "admin" && req.user.id !== parseInt(userId)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    const hashedPassword = password ? password /* hash if needed */ : undefined;

    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        password = COALESCE($4, password),
        role = COALESCE($5, role)
       WHERE id=$6
       RETURNING *`,
      [name, email, phone, hashedPassword, role, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User updated", data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
