import dbConnect from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/password';

async function seedDatabase() {
  try {
    await dbConnect();

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create admin user
    const admin = await User.create({
      email: 'admin@example.com',
      password: await hashPassword('password123'),
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      company: 'KVA Logistics',
      isActive: true,
    });
    console.log('✓ Admin created:', admin.email);

    // Create customer user
    const customer = await User.create({
      email: 'customer@example.com',
      password: await hashPassword('password123'),
      firstName: 'John',
      lastName: 'Doe',
      role: 'CUSTOMER',
      company: 'Sample Company',
      phone: '+1234567890',
      country: 'NL',
      city: 'Amsterdam',
      postalCode: '1012AB',
      address: 'Main Street 123',
      isActive: true,
    });
    console.log('✓ Customer created:', customer.email);

    // Create DPD shipping user
    const dpdShipping = await User.create({
      email: 'dpd@example.com',
      password: await hashPassword('password123'),
      firstName: 'DPD',
      lastName: 'Courier',
      role: 'SHIPPING_DPD',
      company: 'DPD Logistics',
      phone: '+31612345678',
      country: 'NL',
      city: 'Amsterdam',
      isActive: true,
    });
    console.log('✓ DPD Shipping user created:', dpdShipping.email);

    // Create FedEx shipping user
    const fedexShipping = await User.create({
      email: 'fedex@example.com',
      password: await hashPassword('password123'),
      firstName: 'FedEx',
      lastName: 'Courier',
      role: 'SHIPPING_FEDEX',
      company: 'FedEx International',
      phone: '+14155552671',
      country: 'US',
      city: 'New York',
      isActive: true,
    });
    console.log('✓ FedEx Shipping user created:', fedexShipping.email);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nDemo Credentials:');
    console.log('  Admin: admin@example.com / password123');
    console.log('  Customer: customer@example.com / password123');
    console.log('  DPD Shipping: dpd@example.com / password123');
    console.log('  FedEx Shipping: fedex@example.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
