import { Router } from "express";
import { auth, adminOnly } from "../middlewares/auth";
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle
} from "../controllers/vehicle.controller";

const router = Router();

// Public routes
router.get("/", getAllVehicles);
router.get("/:vehicleId", getVehicleById);

// Admin routes
router.post("/", auth, adminOnly, createVehicle);
router.put("/:vehicleId", auth, adminOnly, updateVehicle);
router.delete("/:vehicleId", auth, adminOnly, deleteVehicle);

export default router;