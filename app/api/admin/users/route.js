import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();
    const users = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { username, password, name } = await req.json();

    if (!username || !password || !name) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      name,
      role: 'student',
    });

    return NextResponse.json({ message: 'Student created successfully', user: { _id: user._id, username: user.username, name: user.name } });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
