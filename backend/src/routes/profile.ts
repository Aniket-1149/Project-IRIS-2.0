import { Router, Request, Response, NextFunction } from 'express';
import { getProfile, updateProfile, deleteAccount } from '../controllers/profileController';
import auth from '../middleware/auth';
import upload from '../config/cloudinary';

const router = Router();

// Error handling middleware for multer/cloudinary
const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const uploadSingle = upload.single('profileImage');
  
  uploadSingle(req, res, (err: any) => {
    if (err) {
      console.error('❌ Multer/Cloudinary Error:', err);
      // Continue without image if cloudinary fails
      console.log('⚠️ Continuing without image upload...');
      req.file = undefined;
      return next();
    }
    next();
  });
};

// @route   GET /api/profile
// @desc    Get user profile
// @access  Private
router.get('/', auth, getProfile);

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
router.put('/', auth, uploadMiddleware, updateProfile);

// @route   DELETE /api/profile
// @desc    Delete user account
// @access  Private
router.delete('/', auth, deleteAccount);

export default router;
