import { Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middlewares/auth";
import bcrypt from "bcrypt";

// GET all users (Admin only)
export const getAllUsers = async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`SELECT id, name, email, phone, role FROM users`);
    res.status(200).json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE user
export const updateUser = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { name, email, phone, password, role } = req.body;

  // Only admin can update role; users can update themselves
  if (req.user.role !== "admin" && req.user.id !== parseInt(userId)) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    let hashedPassword = undefined;
    if (password) hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1,name),
           email = COALESCE($2,email),
           phone = COALESCE($3,phone),
           password = COALESCE($4,password),
           role = CASE WHEN $5 IS NOT NULL AND $6 = 'admin' THEN $5 ELSE role END
       WHERE id=$7
       RETURNING id,name,email,phone,role`,
      [name, email, phone, hashedPassword, role, req.user.role, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User updated successfully", data: result.rows[0] });

  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE user (Admin only, only if no active bookings)
export const deleteUser = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;

  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    // Check for active bookings
    const bookings = await pool.query(
      `SELECT * FROM bookings WHERE customer_id=$1 AND status='active'`,
      [userId]
    );

    if (bookings.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Cannot delete user with active bookings" });
    }

    const result = await pool.query(
      `DELETE FROM users WHERE id=$1 RETURNING id,name,email,role`,
      [userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User deleted successfully" });

  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
