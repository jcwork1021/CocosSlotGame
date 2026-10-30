import { GameEvent } from './GameEvent';

export const SlotEvents = {
    OnSpinStarted: new GameEvent(),
    OnSpinStopped: new GameEvent(),
    OnInSufficientBalance: new GameEvent(),
    OnAutoSpinOn: new GameEvent(),
    OnAutoSpinOff: new GameEvent(),
    OnFreeSpinClaimed: new GameEvent(),
    OnReel3Finished: new GameEvent(), //Game Event to know if the final reels animation finished, so we can check output 
    OnWinCalculated: new GameEvent(),
    OnNormalWin: new GameEvent(),
    OnWildWin: new GameEvent(),
    OnScatterWin: new GameEvent(),
};