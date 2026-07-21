import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { getUserFromCookies } from '@/lib/auth';
import fs from 'fs';

export async function POST(req) {
  try {
    const user = await getUserFromCookies();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `cert-${uniqueSuffix}${path.extname(file.name)}`;
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'certificates');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Return the public URL
    const fileUrl = `/uploads/certificates/${filename}`;
    
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
  }
}
