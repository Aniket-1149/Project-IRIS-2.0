import { Router } from 'express';
import { register, login, verifyToken } from '../controllers/authController';

const router = Router();

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/verify
// @desc    Verify token
// @access  Public
router.get('/verify', verifyToken);

export default router;
