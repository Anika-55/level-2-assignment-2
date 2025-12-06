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

    // No token provided
    if (!authHeader) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }

    // Expect header format: "Bearer <token>"
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).json({ success: false, message: "Malformed token" });
    }

    const token = parts[1];

    try {
        // Verify token using JWT_SECRET from .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        req.user = decoded as AuthRequest["user"];
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
