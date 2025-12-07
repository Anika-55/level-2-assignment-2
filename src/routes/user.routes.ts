import { Router } from "express";
import { auth, adminOnly } from "../middlewares/auth";
import { getAllUsers, deleteUser, updateUser } from "../controllers/user.controller";

const router = Router();

// Get all users (admin only)
router.get("/", auth, adminOnly, getAllUsers);

// Update a user (admin only)
router.put("/:userId", auth, adminOnly, updateUser);

// Delete a user (admin only)
router.delete("/:userId", auth, adminOnly, deleteUser);

export default router;
