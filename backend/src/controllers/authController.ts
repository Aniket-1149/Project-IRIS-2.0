import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  try {
    // Validation
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide email and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || '',
    });

    await user.save();

    // Create JWT payload
    const payload = {
      user: {
        id: user._id.toString(),
      },
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }, // Token valid for 7 days
      (err, token) => {
        if (err) throw err;
        res.json({ 
          success: true,
          token,
          user: {
            id: user!._id.toString(),
            email: user!.email,
            name: user!.name,
            subscription: user!.subscription
          }
        });
      }
    );
  } catch (err) {
    console.error('Register error:', (err as Error).message);
    res.status(500).json({ msg: 'Server error', error: (err as Error).message });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Validation
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide email and password' });
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user._id.toString(),
      },
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }, // Token valid for 7 days
      (err, token) => {
        if (err) throw err;
        res.json({ 
          success: true,
          token,
          user: {
            id: user!._id.toString(),
            email: user!.email,
            name: user!.name,
            profileImage: user!.profileImage,
            subscription: user!.subscription
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', (err as Error).message);
    res.status(500).json({ msg: 'Server error', error: (err as Error).message });
  }
};

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token
 * @access  Private
 */
export const verifyToken = async (req: Request, res: Response) => {
  try {
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ msg: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { user: { id: string } };
    const user = await User.findById(decoded.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ 
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        subscription: user.subscription
      }
    });
  } catch (err) {
    console.error('Verify token error:', (err as Error).message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
