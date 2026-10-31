import { TransferRoomDO } from './TransferRoomDO';

export { TransferRoomDO };

interface Env {
  TRANSFER_ROOM: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'Nextbyte Send Signaling Worker',
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Signaling WebSocket: /room/:roomId?role=sender|receiver
    const match = url.pathname.match(/^\/room\/([a-zA-Z0-9_-]+)$/);
    if (!match) {
      return new Response('Not Found', { status: 404 });
    }

    const roomId = match[1].toUpperCase();
    const id = env.TRANSFER_ROOM.idFromName(roomId);
    const obj = env.TRANSFER_ROOM.get(id);

    return obj.fetch(request);
  },
};
