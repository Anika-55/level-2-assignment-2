import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        role: string;
        [key: string]: any;
    };
}

// Middleware to verify JWT token
export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).json({ success: false, message: "Malformed token" });
    }

    const token = parts[1];
    const secret = process.env.JWT_SECRET!;

    if (!secret) {
        return res.status(500).json({ success: false, message: "JWT secret not set" });
    }

    try {
        // Type assertion via unknown to satisfy TS
        const decoded = jwt.verify(token, secret) as unknown as {
            id: number;
            email: string;
            role: string;
            [key: string]: any;
        };

        req.user = decoded;
        next();
    } catch (err) {
        console.error("JWT verification error:", err);
        return res.status(403).json({ success: false, message: "Invalid token" });
    }
};

// Middleware to restrict access to admin users only
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    if (req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Access denied. Admins only." });
    }

    next();
};
