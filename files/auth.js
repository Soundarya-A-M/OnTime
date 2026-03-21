import express from 'express';
import {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    getUsersByRole
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
// FIX #5: new password change endpoint used by Profile.jsx
router.put('/profile/password', authenticate, changePassword);

// Admin / protected routes
router.get('/users', authenticate, getUsersByRole);

export default router;
