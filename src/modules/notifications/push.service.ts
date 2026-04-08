import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webPush from 'web-push';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Injectable()
export class PushService implements OnModuleInit {
  private subscriptions = new Map<string, PushSubscriptionData>();

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const email = this.config.get<string>('VAPID_EMAIL') || 'mailto:admin@example.com';

    if (publicKey && privateKey) {
      webPush.setVapidDetails(email, publicKey, privateKey);
    }
  }

  getPublicKey(): string {
    return this.config.get<string>('VAPID_PUBLIC_KEY') || '';
  }

  subscribe(userId: string, subscription: PushSubscriptionData) {
    this.subscriptions.set(userId, subscription);
  }

  unsubscribe(userId: string) {
    this.subscriptions.delete(userId);
  }

  async sendToAll(title: string, body: string) {
    const payload = JSON.stringify({ title, body, icon: '/icon-192.png' });

    for (const [userId, sub] of this.subscriptions) {
      try {
        await webPush.sendNotification(sub, payload);
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          this.subscriptions.delete(userId);
        }
      }
    }
  }

  async sendToUser(userId: string, title: string, body: string) {
    const sub = this.subscriptions.get(userId);
    if (!sub) return;

    const payload = JSON.stringify({ title, body, icon: '/icon-192.png' });
    try {
      await webPush.sendNotification(sub, payload);
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        this.subscriptions.delete(userId);
      }
    }
  }
}
