import dbConnect from '@/lib/db';
import Test from '@/models/Test';
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
