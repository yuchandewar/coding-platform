import dbConnect from '@/lib/db';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const adminUser = await User.findById(user.userId);
    
    if (!adminUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let maskedKey = '';
    if (adminUser.geminiApiKey) {
      const key = adminUser.geminiApiKey;
      maskedKey = key.substring(0, 6) + '...' + key.substring(key.length - 4);
    }

    return NextResponse.json({
      hasGeminiKey: !!adminUser.geminiApiKey,
      geminiApiKeyMasked: maskedKey,
      geminiModel: adminUser.geminiModel || 'gemini-1.5-flash-latest'
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { geminiApiKey, geminiModel } = await req.json();

    await dbConnect();
    
    // Update the user's API key
    const updateData = {};
    if (geminiApiKey !== undefined) {
      updateData.geminiApiKey = geminiApiKey;
    }
    if (geminiModel !== undefined) {
      updateData.geminiModel = geminiModel;
    }
    
    await User.findByIdAndUpdate(user.userId, updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
