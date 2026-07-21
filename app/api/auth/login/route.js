import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const payload = {
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      name: user.name,
    };

    const token = await signToken(payload);
    await setAuthCookie(token);

    return NextResponse.json({ message: 'Login successful', user: payload });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
