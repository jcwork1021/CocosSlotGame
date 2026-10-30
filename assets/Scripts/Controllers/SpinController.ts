/**
 * This script is responsible for controlling the spin button's behavior in the slot machine game.
 * This is attached to the Spin_Btn in the scene. It listens for spin start and stop events and updates the button label accordingly.
 */


import { _decorator, Component, Label } from 'cc';
import { SlotEvents } from '../Data/SlotEvents';
import { PlayerInfo } from '../Player/PlayerInfo';
import { SlotGameManager, GameSpeedMode } from '../Managers/SlotGameManager';
const { ccclass, property } = _decorator;

@ccclass('SpinController')
export class SpinController extends Component {

    //Reference from other script
    @property(PlayerInfo)
    public playerInfo: PlayerInfo | null = null;

    @property(SlotGameManager)
    public slotGameManager: SlotGameManager | null = null;

    //Label Reference
    @property(Label)
    public buttonLabel: Label | null = null;

    //Status
    public _isSpinning: boolean = false;

    onLoad() {

        SlotEvents.OnSpinStarted.register(this.onSpinStarted);
        SlotEvents.OnSpinStopped.register(this.onSpinStopped);
    }

    onDestroy() {
        SlotEvents.OnSpinStarted.unregister(this.onSpinStarted);
        SlotEvents.OnSpinStopped.unregister(this.onSpinStopped);
    }

    // Inside your ClickSpinStop() method in SpinController.ts:
    public ClickSpinStop(): void {
        if (!this._isSpinning) {
            if (!this.playerInfo || !this.slotGameManager) {
                console.error("PlayerInfo or SlotGameManager is not assigned in the Inspector!");
                return;
            }

            // Check balance...
            if (this.playerInfo.currentBalance < this.slotGameManager.currentBet) {
                this.slotGameManager.enableWarningPanel(true, "Insufficient Balance!");
                return;
            }

            this.slotGameManager.enableWarningPanel(false, "");
            this.playerInfo.currentBalance -= this.slotGameManager.currentBet;

            // 1. Start the spin normally
            SlotEvents.OnSpinStarted.raise();

            // 2. Check if Turbo Mode (3x) is active via SlotGameManager
            if (this.slotGameManager.currentSpeedMode === GameSpeedMode.Turbo) {
                // Automatically raise the stop event after 50ms for an instant turbo finish
                this.scheduleOnce(() => {
                    SlotEvents.OnSpinStopped.raise();
                }, 0.05);
            }
        }
        else {
            // Manual stop when player clicks "STOP" during normal/fast modes
            SlotEvents.OnSpinStopped.raise();
        }
    }

    private onSpinStarted = () => {
        this._isSpinning = true;
        if (this.buttonLabel) {
            this.buttonLabel.string = "STOP";
        }
    }

    private onSpinStopped = () => {
        this._isSpinning = false;
        if (this.buttonLabel) {
            this.buttonLabel.string = "SPIN";
        }
    }
}