import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const WS_URL = import.meta.env.VITE_API_URL + '/ws'; // Cambia el host si es necesario

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = {};
    this.subscriptionHandlers = {};
  }

  activateQueuedSubscriptions() {
    if (!this.client || !this.connected) return;

    Object.entries(this.subscriptionHandlers).forEach(([topic, callback]) => {
      if (this.subscriptions[topic]) return;
      this.subscriptions[topic] = this.client.subscribe(topic, (msg) => {
        callback(JSON.parse(msg.body));
      });
    });
  }

  connect(onMessage) {
    if (this.client && (this.connected || this.client.active)) return;

    const token = localStorage.getItem('helpdesk_token')
    this.client = new Client({
      brokerURL: WS_URL,
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      onConnect: () => {
        this.connected = true;
        this.activateQueuedSubscriptions();
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      },
      onWebSocketClose: () => {
        this.connected = false;
        this.subscriptions = {};
      },
    });
    this.client.onUnhandledMessage = (msg) => {
      if (onMessage) onMessage(msg);
    };
    this.client.activate();
  }

  subscribe(topic, callback) {
    this.subscriptionHandlers[topic] = callback;
    this.activateQueuedSubscriptions();
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
      this.subscriptionHandlers = {};
      this.client = null;
    }
  }
}

export default new WebSocketService();
