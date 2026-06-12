import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
const WS_PROTOCOL = isSecure ? 'https:' : 'http:';
const HOST = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
// API 베이스 도메인/포트 맞춤 (개발환경: 8082)
const PORT = typeof window !== 'undefined' && window.location.hostname.includes('ourband.o-r.kr') ? '' : ':8082';

const WS_URL = `${WS_PROTOCOL}//${HOST}${PORT}/api/ws-chat`;

class WebSocketService {
  private client: Client | null = null;
  private currentRoomId: number | null = null;
  private roomSubscription: any = null;
  private globalSubscription: any = null;
  private onConnectCallbacks: (() => void)[] = [];

  connectGlobal(userId: number, onGlobalMessage: (msg: any) => void) {
    if (this.client) return;

    // HttpOnly 쿠키 환경에서는 Native WebSocket 대신 SockJS + withCredentials를 사용하여 쿠키 자동 전송
    this.client = new Client({
      // @ts-ignore - sockjs-client 타입 정의에 withCredentials가 누락되어 있음
    webSocketFactory: () => new SockJS(WS_URL, null, { withCredentials: true } as any),
      debug: (str) => {
        // console.log("STOMP: " + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      this.globalSubscription = this.client?.subscribe(`/sub/chat.user.${userId}`, (message: IMessage) => {
        if (message.body) {
          onGlobalMessage(JSON.parse(message.body));
        }
      });
      
      // Execute queued callbacks
      this.onConnectCallbacks.forEach(cb => cb());
      this.onConnectCallbacks = [];
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    this.client.activate();
  }

  subscribeRoom(roomId: number, onMessageReceived: (msg: any) => void) {
    const doSubscribe = () => {
      if (this.currentRoomId === roomId) return;
      this.unsubscribeRoom();
      
      this.currentRoomId = roomId;
      this.roomSubscription = this.client?.subscribe(`/sub/chat.room.${roomId}`, (message: IMessage) => {
        if (message.body) {
          onMessageReceived(JSON.parse(message.body));
        }
      });
    };

    if (this.client && this.client.connected) {
      doSubscribe();
    } else {
      this.onConnectCallbacks.push(doSubscribe);
    }
  }

  unsubscribeRoom() {
    if (this.roomSubscription) {
      this.roomSubscription.unsubscribe();
      this.roomSubscription = null;
    }
    this.currentRoomId = null;
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
    this.unsubscribeRoom();
    if (this.globalSubscription) {
      this.globalSubscription.unsubscribe();
      this.globalSubscription = null;
    }
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.onConnectCallbacks = [];
  }
}

export const webSocketService = new WebSocketService();
