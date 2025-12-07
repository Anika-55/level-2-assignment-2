import { Router } from "express";
import { auth } from "../middlewares/auth";
import { addCar, getAllCars, getCarById, updateCar, deleteCar } from "../controllers/car.controller";

const router = Router();

router.post("/", auth, addCar);
router.get("/", auth, getAllCars);
router.get("/:id", auth, getCarById);
router.put("/:id", auth, updateCar);
router.delete("/:id", auth, deleteCar);

export default router;
