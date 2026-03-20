import express from 'express';
import { register, login, getProfile, updateProfile, getUsersByRole } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

// Admin / protected routes
router.get('/users', authenticate, getUsersByRole);

export default router;
