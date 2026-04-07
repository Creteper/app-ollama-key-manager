import { NextRequest, NextResponse } from 'next/server';
import { deleteApiKey, getApiKeyById } from '@/lib/db';
import { requireAuth } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.authenticated) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const key = await getApiKeyById(id);

    if (!key) {
      return NextResponse.json(
        { error: 'Key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ key });
  } catch (error) {
    console.error('Error getting key:', error);
    return NextResponse.json(
      { error: 'Failed to get key' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.authenticated) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const success = await deleteApiKey(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Key deleted successfully' });
  } catch (error) {
    console.error('Error deleting key:', error);
    return NextResponse.json(
      { error: 'Failed to delete key' },
      { status: 500 }
    );
  }
}
