import { NextRequest, NextResponse } from 'next/server';
import { SignalingMessage } from '@/types/nextbyteSend';

interface TargetedMessage {
  id: string;
  fromPeerId: string;
  targetPeerId: string;
  msg: SignalingMessage;
  timestamp: number;
}

// In-memory queue of signaling messages per peer (auto-cleans up)
const peerInboxes = new Map<string, TargetedMessage[]>();

function cleanupOldMessages() {
  const now = Date.now();
  const maxAge = 60 * 1000; // 1 minute max age for signaling packets
  for (const [peerId, msgs] of peerInboxes.entries()) {
    const valid = msgs.filter((m) => now - m.timestamp < maxAge);
    if (valid.length === 0) {
      peerInboxes.delete(peerId);
    } else {
      peerInboxes.set(peerId, valid);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    cleanupOldMessages();
    const body = await req.json();
    const { targetPeerId, fromPeerId, message } = body as {
      targetPeerId: string;
      fromPeerId: string;
      message: SignalingMessage;
    };

    if (!targetPeerId || !message) {
      return NextResponse.json({ error: 'Missing targetPeerId or message' }, { status: 400 });
    }

    let inbox = peerInboxes.get(targetPeerId);
    if (!inbox) {
      inbox = [];
      peerInboxes.set(targetPeerId, inbox);
    }

    inbox.push({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fromPeerId: fromPeerId || message.senderId,
      targetPeerId,
      msg: message,
      timestamp: Date.now(),
    });

    // Keep max 50 pending messages per peer
    if (inbox.length > 50) {
      inbox.splice(0, inbox.length - 50);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Signaling error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  cleanupOldMessages();
  const { searchParams } = new URL(req.url);
  const peerId = searchParams.get('peerId') || searchParams.get('roomId');
  const since = Number(searchParams.get('since') || '0');

  if (!peerId) {
    return NextResponse.json({ error: 'Missing peerId' }, { status: 400 });
  }

  const inbox = peerInboxes.get(peerId) || [];
  const matching = inbox.filter((m) => m.timestamp > since);
  const messages = matching.map((m) => m.msg);
  const latestTimestamp =
    matching.length > 0 ? Math.max(...matching.map((m) => m.timestamp)) : since;

  return NextResponse.json({
    messages,
    latestTimestamp,
  });
}
