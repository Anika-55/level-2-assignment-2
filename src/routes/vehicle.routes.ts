import { Router } from "express";
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle
} from "../controllers/vehicle.controller";

import { auth, adminOnly } from "../middlewares/auth";

const router = Router();

// Public
router.get("/", getAllVehicles);
router.get("/:id", getVehicleById);

// Admin only
router.post("/", auth, adminOnly, createVehicle);
router.put("/:id", auth, adminOnly, updateVehicle);
router.delete("/:id", auth, adminOnly, deleteVehicle);

export default router;
