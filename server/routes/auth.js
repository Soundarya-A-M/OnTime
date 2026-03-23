import express from 'express';
import {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    getUsersByRole,
    createCrewMember,
    getAllCrew,
    updateCrewMember,
    deleteCrewMember
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleCheck.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/profile/password', authenticate, changePassword);

// Admin / protected routes
router.get('/users', authenticate, getUsersByRole);

// Crew CRUD (Admin only)
router.get('/crew', authenticate, requireAdmin, getAllCrew);
router.post('/crew', authenticate, requireAdmin, createCrewMember);
router.put('/crew/:id', authenticate, requireAdmin, updateCrewMember);
router.delete('/crew/:id', authenticate, requireAdmin, deleteCrewMember);

export default router;

