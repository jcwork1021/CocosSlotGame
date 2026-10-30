import { _decorator } from 'cc';

type EventListener = () => void;

export class GameEvent {
    private listeners: EventListener[] = [];

    public raise(): void {
        //console.log(`[GameEvent DEBUG] RAISE called! Current listener count: ${this.listeners.length}`);
        for (const listener of this.listeners) {
            listener();
        }
    }

    public register(listener: EventListener): void {
        if (this.listeners.indexOf(listener) === -1) {
            this.listeners.push(listener);
            //console.log(`[GameEvent DEBUG] SUCCESS: Listener registered. Total listeners now: ${this.listeners.length}`);
        } else {
            //console.log(`[GameEvent DEBUG] WARNING: Tried to register duplicate listener.`);
        }
    }

    public unregister(listener: EventListener): void {
        const index = this.listeners.indexOf(listener);
        if (index !== -1) {
            this.listeners.splice(index, 1);
            //console.log(`[GameEvent DEBUG] Listener unregistered. Total listeners now: ${this.listeners.length}`);
        }
    }
}