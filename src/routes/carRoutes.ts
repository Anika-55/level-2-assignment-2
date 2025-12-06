import { Router } from "express";
import { auth } from "../middlewares/auth";
import { addCar, getAllCars, getCarById, updateCar, deleteCar } from "../controllers/carController";

const router = Router();

router.post("/", auth, addCar);          // admin only in controller
router.get("/", auth, getAllCars);       // logged-in users
router.get("/:id", auth, getCarById);    // logged-in users
router.put("/:id", auth, updateCar);     // admin only
router.delete("/:id", auth, deleteCar);  // admin only

export default router;
