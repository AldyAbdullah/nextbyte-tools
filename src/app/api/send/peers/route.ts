import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { LocalPeer } from '@/types/nextbyteSend';

// In-memory store of peers per Wi-Fi network
// Key: networkId (hashed public IP), Value: Map of peerId -> LocalPeer
const networkRooms = new Map<string, Map<string, LocalPeer>>();

function getNetworkId(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'local_dev_network';
  return 'wifi_' + createHash('sha256').update(ip).digest('hex').substring(0, 16);
}

function cleanupStalePeers(peersMap: Map<string, LocalPeer>) {
  const now = Date.now();
  const maxAge = 6000; // 6 seconds timeout for heartbeat
  for (const [id, peer] of peersMap.entries()) {
    if (now - peer.lastSeen > maxAge) {
      peersMap.delete(id);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const networkId = getNetworkId(req);
    const body = await req.json();
    const peer = body.peer as LocalPeer;

    if (!peer || !peer.id) {
      return NextResponse.json({ error: 'Missing peer data' }, { status: 400 });
    }

    let peersMap = networkRooms.get(networkId);
    if (!peersMap) {
      peersMap = new Map<string, LocalPeer>();
      networkRooms.set(networkId, peersMap);
    }

    // Update peer heartbeat
    peer.lastSeen = Date.now();
    peersMap.set(peer.id, peer);

    cleanupStalePeers(peersMap);

    // Filter out calling peer to return only other peers on the same Wi-Fi
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
    const networkId = getNetworkId(req);
    const { searchParams } = new URL(req.url);
    const peerId = searchParams.get('peerId');

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
