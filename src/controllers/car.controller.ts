import { AuthRequest } from "../middlewares/auth";
import { Response } from "express";
import { pool } from "../config/db";

// Add new car (Admin only)
export const addCar = async (req: AuthRequest, res: Response) => {
  const { brand, model, year, price_per_day, available } = req.body;

  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Only admin can add cars" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO cars (brand, model, year, price_per_day, available)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [brand, model, year, price_per_day, available ?? true]
    );

    res.status(201).json({ success: true, message: "Car added", data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all cars
export const getAllCars = async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM cars");
    res.status(200).json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get car by ID
export const getCarById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM cars WHERE id=$1", [id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: "Car not found" });
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update car (Admin only)
export const updateCar = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { brand, model, year, price_per_day, available } = req.body;

  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Only admin can update cars" });
  }

  try {
    const result = await pool.query(
      `UPDATE cars SET brand=$1, model=$2, year=$3, price_per_day=$4, available=$5
       WHERE id=$6 RETURNING *`,
      [brand, model, year, price_per_day, available, id]
    );

    if (!result.rows.length) return res.status(404).json({ success: false, message: "Car not found" });

    res.status(200).json({ success: true, message: "Car updated", data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete car (Admin only)
export const deleteCar = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Only admin can delete cars" });
  }

  try {
    const result = await pool.query("DELETE FROM cars WHERE id=$1 RETURNING *", [id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: "Car not found" });

    res.status(200).json({ success: true, message: "Car deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
