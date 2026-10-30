import { GameEvent } from './GameEvent';

export const SlotEvents = {
    OnSpinStarted: new GameEvent(),
    OnSpinStopped: new GameEvent(),
    OnInSufficientBalance: new GameEvent(),
    OnWinCalculated: new GameEvent(),
};