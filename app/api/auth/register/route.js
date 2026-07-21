import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { username, password, name, role, adminSecret } = await req.json();

    if (!username || !password || !name) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (role === 'admin') {
      const serverSecret = process.env.ADMIN_SECRET || 'codexam_admin_secret_2026';
      if (adminSecret !== serverSecret) {
        return NextResponse.json({ error: 'Invalid admin secret' }, { status: 403 });
      }
    }

    await dbConnect();

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      password: hashedPassword,
      name,
      role: role === 'admin' ? 'admin' : 'student',
    });

    return NextResponse.json({ message: 'Registration successful', userId: user._id }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
