import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const WS_URL = 'http://localhost:8080/ws'; // Cambia el host si es necesario

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = {};
  }

  connect(onMessage) {
    this.client = new Client({
      brokerURL: WS_URL,
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        this.connected = true;
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
    });
    this.client.onUnhandledMessage = (msg) => {
      if (onMessage) onMessage(msg);
    };
    this.client.activate();
  }

  subscribe(topic, callback) {
    if (!this.client || !this.connected) return;
    if (this.subscriptions[topic]) return;
    this.subscriptions[topic] = this.client.subscribe(topic, (msg) => {
      callback(JSON.parse(msg.body));
    });
  }

  send(destination, body) {
    if (!this.client || !this.connected) return;
    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.connected = false;
      this.subscriptions = {};
    }
  }
}

export default new WebSocketService();
