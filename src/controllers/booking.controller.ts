import { Request, Response } from "express";
import { pool } from "../config/db";



export const createBooking = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { customer_id, vehicle_id, rent_start_date, rent_end_date } = req.body;

        //If customer tries to book for another ID -> reject
        if (user.role === "customer" && user.id !== customer_id) {
            return res.status(403).json({
                success: false,
                message: "You can only create your own bookings"
            });

            // check vehicle exists & available
            const vehicleQuery = await pool.query(
                `SELECT * FROM vehicles WHERE id = $1`,
                [vehicle_id]
            );

            if (vehicleQuery.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:"Vehicle not found"
                })
            }

            const vehicle = vehicleQuery.rows[0];

            if (vehicle.availability_status !== 'available') {
                return res.status(400).json({
                    success: false,
                    message:"Vehicle already booked"
                })
            }

            const start = new Date(rent_start_date)
            const end = new Date(rent_end_date)
            const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));

            if (diffDays <= 0) {
                return res.status(400).json({
                    success: false,
                    message:"Invalid booking date range"
                })
            }

            const total_price = diffDays * Number(vehicle.daily_rent_price);
            const bookingResult = await pool.query(
            `INSERT INTO bookings 
            (customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status)
            VALUES ($1, $2, $3, $4, $5, 'active')
            RETURNING *`,
            [customer_id, vehicle_id, rent_start_date, rent_end_date, total_price]
            );
            
            //Update vehicle status
            await pool.query(
                `UPDATE vehicles SET availability_status = 'booked' WHERE id = $1`,
                [vehicle_id]
            );

            res.status(201).json({
                success: true,
                message: "Booking created successfully",
                data: {
                    ...bookingResult.rows[0],
                    vehicle: {
                        vehicle_name: vehicle.vehicle_name,
                        daily_rent_price:vehicle.daily_rent_price,
                    }
                }
            })

        }
    } catch (error:any) {
        res.status(500).json({
            success: false,
            message: "server error",
            error:error.message
        })
    }
}


export const getBookings = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        let bookingsQuery;
        if (user.role === "admin") {
            bookingsQuery = await pool.query(`
                SELECT b.*, u.name AS customer_name, u.email AS customer_email,
                       v.vehicle_name, v.registration_number
                FROM bookings b
                JOIN users u ON b.customer_id = u.id
                JOIN vehicles v ON b.vehicle_id = v.id
            `);
        } else {
            bookingsQuery = await pool.query(`
                SELECT b.*, v.vehicle_name, v.registration_number, v.type
                FROM bookings b
                JOIN vehicles v ON b.vehicle_id = v.id
                WHERE b.customer_id = $1`,
                [user.id]
            );
        }

        res.status(200).json({
            success: true,
            message: user.role === "admin" 
                ? "Bookings retrieved successfully" 
                : "Your bookings retrieved successfully",
            data: bookingsQuery.rows
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};


export const updateBooking = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const bookingId = req.params.bookingId;
        const { status } = req.body;

        const bookingQuery = await pool.query(
            `SELECT * FROM bookings WHERE id = $1`,
            [bookingId]
        );

        if (bookingQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        const booking = bookingQuery.rows[0];

        if (user.role === "customer" && user.id !== booking.customer_id) {
            return res.status(403).json({
                success: false,
                message: "Not allowed to modify this booking"
            });
        }

        if (user.role === "customer" && status !== "cancelled") {
            return res.status(403).json({
                success: false,
                message: "Customers can only cancel bookings"
            });
        }

        // If returned → make vehicle available
        if (status === "returned") {
            await pool.query(
                `UPDATE vehicles SET availability_status = 'available' WHERE id = $1`,
                [booking.vehicle_id]
            );
        }

        const updateResult = await pool.query(
            `UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *`,
            [status, bookingId]
        );

        res.status(200).json({
            success: true,
            message: status === "returned"
                ? "Booking marked as returned. Vehicle is now available"
                : "Booking cancelled successfully",
            data: updateResult.rows[0]
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};