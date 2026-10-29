import { _decorator, Component, Node, Label } from 'cc';
import { SymbolConfig } from '../Data/SymbolConfig';
import { ReelController } from '../Controllers/ReelController';
import { PlayerInfo } from '../Player/PlayerInfo';
const { ccclass, property } = _decorator;

@ccclass('SlotGameManager')
export class SlotGameManager extends Component {

    @property(SymbolConfig)
    public symbolDatabase: SymbolConfig[] = []; // Configure symbols here

    @property([ReelController])
    public reels: ReelController[] = []; // Drag Reel nodes here

    @property
    public minimumBet: number = 10; // Minimum bet limit

    @property
    public currentBet: number = 10; // Default bet, but can be changed via UI buttons!

    @property(Node)
    public warningPanel: Node | null = null; // Warning_Panel GameObject

    @property(Label)
    public warningLabel: Label | null = null; // Warning_Label component

    @property(Label)
    public betLabel: Label | null = null; // Bet_Label component

    @property(PlayerInfo)
    public playerInfo: PlayerInfo | null = null;


    //#region Lifecycle Methods
    start() {
        this.initializeGame();

        // Hide warning panel on start by default
        if (this.warningPanel)
        {
            this.warningPanel.active = false;
        }

        this.defaultBet();
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
            console.log(`Current bet updated to: ${this.currentBet}`);
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

    // Called in Bet_Panel, Spin_Btn
    public clickSpin(): void {
        if (!this.playerInfo) {
            console.error("Player Info is not assigned in the Inspector!");
            return;
        }

        // Check if player has enough balance to cover the bet
        if (this.playerInfo.currentBalance < this.currentBet) {
            this.enableWarningPanel(true, "Insufficient Balance!");
            return;
        }

        // Hide any active warnings if valid
        this.enableWarningPanel(false, "");

        this.playerInfo.currentBalance -= this.currentBet;

        console.log(`Spin button clicked! Bet placed: ${this.currentBet}. Remaining Balance: ${this.playerInfo.currentBalance}`);

        for (const reel of this.reels) {
            if (reel) {
                reel.startSpin();
            }
        }
    }

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

    public clickOkayWarning(): void {

        this.enableWarningPanel(false, "");
    }

    //#endregion
}