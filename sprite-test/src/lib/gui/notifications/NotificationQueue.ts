import { makeContainer } from '$lib/gui/containers/container';
import type { Notification } from '$lib/gui/notifications/Notification';
import { store } from '$preset';
import { createEventEmitter, EventEmitterVariant } from '$src/event';

export const eventNotificationQueue = createEventEmitter({
    notificationSpawned: new EventEmitterVariant<{
        notification: Notification
    }>()
});

export class NotificationQueue {
    public get element() { return this._element; }
    private _element: HTMLElement;

    constructor() {
        this._element = makeContainer(['notification-queue']);
        store.notificationQueue.set(this);
        document.body.append(this.element);
    }

    /**
     * Spawns specified notification.
     * @param notification 
     */
    dispatch(notification: Notification): void {
        this.element.append(notification.element);

        eventNotificationQueue.notificationSpawned.emit(this, {
            notification
        });
    }

    /**
     * Queues removal of specified notification.
     * @param notification 
     */
    queueDismiss(notification: Notification, timeoutMs: number): number {
        return window.setTimeout(() => notification.element.remove(), timeoutMs);
    }

    cancelQueuedDismiss(queuedRemovalHandle: number): void {
        window.clearTimeout(queuedRemovalHandle);
    }
}