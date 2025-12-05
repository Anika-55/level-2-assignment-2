import { Request, Response } from "express";
import { pool } from "../config/db";

export const addCar = async (req: Request, res: Response) => {
    const { brand, model, year, price_per_day } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO cars (brand, model, year, price_per_day)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [brand, model, year, price_per_day]
        );

        res.status(201).json({
            success: true,
            message: "Car added successfully",
            data: result.rows[0]
        });

    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};


export const getAllCars = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`SELECT * FROM cars`);
        res.status(200).json({ success: true, data: result.rows });

    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};


export const getCarById = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT * FROM cars WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ success: false, message: "Car not found" });

        res.status(200).json({ success: true, data: result.rows[0] });

    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};


export const updateCar = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { brand, model, year, price_per_day, available } = req.body;

    try {
        const result = await pool.query(
            `UPDATE cars 
            SET brand = $1, model = $2, year = $3, price_per_day = $4, available = $5
            WHERE id = $6
            RETURNING *`,
            [brand, model, year, price_per_day, available, id]
        );

        if (!result.rows.length)
            return res.status(404).json({ success: false, message: "Car not found" });

        res.status(200).json({
            success: true,
            message: "Car updated",
            data: result.rows[0]
        });

    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};


export const deleteCar = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM cars WHERE id = $1 RETURNING *`,
            [id]
        );

        if (!result.rows.length)
            return res.status(404).json({ success: false, message: "Car not found" });

        res.status(200).json({
            success: true,
            message: "Car deleted successfully"
        });

    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
};
