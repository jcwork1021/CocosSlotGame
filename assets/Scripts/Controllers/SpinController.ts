/**
 * This script is responsible for controlling the spin button's behavior in the slot machine game.
 * This is attached to the Spin_Btn in the scene. It listens for spin start and stop events and updates the button label accordingly.
 */


import { _decorator, Component, Label } from 'cc';
import { SlotEvents } from '../Data/SlotEvents';
import { PlayerInfo } from '../Player/PlayerInfo';
import { SlotGameManager, GameSpeedMode } from '../Managers/SlotGameManager';
import { WinEvaluationManager } from '../Managers/WinEvaluationManager';
const { ccclass, property } = _decorator;

@ccclass('SpinController')
export class SpinController extends Component {

    //Reference from other script
    @property(PlayerInfo)
    public playerInfo: PlayerInfo | null = null;

    @property(SlotGameManager)
    public slotGameManager: SlotGameManager | null = null;

    @property(WinEvaluationManager)
    public winEvaluationManager: WinEvaluationManager

    //Label Reference
    @property(Label)
    public buttonLabel: Label | null = null;

    @property(Label)
    public freeSpinLabel: Label | null = null;

    // Free spin config
    public paidSpinCount: number = 3; // Number of paid spins required to unlock a free spin

    //Status Tracker
    private _isSpinning: boolean = false;

    // Free Spin tracking variables
    private _freeSpinInCounter: number = this.paidSpinCount;
    private _isNextFreeSpin: boolean = false;

    //#region Cocos Default Lifecycle
    onLoad() {

        SlotEvents.OnSpinStarted.register(this.onSpinStarted);
        SlotEvents.OnSpinStopped.register(this.onSpinStopped);

        //Display
        this.freeSpinLabel.string = `Free Spin in: ${this._freeSpinInCounter}`;
    }

    onDestroy() {
        SlotEvents.OnSpinStarted.unregister(this.onSpinStarted);
        SlotEvents.OnSpinStopped.unregister(this.onSpinStopped);
    }
    //#endregion

    //#region onclick events
    // OnClick event for the Spin_Btn
    public ClickSpinStop(): void {

        if (this.winEvaluationManager.isShowingPrize) return; //Since there is a pulse animation first when player got a correct answer, so player should not be able to click stuff yet

        // If we are NOT spinning, clicking this button triggers a NEW SPIN
        if (!this._isSpinning) {
            if (!this.playerInfo || !this.slotGameManager) {
                console.error("PlayerInfo or SlotGameManager is not assigned in the Inspector!");
                return;
            }

            if (this._isNextFreeSpin) {
                console.log("Executing Free Spin! Skipping balance deduction.");
                this._isNextFreeSpin = false; // Consume the free spin
            }
            else {
                // Check balance for normal paid spin...
                if (this.playerInfo.currentBalance < this.slotGameManager.currentBet) {
                    this.slotGameManager.enableWarningPanel(true, "Insufficient Balance!");
                    SlotEvents.OnInSufficientBalance.raise();
                    return;
                }

                this.slotGameManager.enableWarningPanel(false, "");
                this.playerInfo.currentBalance -= this.slotGameManager.currentBet;

                // Increment paid spin counter
                this._freeSpinInCounter -= 1;
                if (this.freeSpinLabel)
                {
                    this.freeSpinLabel.string = `Free Spin in: ${this._freeSpinInCounter}`;
                }

                // Check if we hit the paid spin threshold to unlock the next one as free
                if (this._freeSpinInCounter <= 0) {
                    this._freeSpinInCounter = this.paidSpinCount;
                    this._isNextFreeSpin = true;
                    SlotEvents.OnFreeSpinClaimed.raise(); // Raise event for future use
                }
            }

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
            // If we ARE spinning, clicking this button triggers a MANUAL STOP
            SlotEvents.OnSpinStopped.raise();
        }
    }

    //onclick of SureWin_Btn from Bet_Panel
    public clickSureWin(): void {

        if (this.slotGameManager.forcedToWin) return; //so cannot press twice
        this.slotGameManager.forcedToWin = true;
        this.ClickSpinStop();
    }

    /*
    //onclick of ScatterWin_Btn from Bet_Panel
    public clickScatterWin(): void {
        this.gameFlagsManager.forceScatterNextspin = true;
        this.ClickSpinStop();
    }
    */
    //#endregion

    //#region Event Listener
    private onSpinStarted = () =>
    {
        this._isSpinning = true;
        if (this.buttonLabel) {
            this.buttonLabel.string = "STOP";
        }
    }

    private onSpinStopped = () => {
        this._isSpinning = false;
        if (this.buttonLabel) {
            // If the next spin is a free spin, show "FREE", otherwise show "SPIN"
            this.buttonLabel.string = this._isNextFreeSpin ? "FREE" : "SPIN";
        }

        // Check if Auto Spin is active via SlotGameManager
        if (this.slotGameManager && this.slotGameManager.isAutoSpinActive) {
            this.scheduleOnce(() => {
                if (this.slotGameManager && this.slotGameManager.isAutoSpinActive) {
                    console.log("Auto Spin: Triggering next round...");
                    this.ClickSpinStop();
                }
            }, 0.8);
        }
    }
    //#endregion
}