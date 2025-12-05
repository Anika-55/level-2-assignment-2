import { Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middlewares/auth";

// Create Vehicle (Admin)
export const createVehicle = async (req: AuthRequest, res: Response) => {
  const { vehicle_name, type, registration_number, daily_rent_price, availability_status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO vehicles(vehicle_name,type,registration_number,daily_rent_price,availability_status)
       VALUES($1,$2,$3,$4,$5) RETURNING *`,
      [vehicle_name,type,registration_number,daily_rent_price,availability_status || 'available']
    );
    res.status(201).json({ success: true, message: "Vehicle created successfully", data: result.rows[0] });
  } catch (err:any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get All Vehicles (Public)
export const getAllVehicles = async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM vehicles`);
    res.status(200).json({ success: true, data: result.rows });
  } catch (err:any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Vehicle by ID (Public)
export const getVehicleById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM vehicles WHERE id=$1`, [id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: "Vehicle not found" });
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err:any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Vehicle (Admin)
export const updateVehicle = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { vehicle_name, type, registration_number, daily_rent_price, availability_status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE vehicles SET vehicle_name=$1,type=$2,registration_number=$3,daily_rent_price=$4,availability_status=$5
       WHERE id=$6 RETURNING *`,
      [vehicle_name, type, registration_number, daily_rent_price, availability_status, id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: "Vehicle not found" });
    res.status(200).json({ success: true, message: "Vehicle updated successfully", data: result.rows[0] });
  } catch (err:any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete Vehicle (Admin)
export const deleteVehicle = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`DELETE FROM vehicles WHERE id=$1 RETURNING *`, [id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: "Vehicle not found" });
    res.status(200).json({ success: true, message: "Vehicle deleted successfully" });
  } catch (err:any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
