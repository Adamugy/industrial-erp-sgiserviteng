// Real-time sync service using Socket.IO
// Handles live updates between desktop and mobile

import { io, Socket } from 'socket.io-client';
import { api } from './client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type EventHandler = (data: any) => void;

class SyncService {
    private socket: Socket | null = null;
    private handlers: Map<string, Set<EventHandler>> = new Map();
    private lastSyncAt: string | null = null;
    private isOnline: boolean = navigator.onLine;
    private pendingChanges: any[] = [];

    constructor() {
        // Monitor online/offline status
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Load pending changes from localStorage
        const saved = localStorage.getItem('sgi_pending_changes');
        if (saved) {
            this.pendingChanges = JSON.parse(saved);
        }

        // Load last sync time
        this.lastSyncAt = localStorage.getItem('sgi_last_sync');
    }

    connect() {
        const token = api.getToken();
        if (!token) {
            console.warn('Cannot connect to sync service without auth token');
            return;
        }

        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
            console.log('🔌 Connected to sync service');
            this.socket?.emit('agenda:subscribe', {});

            // Request sync for missed changes
            if (this.lastSyncAt) {
                this.socket?.emit('sync:request', { lastSyncAt: this.lastSyncAt });
            }

            // Push any pending offline changes
            if (this.pendingChanges.length > 0) {
                this.pushPendingChanges();
            }
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 Disconnected from sync service');
        });

        // Handle sync response
        this.socket.on('sync:response', (data) => {
            console.log('📥 Received sync data:', data);
            this.lastSyncAt = data.syncTimestamp;
            localStorage.setItem('sgi_last_sync', data.syncTimestamp);

            // Emit events for received data
            if (data.events) {
                data.events.forEach((event: any) => {
                    this.emit('agenda:synced', event);
                });
            }
            if (data.notifications) {
                data.notifications.forEach((notif: any) => {
                    this.emit('notification:synced', notif);
                });
            }
        });

        this.socket.on('sync:push-result', (data) => {
            console.log('📤 Push result:', data);
            // Clear pending changes that were successfully pushed
            this.pendingChanges = [];
            localStorage.removeItem('sgi_pending_changes');
        });

        // Register real-time event handlers
        const realTimeEvents = [
            'agenda:created', 'agenda:updated', 'agenda:deleted', 'agenda:attendee-confirmed',
            'proposal:created', 'proposal:updated', 'proposal:adjudicated', 'proposal:deleted',
            'project:created', 'project:updated', 'project:progress', 'project:deleted',
            'workOrder:created', 'workOrder:updated', 'workOrder:statusChanged', 'workOrder:sstValidated', 'workOrder:deleted',
            'team:created', 'team:updated', 'team:memberAdded', 'team:memberRemoved', 'team:deleted',
            'material:created', 'material:updated', 'material:stockChanged', 'material:deleted',
            'asset:created', 'asset:updated', 'asset:statusChanged', 'asset:assigned', 'asset:deleted',
            'notification:new',
            'alert:stockCritical',
            'presence:updated', 'presence:left',
        ];

        realTimeEvents.forEach(event => {
            this.socket?.on(event, (data) => {
                console.log(`📡 ${event}:`, data);
                this.emit(event, data);
            });
        });
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }

    // Subscribe to events
    on(event: string, handler: EventHandler) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event)!.add(handler);

        return () => {
            this.handlers.get(event)?.delete(handler);
        };
    }

    // Emit to local handlers
    private emit(event: string, data: any) {
        this.handlers.get(event)?.forEach(handler => {
            try {
                handler(data);
            } catch (e) {
                console.error('Event handler error:', e);
            }
        });
    }

    // Queue a change for offline sync
    queueChange(entity: string, action: string, data: any, id?: string) {
        const change = {
            entity,
            action,
            data,
            id,
            tempId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
        };

        this.pendingChanges.push(change);
        localStorage.setItem('sgi_pending_changes', JSON.stringify(this.pendingChanges));

        // If online, push immediately
        if (this.isOnline && this.socket?.connected) {
            this.pushPendingChanges();
        }

        return change.tempId;
    }

    private pushPendingChanges() {
        if (this.pendingChanges.length === 0) return;

        console.log('📤 Pushing pending changes:', this.pendingChanges.length);
        this.socket?.emit('sync:push', { changes: this.pendingChanges });
    }

    private handleOnline() {
        console.log('🌐 Back online');
        this.isOnline = true;

        // Reconnect socket if needed
        if (!this.socket?.connected) {
            this.connect();
        } else {
            // Request sync and push pending changes
            if (this.lastSyncAt) {
                this.socket.emit('sync:request', { lastSyncAt: this.lastSyncAt });
            }
            this.pushPendingChanges();
        }
    }

    private handleOffline() {
        console.log('📴 Gone offline');
        this.isOnline = false;
    }

    // Update presence (for collaborative features)
    updatePresence(view: string, entityId?: string) {
        this.socket?.emit('presence:update', { view, entityId });
    }

    // Check connection status
    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    // Get pending changes count
    getPendingCount(): number {
        return this.pendingChanges.length;
    }
}

// Singleton instance
export const syncService = new SyncService();
export default syncService;
