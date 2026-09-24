type SyncEventType = 'COMPLAINT_UPDATED' | 'NOTIFICATION_ADDED' | 'NOTIFICATION_UPDATED' | 'SMS_SENT' | 'STORE_RESET';

export interface SyncMessage {
  type: SyncEventType;
  payload?: unknown;
  timestamp: number;
}

type SyncCallback = (msg: SyncMessage) => void;

class RealtimeSyncEngine {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<SyncCallback> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('anavandi_realtime_sync');
      this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
        this.notifyListeners(event.data);
      };
    }

    // Fallback for browsers / cross-tab storage events
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'anavandi_sync_ping_v1') {
          try {
            const data: SyncMessage = JSON.parse(e.newValue || '{}');
            this.notifyListeners(data);
          } catch {
            // ignore
          }
        }
      });
    }
  }

  public subscribe(callback: SyncCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public broadcast(type: SyncEventType, payload?: unknown): void {
    const msg: SyncMessage = {
      type,
      payload,
      timestamp: Date.now(),
    };

    // Broadcast to other tabs via BroadcastChannel
    if (this.channel) {
      this.channel.postMessage(msg);
    }

    // Storage fallback trigger
    try {
      localStorage.setItem('anavandi_sync_ping_v1', JSON.stringify(msg));
    } catch {
      // ignore
    }

    // Also notify current tab listeners immediately
    this.notifyListeners(msg);
  }

  private notifyListeners(msg: SyncMessage): void {
    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.error('Error in sync engine listener:', err);
      }
    });
  }
}

export const syncEngine = new RealtimeSyncEngine();
