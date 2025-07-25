import { makeContainer } from '$lib/gui/containers/container';
import { make } from '$lib/gui/make';
import { eventNotificationQueue } from '$lib/gui/notifications/NotificationQueue';
import { store } from '$preset';

const cssVarNameDurationMs = '--notif-duration-ms';
const cssVarNameNotifRemovalDurationMs = '--notif-removal-duration-ms';
const notifRemovalDurationMs = 150;
const classInitial = "initial";
const classAutoDismissDisabled = "no-auto-dismiss";
const classRemoving = "removing";

export type NotificationType =
    'info'
    | 'warning'
    | 'error';

export class Notification {
    public get element() { return this._element; }
    private _element: HTMLElement;

    public get title() { return this._title; }
    private _title: string;

    public get content() { return this._content; }
    private _content: string;

    public get durationMs() { return this._durationMs; }
    private _durationMs: number;

    private _progressElement: HTMLElement;

    private _queuedDismissHandle: number | null = null;

    /**
     * Creates a new notification. DOES NOT display it on screen. To display, call {@link dispatch}.
     * @param type Notification type.
     * @param title Notification title.
     * @param content Notification content.
     * @param durationMs Duration to show the notification for, in ms. 
     * If not specified, differs based on notification type. 
     * Hovering over a notification will disable auto-dismissal.
     */
    constructor(type: NotificationType, title: string, content: string, durationMs?: number) {
        this._title = title;
        this._content = content;

        if (durationMs !== undefined)
            this._durationMs = durationMs;
        else
            switch (type) {
                case 'info':
                    this._durationMs = 5000;
                    break;
                case 'warning':
                case 'error':
                    this._durationMs = 10000;
                    break;
                default:
                    throw new Error("unsupported notif type: " + type);
            }

        this._element = makeContainer(['notification', classInitial, type]);
        this.element.style.setProperty(cssVarNameDurationMs, this._durationMs + 'ms');
        this.element.style.setProperty(cssVarNameNotifRemovalDurationMs, notifRemovalDurationMs + 'ms');
        this.element.addEventListener('mouseenter', () => this.cancelQueuedDismiss());
        this.element.addEventListener('contextmenu', e => {
            e.preventDefault();
            this.queueDismiss(0)
        });

        this._progressElement = make(`<div class="notification-progress initial"></div>`);
        this.element.append(
            this._progressElement,
            make(`<span class="notification-header">${title}</span>`),
            make(`<span class="notification-content">${content}</span>`),
        );
    }

    /**
     * Spawns notification.
     */
    dispatch(): void {
        store.notificationQueue.get().dispatch(this);
        setTimeout(() => {
            this.element.classList.remove(classInitial);
            this._progressElement.classList.remove(classInitial);
        }, 50);

        this.queueDismiss();
    }

    private queueDismiss(timeoutMs: number = this.durationMs): void {
        const cb = () => {
            store.notificationQueue.get().queueDismiss(this, notifRemovalDurationMs);
            this.element.classList.add(classRemoving);

            this._queuedDismissHandle = null;
        }

        if (timeoutMs === 0)
            cb();
        else
            this._queuedDismissHandle = window.setTimeout(() => cb(), timeoutMs);
    }

    private cancelQueuedDismiss(): void {
        if (this._queuedDismissHandle === null)
            return;

        window.clearTimeout(this._queuedDismissHandle);
        this._progressElement.classList.add(classAutoDismissDisabled);
        this._queuedDismissHandle = null;

        // freeze progress bar
        this._progressElement.style.setProperty('width', getComputedStyle(this._progressElement).width);
        this._progressElement.style.setProperty('--notif-progress-transition', 'none');
    }
}