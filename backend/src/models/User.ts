import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  profileImage?: string;
  name?: string;
  phone?: string;
  address?: string;
  subscription: {
    plan: 'Free' | 'Basic' | 'Premium' | 'Device Owner';
    status: 'active' | 'inactive' | 'expired';
    startDate?: Date;
    endDate?: Date;
    paymentId?: string;
    orderId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  profileImage: { 
    type: String,
    default: null
  },
  name: { 
    type: String,
    trim: true
  },
  phone: { 
    type: String,
    trim: true
  },
  address: { 
    type: String,
    trim: true
  },
  subscription: {
    plan: { 
      type: String, 
      enum: ['Free', 'Basic', 'Premium', 'Device Owner'], 
      default: 'Free' 
    },
    status: { 
      type: String, 
      enum: ['active', 'inactive', 'expired'], 
      default: 'inactive' 
    },
    startDate: { 
      type: Date 
    },
    endDate: { 
      type: Date 
    },
    paymentId: { 
      type: String 
    },
    orderId: { 
      type: String 
    },
  },
}, { 
  timestamps: true 
});

// Note: email index is automatically created by unique: true

export default model<IUser>('User', userSchema);
