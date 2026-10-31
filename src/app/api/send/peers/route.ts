import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { LocalPeer } from '@/types/nextbyteSend';

// In-memory store of peers per Wi-Fi network or custom room
// Key: networkId (hashed public IP subnet or custom room code), Value: Map of peerId -> LocalPeer
const networkRooms = new Map<string, Map<string, LocalPeer>>();

function getNetworkId(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  let ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'local_dev_network';

  // Normalize IPv6 to /64 subnet prefix (crucial for mobile hotspot tethering)
  if (ip.includes(':')) {
    const segments = ip.split(':').filter(Boolean);
    ip = segments.slice(0, 4).join(':');
  }

  return 'wifi_' + createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

function cleanupStalePeers(peersMap: Map<string, LocalPeer>) {
  const now = Date.now();
  const maxAge = 8000; // 8 seconds timeout for heartbeat
  for (const [id, peer] of peersMap.entries()) {
    if (now - peer.lastSeen > maxAge) {
      peersMap.delete(id);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const peer = body.peer as LocalPeer;
    const customRoom = body.roomId as string | undefined;

    if (!peer || !peer.id) {
      return NextResponse.json({ error: 'Missing peer data' }, { status: 400 });
    }

    // If a custom room is specified (e.g. from QR / PIN), prioritize it.
    // Otherwise fallback to automatic Wi-Fi subnet signature.
    const networkId = customRoom && customRoom.trim()
      ? `room_${customRoom.trim().toUpperCase()}`
      : getNetworkId(req);

    let peersMap = networkRooms.get(networkId);
    if (!peersMap) {
      peersMap = new Map<string, LocalPeer>();
      networkRooms.set(networkId, peersMap);
    }

    // Update peer heartbeat
    peer.lastSeen = Date.now();
    peersMap.set(peer.id, peer);

    cleanupStalePeers(peersMap);

    // Filter out calling peer to return only other peers in the room
    const otherPeers: LocalPeer[] = [];
    for (const [id, p] of peersMap.entries()) {
      if (id !== peer.id) {
        otherPeers.push(p);
      }
    }

    return NextResponse.json({
      networkId,
      peers: otherPeers,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error syncing peers';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const peerId = searchParams.get('peerId');
    const customRoom = searchParams.get('roomId');

    const networkId = customRoom
      ? `room_${customRoom.trim().toUpperCase()}`
      : getNetworkId(req);

    if (peerId) {
      const peersMap = networkRooms.get(networkId);
      if (peersMap) {
        peersMap.delete(peerId);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
