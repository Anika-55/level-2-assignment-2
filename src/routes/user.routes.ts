import { Router } from "express";
import { getAllUsers, updateUser, deleteUser } from "../controllers/user.controller";
import { auth, adminOnly } from "../middlewares/auth";

const router = Router();

// Admin only
router.get("/", auth, adminOnly, getAllUsers);
router.delete("/:userId", auth, adminOnly, deleteUser);

// Admin or own profile
router.put("/:userId", auth, updateUser);

export default router;
