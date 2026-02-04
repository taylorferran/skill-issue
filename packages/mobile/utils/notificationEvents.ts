/**
 * Simple event emitter for notification-related events across the app
 * Used to coordinate refreshes between header notifications and assessment page
 */

type NotificationEventCallback = () => void;

class NotificationEventEmitter {
  private listeners: Set<NotificationEventCallback> = new Set();

  subscribe(callback: NotificationEventCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  emit(): void {
    this.listeners.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('[NotificationEventEmitter] Error in listener:', error);
      }
    });
  }
}

export const notificationEventEmitter = new NotificationEventEmitter();
