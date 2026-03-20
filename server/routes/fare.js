import express from 'express';
import { calculateFare } from '../controllers/fareController.js';

const router = express.Router();

// Public - fare calculation used by booking flow
router.get('/calculate', calculateFare);

export default router;
