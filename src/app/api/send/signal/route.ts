import { NextRequest, NextResponse } from 'next/server';
import { SignalingMessage } from '@/types/nextbyteSend';

interface StoredRoom {
  createdAt: number;
  messages: Array<{ target: 'sender' | 'receiver' | 'all'; msg: SignalingMessage; timestamp: number }>;
}

// In-memory ephemeral room store (auto-expires in 15 minutes)
const rooms = new Map<string, StoredRoom>();

function cleanupExpiredRooms() {
  const now = Date.now();
  const maxAge = 15 * 60 * 1000; // 15 mins
  for (const [id, room] of rooms.entries()) {
    if (now - room.createdAt > maxAge) {
      rooms.delete(id);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    cleanupExpiredRooms();
    const body = await req.json();
    const { roomId, target = 'all', message } = body as {
      roomId: string;
      target?: 'sender' | 'receiver' | 'all';
      message: SignalingMessage;
    };

    if (!roomId || !message) {
      return NextResponse.json({ error: 'Missing roomId or message' }, { status: 400 });
    }

    let room = rooms.get(roomId);
    if (!room) {
      room = { createdAt: Date.now(), messages: [] };
      rooms.set(roomId, room);
    }

    room.messages.push({
      target,
      msg: message,
      timestamp: Date.now(),
    });

    // Keep max 100 recent messages per room
    if (room.messages.length > 100) {
      room.messages.splice(0, room.messages.length - 100);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Signaling error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  cleanupExpiredRooms();
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  const role = searchParams.get('role') as 'sender' | 'receiver' | null;
  const since = Number(searchParams.get('since') || '0');

  if (!roomId || !role) {
    return NextResponse.json({ error: 'Missing roomId or role' }, { status: 400 });
  }

  const room = rooms.get(roomId);
  if (!room) {
    return NextResponse.json({ messages: [], latestTimestamp: since });
  }

  // Filter messages intended for this role
  const matchingMessages = room.messages.filter(
    (m) => m.timestamp > since && (m.target === 'all' || m.target === role)
  );

  const messages = matchingMessages.map((m) => m.msg);
  const latestTimestamp =
    matchingMessages.length > 0
      ? Math.max(...matchingMessages.map((m) => m.timestamp))
      : since;

  return NextResponse.json({
    messages,
    latestTimestamp,
  });
}
