import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { pool } from "../config/db";

// Register
export const signup = async (req: Request, res: Response): Promise<any> => {
    const { name, email, password, phone, role } = req.body;

const lowerEmail = email.toLowerCase();

if (!password || password.length < 6) {
    return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
    });
}

const allowedRoles = ['admin', 'customer'];
const userRole = allowedRoles.includes(role) ? role : 'customer';


    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (name, email, password, phone, role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, email, phone, role
            `,
            [name, lowerEmail, hashedPassword, phone, userRole]
        );

        res.status(201).json({
            success: true,
            message: "User register successfully",
            data: result.rows[0]
        })
    } catch (error: any) {
        if (error.code === "23505") {
            return res.status(400).json({
                success: false,
                message: "Email already exists",
            })
        }

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        })
    }
};


// SignIn

export const signin = async (req: Request, res: Response): Promise<any> => {
    const { email, password } = req.body;

    try {
        const userQuery = await pool.query(
            `SELECT * FROM users WHERE email = $1`,
            [email]
        );

        const user = userQuery.rows[0];

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message:"Invalid email or password"
            })
        }
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: "7d" }
        );

        delete user.password;

        res.status(200).json({
            success: true,
            message: "Login successfully",
            data: {
                token,
                user
            }
        });

    }catch(error:any){
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
}