import { Router } from "express";
import { auth } from "../middlewares/auth";
import { getAllUsers, updateUser, deleteUser } from "../controllers/user.controller";

const router = Router();

// GET all users (Admin only)
router.get("/", auth, getAllUsers);

// UPDATE user (Admin or user themselves)
router.put("/:userId", auth, updateUser);

// DELETE user (Admin only)
router.delete("/:userId", auth, deleteUser);

export default router;
