import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production';

export async function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

export async function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function getUserFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  
  const decoded = await verifyToken(token);
  return decoded;
}

export async function setAuthCookie(token) {
  const cookieStore = await cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    // Only set secure to true if explicitly configured, 
    // otherwise testing production builds on local network (HTTP) will drop the cookie.
    secure: process.env.NODE_ENV === 'production' && process.env.SECURE_COOKIE === 'true',
    sameSite: 'lax', // 'lax' is safer than 'strict' for local network routers
    maxAge: 60 * 60 * 24, // 1 day
    path: '/',
  });
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
}
