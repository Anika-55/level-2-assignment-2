import express, { Request, Response } from 'express';
import { Pool } from "pg";
import dotenv from 'dotenv';
import path from 'path';
import { initDB } from "./config/dbInit";
import authRoutes from "./routes/authRoutes";
import carRoutes from "./routes/carRoutes";
import vehicleRoutes from "./routes/vehicle.routes";
import userRoutes from "./routes/user.routes";
import bookingRoutes from "./routes/booking.route";

dotenv.config({ path: path.join(process.cwd(), '.env') });

const app = express();
const port = 5000;

// Middleware
app.use(express.json());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/cars", carRoutes);
app.use("/api/v1/vehicles", vehicleRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/bookings", bookingRoutes);

// DB Connection
export const pool = new Pool({
    connectionString: process.env.CONNECTION_STR
});

// Test API
app.get('/', (req: Request, res: Response) => {
    res.send('Hello World! 🚗 Car Rental API Running!');
});

// Start server
app.listen(port, async () => {
    await initDB();
    console.log(`🚀 Server running: http://localhost:${port}`);
});
