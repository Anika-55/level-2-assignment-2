import { Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middlewares/auth";
import bcrypt from "bcrypt";

// GET all users (Admin only)
export const getAllUsers = async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, role FROM users`
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE USER
export const updateUser = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { name, email, phone, password, role } = req.body;

  // Authorization: Admin can update anyone; user can update only self
  if (req.user.role !== "admin" && req.user.id !== parseInt(userId)) {
    return res
      .status(403)
      .json({ success: false, message: "Access denied" });
  }

  try {
    let hashedPassword = undefined;
    if (password) hashedPassword = await bcrypt.hash(password, 10);

    // Decide role update
    const newRole =
      req.user.role === "admin" && role ? role : undefined;

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           password = COALESCE($4, password),
           role = COALESCE($5, role)
       WHERE id = $6
       RETURNING id, name, email, phone, role`,
      [name, email, phone, hashedPassword, newRole, userId]
    );

    if (!result.rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: result.rows[0],
    });

  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE user (Admin only)
export const deleteUser = async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;

  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Access denied" });
  }

  try {
    // Check active rentals (prevent deletion)
    const rentals = await pool.query(
      `SELECT 1 FROM rentals WHERE user_id = $1 AND end_date >= CURRENT_DATE`,
      [userId]
    );

    if (rentals.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete user with active bookings",
      });
    }

    const result = await pool.query(
      `DELETE FROM users 
       WHERE id = $1 
       RETURNING id, name, email, role`,
      [userId]
    );

    if (!result.rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: result.rows[0],
    });

  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
