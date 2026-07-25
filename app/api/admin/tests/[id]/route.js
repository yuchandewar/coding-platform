import dbConnect from '@/lib/db';
import Test from '@/models/Test';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const test = await Test.findOne({ _id: id, createdBy: user.userId });
    if (!test) return NextResponse.json({ error: 'Test not found or unauthorized' }, { status: 404 });
    return NextResponse.json(test);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const updateData = await req.json();
    
    await dbConnect();
    const test = await Test.findOneAndUpdate({ _id: id, createdBy: user.userId }, updateData, { new: true });
    
    if (!test) return NextResponse.json({ error: 'Test not found or unauthorized' }, { status: 404 });
    return NextResponse.json(test);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required to delete a test' }, { status: 400 });
    }

    await dbConnect();
    
    const adminUser = await User.findById(user.userId);
    if (!adminUser) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });

    const isMatch = await bcrypt.compare(password, adminUser.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 403 });
    }

    const test = await Test.findOneAndDelete({ _id: id, createdBy: user.userId });
    if (!test) return NextResponse.json({ error: 'Test not found or unauthorized' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
