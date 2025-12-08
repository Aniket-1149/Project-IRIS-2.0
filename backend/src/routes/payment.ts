import { Router } from 'express';
import { createOrder, verifyPayment, getSubscriptionStatus } from '../controllers/paymentController';
import auth from '../middleware/auth';

const router = Router();

// @route   POST /api/payment/create-order
// @desc    Create Razorpay order
// @access  Private
router.post('/create-order', auth, createOrder);

// @route   POST /api/payment/verify-payment
// @desc    Verify payment and update subscription
// @access  Private
router.post('/verify-payment', auth, verifyPayment);

// @route   GET /api/payment/subscription-status
// @desc    Get subscription status
// @access  Private
router.get('/subscription-status', auth, getSubscriptionStatus);

export default router;
