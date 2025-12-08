import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

/**
 * @route   GET /api/profile
 * @desc    Get user profile
 * @access  Private
 */
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        profileImage: user.profileImage,
        subscription: user.subscription,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (err) {
    console.error('Get Profile Error:', (err as Error).message);
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};

/**
 * @route   PUT /api/profile
 * @desc    Update user profile
 * @access  Private
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  const { email, name, phone, address } = req.body;
  const profileImage = req.file ? (req.file as any).path : null;

  console.log('📝 Update Profile Request:', {
    userId: req.user!.id,
    fields: { email, name, phone, address },
    hasFile: !!req.file,
    profileImageUrl: profileImage
  });

  try {
    // Build profile fields object
    const profileFields: any = {};
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.user!.id }
      });
      if (existingUser) {
        return res.status(400).json({ msg: 'Email already in use' });
      }
      profileFields.email = email.toLowerCase();
    }
    if (name !== undefined) profileFields.name = name;
    if (phone !== undefined) profileFields.phone = phone;
    if (address !== undefined) profileFields.address = address;
    if (profileImage) profileFields.profileImage = profileImage;

    // Find user
    let user = await User.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user!.id,
      { $set: profileFields },
      { new: true, runValidators: true }
    ).select('-password');

    console.log('✅ Profile updated successfully');

    res.json({
      success: true,
      user: {
        id: updatedUser!._id.toString(),
        email: updatedUser!.email,
        name: updatedUser!.name,
        phone: updatedUser!.phone,
        address: updatedUser!.address,
        profileImage: updatedUser!.profileImage,
        subscription: updatedUser!.subscription
      }
    });
  } catch (err) {
    console.error('Update Profile Error:', (err as Error).message);
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};

/**
 * @route   DELETE /api/profile
 * @desc    Delete user account
 * @access  Private
 */
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    await User.findByIdAndDelete(req.user!.id);

    console.log('🗑️ Account deleted:', user.email);

    res.json({
      success: true,
      msg: 'Account deleted successfully'
    });
  } catch (err) {
    console.error('Delete Account Error:', (err as Error).message);
    res.status(500).json({ msg: 'Server Error', error: (err as Error).message });
  }
};
