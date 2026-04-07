import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { NextResponse } from 'next/server';

export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to access this resource' },
        { status: 401 }
      ),
    };
  }

  return {
    authenticated: true,
    session,
  };
}
