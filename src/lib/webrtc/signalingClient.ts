import { SignalingMessage } from '@/types/nextbyteSend';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface SignalingSession {
  send: (msg: SignalingMessage) => Promise<void>;
  close: () => void;
}

/**
 * Creates a signaling session for a room.
 * Uses Supabase Realtime Broadcast when configured,
 * or the internal local signaling endpoint as fallback.
 */
export function createSignalingSession(
  roomId: string,
  role: 'sender' | 'receiver',
  onMessage: (msg: SignalingMessage) => Promise<void> | void
): SignalingSession {
  let isClosed = false;

  // 1. SUPABASE REALTIME BROADCAST MODE
  if (isSupabaseConfigured && supabase) {
    const channelName = `send_${roomId.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true },
      },
    });

    channel
      .on('broadcast', { event: 'signal' }, async (payload) => {
        if (!isClosed && payload.payload) {
          await onMessage(payload.payload as SignalingMessage);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Signaling] Subscribed to Supabase channel: ${channelName}`);
        }
      });

    return {
      send: async (msg: SignalingMessage) => {
        if (isClosed) return;
        await channel.send({
          type: 'broadcast',
          event: 'signal',
          payload: msg,
        });
      },
      close: () => {
        isClosed = true;
        if (supabase) {
          supabase.removeChannel(channel);
        }
      },
    };
  }

  // 2. LOCAL API FALLBACK MODE
  let lastTimestamp = 0;
  let pollInterval: NodeJS.Timeout | null = null;
  let isPolling = false;

  const targetRole = role === 'sender' ? 'receiver' : 'sender';

  const pollMessages = async () => {
    if (isClosed || isPolling) return;
    isPolling = true;
    try {
      const res = await fetch(
        `/api/send/signal?roomId=${encodeURIComponent(roomId)}&role=${role}&since=${lastTimestamp}`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          lastTimestamp = data.latestTimestamp || lastTimestamp;
          for (const msg of data.messages) {
            await onMessage(msg);
          }
        }
      }
    } catch {
      // transient network glitch
    } finally {
      isPolling = false;
    }
  };

  // Poll every 300ms for responsive WebRTC signaling
  pollInterval = setInterval(pollMessages, 300);
  pollMessages(); // Immediate initial poll

  return {
    send: async (msg: SignalingMessage) => {
      if (isClosed) return;
      try {
        await fetch('/api/send/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            target: targetRole,
            message: msg,
          }),
        });
      } catch (err) {
        console.warn('Failed to send signaling message via API route:', err);
      }
    },
    close: () => {
      isClosed = true;
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    },
  };
}
