import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await User.create({
      username: 'admin',
      password: hashedPassword,
      name: 'System Admin',
      role: 'admin',
    });

    return NextResponse.json({ message: 'Admin created successfully', admin });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
