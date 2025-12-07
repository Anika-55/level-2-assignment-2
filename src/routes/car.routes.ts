import { Router } from "express";
import { auth } from "../middlewares/auth";
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle
} from "../controllers/car.controller";

const router = Router();

// Public route
router.get("/", getAllVehicles);
router.get("/:vehicleId", getVehicleById)

// Admin-only routes
router.post("/", auth, createVehicle);
router.put("/:vehicleId", auth, updateVehicle);
router.delete("/:vehicleId", auth, deleteVehicle);

;

export default router;
