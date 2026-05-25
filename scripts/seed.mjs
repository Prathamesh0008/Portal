import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kva_logistics';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['CUSTOMER', 'ADMIN', 'SHIPPING_DPD', 'SHIPPING_FEDEX'],
      default: 'CUSTOMER',
    },
    company: String,
    phone: String,
    country: String,
    city: String,
    postalCode: String,
    address: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

const users = [
  {
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    company: 'KVA Logistics',
  },
  {
    email: 'customer@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'CUSTOMER',
    company: 'Sample Company',
    phone: '+1234567890',
    country: 'NL',
    city: 'Amsterdam',
    postalCode: '1012AB',
    address: 'Main Street 123',
  },
  {
    email: 'dpd@example.com',
    firstName: 'DPD',
    lastName: 'Courier',
    role: 'SHIPPING_DPD',
    company: 'DPD Logistics',
    phone: '+31612345678',
    country: 'NL',
    city: 'Amsterdam',
  },
  {
    email: 'fedex@example.com',
    firstName: 'FedEx',
    lastName: 'Courier',
    role: 'SHIPPING_FEDEX',
    company: 'FedEx International',
    phone: '+14155552671',
    country: 'US',
    city: 'New York',
  },
];

try {
  await mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
  });

  await User.deleteMany({});
  const password = await bcrypt.hash('password123', 10);

  for (const user of users) {
    await User.create({
      ...user,
      password,
      isActive: true,
    });
    console.log(`Created ${user.role}: ${user.email}`);
  }

  console.log('\nDatabase seeded successfully.');
  console.log('Password for all demo users: password123');
} catch (error) {
  console.error('\nCould not seed the database.');
  console.error(`MongoDB URI: ${MONGODB_URI}`);
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => {});
}
