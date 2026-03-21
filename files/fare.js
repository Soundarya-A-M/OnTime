import express from 'express';
import rateLimit from 'express-rate-limit';
import { calculateFare } from '../controllers/fareController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// FIX #18: fare calculation hits MongoDB 3 times per call — add tight rate limit
// and require authentication so it can't be scraped anonymously
const fareRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,             // 30 fare calculations per minute per IP — plenty for real usage
    message: { success: false, message: 'Too many fare requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Require login + rate limit
router.get('/calculate', authenticate, fareRateLimit, calculateFare);

export default router;
