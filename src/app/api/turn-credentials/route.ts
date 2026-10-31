import { NextResponse } from 'next/server';

export async function GET() {
  const defaultIceServers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ];

  const turnApiUrl = process.env.TURN_API_URL;
  const turnApiSecret = process.env.TURN_API_SECRET;

  if (turnApiUrl && turnApiSecret) {
    try {
      const res = await fetch(turnApiUrl, {
        headers: {
          Authorization: `Bearer ${turnApiSecret}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.iceServers && Array.isArray(data.iceServers)) {
          return NextResponse.json({
            iceServers: [...defaultIceServers, ...data.iceServers],
          });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch temporary TURN credentials, using STUN fallback:', err);
    }
  }

  return NextResponse.json({
    iceServers: defaultIceServers,
  });
}
