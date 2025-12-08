import { Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

console.log('💳 Razorpay Config:', {
  key_id: process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Not Set',
  key_secret: process.env.RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Not Set',
});

/**
 * @route   POST /api/payment/create-order
 * @desc    Create Razorpay order
 * @access  Private
 */
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, currency = 'INR', planName } = req.body;

    // Validation
    if (!amount || !planName) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Please provide amount and plan name' 
      });
    }

    // Create order options
    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise for INR)
      currency,
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
      notes: {
        planName,
        userId: req.user!.id,
      },
    };

    console.log('📦 Creating Razorpay order:', options);

    // Create order
    const order = await razorpay.orders.create(options);

    console.log('✅ Order created:', order.id);

    res.json({
      success: true,
      order,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('❌ Create Order Error:', (err as Error).message);
    res.status(500).json({ 
      success: false, 
      msg: 'Server Error', 
      error: (err as Error).message 
    });
  }
};

/**
 * @route   POST /api/payment/verify-payment
 * @desc    Verify Razorpay payment and update subscription
 * @access  Private
 */
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planName } = req.body;

    // Validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planName) {
      return res.status(400).json({
        success: false,
        msg: 'Missing payment verification details'
      });
    }

    console.log('🔐 Verifying payment:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      planName
    });

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      console.error('❌ Invalid signature');
      return res.status(400).json({
        success: false,
        msg: 'Invalid payment signature'
      });
    }

    console.log('✅ Payment signature verified');

    // Calculate subscription dates
    const startDate = new Date();
    let endDate = new Date();
    
    // Set subscription duration based on plan
    switch (planName) {
      case 'Device Owner':
        endDate.setMonth(endDate.getMonth() + 6); // 6 months
        break;
      case 'Premium':
      case 'Basic':
        endDate.setMonth(endDate.getMonth() + 1); // 1 month
        break;
      default:
        return res.status(400).json({
          success: false,
          msg: 'Invalid plan name'
        });
    }

    // Update user subscription
    const updatedUser = await User.findByIdAndUpdate(
      req.user!.id,
      {
        subscription: {
          plan: planName,
          status: 'active',
          startDate,
          endDate,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
        },
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    console.log('🎉 Subscription updated successfully:', {
      userId: updatedUser._id.toString(),
      plan: planName,
      endDate
    });

    res.json({
      success: true,
      msg: 'Payment verified and subscription activated successfully',
      subscription: {
        plan: planName,
        status: 'active',
        startDate,
        endDate,
      },
      user: {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        subscription: updatedUser.subscription
      }
    });
  } catch (err) {
    console.error('❌ Verify Payment Error:', (err as Error).message);
    res.status(500).json({ 
      success: false, 
      msg: 'Server Error', 
      error: (err as Error).message 
    });
  }
};

/**
 * @route   GET /api/payment/subscription-status
 * @desc    Get user's subscription status
 * @access  Private
 */
export const getSubscriptionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id).select('subscription');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        msg: 'User not found' 
      });
    }

    // Check if subscription has expired
    const now = new Date();
    let isExpired = false;
    
    if (user.subscription.endDate && user.subscription.status === 'active') {
      isExpired = now > user.subscription.endDate;
      
      if (isExpired) {
        // Update status to expired
        user.subscription.status = 'expired';
        await user.save();
      }
    }

    res.json({
      success: true,
      subscription: {
        plan: user.subscription.plan,
        status: isExpired ? 'expired' : user.subscription.status,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate,
        isExpired
      }
    });
  } catch (err) {
    console.error('Get Subscription Status Error:', (err as Error).message);
    res.status(500).json({ 
      success: false,
      msg: 'Server Error', 
      error: (err as Error).message 
    });
  }
};
