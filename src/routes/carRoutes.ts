import express from "express";
import {
    addCar,
    getAllCars,
    getCarById,
    updateCar,
    deleteCar,
} from "../controllers/carController";

const router = express.Router();

router.post("/", addCar); // TODO: Add admin middleware later
router.get("/", getAllCars);
router.get("/:id", getCarById);
router.put("/:id", updateCar); // protected later
router.delete("/:id", deleteCar); // protected later

export default router;
