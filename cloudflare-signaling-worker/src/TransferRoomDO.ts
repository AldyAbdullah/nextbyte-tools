export class TransferRoomDO {
  state: DurableObjectState;
  senderWs: WebSocket | null = null;
  receiverWs: WebSocket | null = null;
  createdAt: number = Date.now();

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade check
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const role = url.searchParams.get('role'); // 'sender' | 'receiver'
    if (role !== 'sender' && role !== 'receiver') {
      return new Response('Invalid role: must be sender or receiver', { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Reject if role is already filled by an active connection
    if (role === 'sender' && this.senderWs && this.senderWs.readyState === WebSocket.OPEN) {
      server.accept();
      server.send(JSON.stringify({ type: 'error', reason: 'Sender already connected to this room.' }));
      server.close(1008, 'Room full');
      return new Response(null, { status: 101, webSocket: client });
    }

    if (role === 'receiver' && this.receiverWs && this.receiverWs.readyState === WebSocket.OPEN) {
      server.accept();
      server.send(JSON.stringify({ type: 'error', reason: 'Receiver already connected to this room.' }));
      server.close(1008, 'Room full');
      return new Response(null, { status: 101, webSocket: client });
    }

    server.accept();

    if (role === 'sender') {
      this.senderWs = server;
    } else {
      this.receiverWs = server;
    }

    server.addEventListener('message', (event) => {
      try {
        const msg = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data);

        // Forward message to the counterpart
        if (role === 'sender' && this.receiverWs && this.receiverWs.readyState === WebSocket.OPEN) {
          this.receiverWs.send(msg);
        } else if (role === 'receiver' && this.senderWs && this.senderWs.readyState === WebSocket.OPEN) {
          this.senderWs.send(msg);
        }
      } catch (err) {
        console.error('Failed to forward message:', err);
      }
    });

    server.addEventListener('close', () => {
      if (role === 'sender') {
        this.senderWs = null;
        if (this.receiverWs && this.receiverWs.readyState === WebSocket.OPEN) {
          this.receiverWs.send(JSON.stringify({ type: 'cancel-transfer', reason: 'Sender disconnected.' }));
        }
      } else {
        this.receiverWs = null;
        if (this.senderWs && this.senderWs.readyState === WebSocket.OPEN) {
          this.senderWs.send(JSON.stringify({ type: 'cancel-transfer', reason: 'Receiver disconnected.' }));
        }
      }
    });

    return new Response(null, { status: 101, webSocket: client });
  }
}
