import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import Cookies from 'js-cookie';

const WS_URL = 'http://localhost:8082/ws-chat';

class WebSocketService {
  private client: Client | null = null;
  private currentRoomId: number | null = null;

  connect(roomId: number, onMessageReceived: (msg: any) => void) {
    const token = Cookies.get('access_token');

    this.client = new Client({
      brokerURL: 'ws://localhost:8082/ws-chat/websocket', // Use native WebSocket directly
      ...(token ? { connectHeaders: { Authorization: `Bearer ${token}` } } : {}),
      debug: (str) => {
        console.log("STOMP: " + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      this.currentRoomId = roomId;
      
      // Subscribe to the chat room
      this.client?.subscribe(`/sub/chat.room.${roomId}`, (message: IMessage) => {
        if (message.body) {
          const parsedMessage = JSON.parse(message.body);
          onMessageReceived(parsedMessage);
        }
      });
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.client.activate();
  }

  sendMessage(roomId: number, content: string) {
    if (this.client && this.client.connected) {
      this.client.publish({
        destination: `/pub/chat.message.${roomId}`,
        body: JSON.stringify({ content })
      });
    } else {
      console.error("STOMP connection not active");
      throw new Error("STOMP connection not active");
    }
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.currentRoomId = null;
    }
  }
}

export const webSocketService = new WebSocketService();
