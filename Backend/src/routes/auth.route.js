
import express from "express";

import {
    register,
    verifyEmail,
    resendVerificationEmail,
    login,
    getme,
    logout,
    forgotPassword,
    resetPassword
} from "../controllers/auth.controller.js";

import {authUser} from "../middlewares/auth.middleware.js"

const Authrouter = express.Router();

// Public Routes
// Public Routes
Authrouter.post("/register", register);
Authrouter.get("/verify-email/:token", verifyEmail);
Authrouter.post("/resend-verification", resendVerificationEmail);
Authrouter.post("/login", login);

// Password Reset Routes
Authrouter.post("/forgot-password", forgotPassword);
Authrouter.post("/reset-password/:token", resetPassword);

// Protected Routes
Authrouter.get("/me", authUser, getme);

Authrouter.post("/logout", authUser, logout);

export default Authrouter;
