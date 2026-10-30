import { _decorator, Component, Node, Label } from 'cc';
import { SymbolConfig } from '../Data/SymbolConfig';
import { SlotEvents } from '../Data/SlotEvents';
import { ReelController } from '../Controllers/ReelController';
import { PlayerInfo } from '../Player/PlayerInfo';
const { ccclass, property } = _decorator;

export enum GameSpeedMode {
    Normal = 1,
    Fast = 2,
    Turbo = 3
}

@ccclass('SlotGameManager')
export class SlotGameManager extends Component {

    @property(SymbolConfig)
    public symbolDatabase: SymbolConfig[] = []; // Configure symbols here

    //Reference from other script
    @property([ReelController])
    public reels: ReelController[] = []; // Drag Reel nodes here

    @property(PlayerInfo)
    public playerInfo: PlayerInfo | null = null;

    //Bet Config
    @property
    public minimumBet: number = 10; // Minimum bet limit

    @property
    public currentBet: number = 10; // Default bet, but can be changed via UI buttons!

    //Reference to UI Elements for Warning Panel
    @property(Node)
    public warningPanel: Node | null = null; // Warning_Panel GameObject

    @property(Label)
    public warningLabel: Label | null = null; // Warning_Label component

    //Reference to other Label Elements
    @property(Label)
    public betLabel: Label | null = null; // Bet_Label component

    @property(Label)
    public speedButtonLabel: Label | null = null;

    // Reference to Auto Spin Label UI element
    @property(Label)
    public autoSpinButtonLabel: Label | null = null;

    // Auto Spin State
    private _isAutoSpinActive: boolean = false;

    private _isSpinning: boolean = false;

    // Speed Config
    private _currentSpeedIndex: number = 0;
    private _speedModes: GameSpeedMode[] = [GameSpeedMode.Normal, GameSpeedMode.Fast, GameSpeedMode.Turbo];
    private _speedLabels: string[] = ["1x", "2x", "3x"];

    // Cheat Config
    @property
    public forcedToWin: boolean = false;


    // Public Getter
    public get isAutoSpinActive(): boolean {
        return this._isAutoSpinActive; //Getter for Auto Spin State
    }

    public get currentSpeedMode(): GameSpeedMode {
        return this._speedModes[this._currentSpeedIndex]; //getter for current speed mode
    }

    //#region Lifecycle Methods
    start() {
        this.initializeGame();

        // Hide warning panel on start by default
        if (this.warningPanel)
        {
            this.warningPanel.active = false;
        }

        this.defaultBet();

        // Listen to spin events globally
        SlotEvents.OnSpinStarted.register(this.onSpinStarted);
        SlotEvents.OnSpinStopped.register(this.onSpinStopped);
    }

    onDestroy() {
        SlotEvents.OnSpinStarted.unregister(this.onSpinStarted);
        SlotEvents.OnSpinStopped.unregister(this.onSpinStopped);
    }

    //#endregion

    //#region event Listener
    private onSpinStarted = () => {
        this._isSpinning = true;
    }

    private onSpinStopped = () => {
        this._isSpinning = false;
    }
    //#endregion

    //#region Methods

    /**
    * Initializes the game by setting up all reels with our symbol database
    */
    public initializeGame(): void {
        if (this.symbolDatabase.length === 0) {
            console.warn("Symbol Database is empty! Please configure symbols in the Inspector.");
            return;
        }

        // Initialize each reel column
        for (const reel of this.reels) {
            if (reel) {
                reel.initReel(this.symbolDatabase);
                //console.error(`Reel initialized with ${this.symbolDatabase.length} symbols.`);
            }
        }
    }

    //Calls in WinEvaluationManager.ts when we will show a reward so it stop the auto spin
    public DeactivateAutoSpin(): void {
        this._isAutoSpinActive = false;
    }

    public defaultBet(): void {
        if (this.playerInfo) {
            this.currentBet += this.minimumBet
            this.enableWarningPanel(false, "");
            this.updateBetLabel();
        }
    }

    public updateBetLabel(): void {
        if (this.betLabel) {
            this.betLabel.string = this.currentBet.toString();
            //console.log(`Current bet updated to: ${this.currentBet}`);
        } else {
            console.warn("Bet Label is not assigned in the Inspector!");
        }
    }

    // Warning Panel Handler
    public enableWarningPanel(visible: boolean, warningMessage: string): void {
        if (this.warningLabel) {
            this.warningLabel.string = warningMessage;
        }
        if (this.warningPanel) {
            this.warningPanel.active = visible;
        }
    }
    //#endregion

    //#region UI Button Calls
    // Called in Bet_Panel, Increase_Btn
    public clickIncreaseBet(): void {
        const step = 10; // Increment step
        if (this.playerInfo) {

            if (this.currentBet + step <= this.playerInfo.currentBalance) {
                this.currentBet += step;

                this.enableWarningPanel(false, "");
                this.updateBetLabel();
            } else {
                this.enableWarningPanel(true, "Cannot bet more than your balance!");
            }
        } else {
            console.error("Player Info is not assigned in the Inspector!");
        }
    }

    // Called in Bet_Panel, Decrease_Btn
    public clickDecreaseBet(): void {
        const step = 10; // Decrement step
        if (this.currentBet - step >= this.minimumBet) { // Minimum bet limit of 10
            this.currentBet -= step;
            this.enableWarningPanel(false, "");
            this.updateBetLabel();
        } else {
            this.enableWarningPanel(true, `Minimum bet is ${this.minimumBet}!`);
        }
    }

    // Called in Speed_Panel, Speed_Btn
    public clickSpeed(): void {

        // Prevent speed change while spinning using the local event-driven flag
        if (this._isSpinning) return;

        // Cycle to the next speed index (loops back to 0 at the end)
        this._currentSpeedIndex = (this._currentSpeedIndex + 1) % this._speedModes.length;

        const activeSpeedMode = this._speedModes[this._currentSpeedIndex];
        const activeLabel = "Speed: " + this._speedLabels[this._currentSpeedIndex];

        // Update the button UI label
        if (this.speedButtonLabel) {
            this.speedButtonLabel.string = activeLabel;
        }

        console.log("Game speed changed to: " + activeLabel);

        // Apply the speed multiplier directly to all registered reels
        for (const reel of this.reels) {
            if (reel) {
                reel.setSpeedMode(activeSpeedMode);
            }
        }
    }

    // Called in Speed_Panel AutoSpin_Btn
    public clickAutoSpin(): void {
        // Toggle the state
        this._isAutoSpinActive = !this._isAutoSpinActive;

        const activeLabel = this._isAutoSpinActive ? "Auto: On" : "Auto: Off";

        // Update the button UI label
        if (this.autoSpinButtonLabel)
        {
            this.autoSpinButtonLabel.string = activeLabel;
        }

        //Raise Global event for futue use
        if (activeLabel) {
            SlotEvents.OnAutoSpinOn.raise();
        } else {
            SlotEvents.OnAutoSpinOff.raise();
        }

        //console.log("Auto Spin toggled: " + activeLabel);
    }

    public clickOkayWarning(): void {

        this.enableWarningPanel(false, "");
    }

    //#endregion
}