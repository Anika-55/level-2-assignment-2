import { Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middlewares/auth";

// Create Vehicle (Admin only)
export const createVehicle = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user || user.role !== "admin")
    return res.status(403).json({ success: false, message: "Access denied" });

  const { vehicle_name, type, registration_number, daily_rent_price, availability_status } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO vehicles(vehicle_name,type,registration_number,daily_rent_price,availability_status)
       VALUES($1,$2,$3,$4,$5) RETURNING *`,
      [vehicle_name, type, registration_number, daily_rent_price, availability_status || "available"]
    );

    res.status(201).json({ success: true, message: "Vehicle created", data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all vehicles (Public)
export const getAllVehicles = async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM vehicles`);
    res.status(200).json({
      success: true,
      message: result.rows.length ? "Vehicles retrieved" : "No vehicles found",
      data: result.rows
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get vehicle by ID (Public)
export const getVehicleById = async (req: AuthRequest, res: Response) => {
  const { vehicleId } = req.params;

  try {
    const result = await pool.query(`SELECT * FROM vehicles WHERE id=$1`, [vehicleId]);
    if (!result.rows.length)
      return res.status(404).json({ success: false, message: "Vehicle not found" });

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Vehicle (Admin only)
export const updateVehicle = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user || user.role !== "admin")
    return res.status(403).json({ success: false, message: "Access denied" });

  const { vehicleId } = req.params;
  const { vehicle_name, type, registration_number, daily_rent_price, availability_status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE vehicles
       SET vehicle_name = COALESCE($1,vehicle_name),
           type = COALESCE($2,type),
           registration_number = COALESCE($3,registration_number),
           daily_rent_price = COALESCE($4,daily_rent_price),
           availability_status = COALESCE($5,availability_status)
       WHERE id=$6
       RETURNING *`,
      [vehicle_name, type, registration_number, daily_rent_price, availability_status, vehicleId]
    );

    if (!result.rows.length)
      return res.status(404).json({ success: false, message: "Vehicle not found" });

    res.status(200).json({ success: true, message: "Vehicle updated", data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete Vehicle (Admin only, no active bookings)
export const deleteVehicle = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  if (!user || user.role !== "admin")
    return res.status(403).json({ success: false, message: "Access denied" });

  const { vehicleId } = req.params;

  try {
    const bookings = await pool.query(
      `SELECT * FROM bookings WHERE vehicle_id=$1 AND status='active'`,
      [vehicleId]
    );

    if (bookings.rows.length)
      return res.status(400).json({ success: false, message: "Cannot delete vehicle with active bookings" });

    const result = await pool.query(`DELETE FROM vehicles WHERE id=$1 RETURNING *`, [vehicleId]);
    if (!result.rows.length)
      return res.status(404).json({ success: false, message: "Vehicle not found" });

    res.status(200).json({ success: true, message: "Vehicle deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
