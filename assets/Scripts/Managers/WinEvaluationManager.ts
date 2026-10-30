import { _decorator, Component, Node, Sprite, SpriteFrame, Label } from 'cc';
import { SlotEvents } from '../Data/SlotEvents';
import { PlayerInfo } from '../Player/PlayerInfo';
import { SlotGameManager } from '../Managers/SlotGameManager';
import { ReelController } from '../Controllers/ReelController';
import { SymbolConfig } from '../Data/SymbolConfig'; // Update path as needed
import { SymbolView } from '../Views/SymbolView'; // Adjust the relative path to point to your SymbolView.ts file if needed

const { ccclass, property } = _decorator;

@ccclass('WinEvaluationManager')
export class WinEvaluationManager extends Component {

    //Script Reference
    @property(PlayerInfo)
    public playerInfo: PlayerInfo | null = null;

    @property(SlotGameManager)
    public slotGameManager: SlotGameManager | null = null;

    //UI Reference
    @property(Node)
    public winPanel: Node | null = null;

    @property(Sprite)
    public winPanelBG: Sprite | null = null;

    @property(Label)
    public winAmountLabel: Label | null = null;

    @property(Label)
    public winDetailsLabel: Label | null = null;

    //Reference from Heirarchy the Reel_ 
    @property([ReelController])
    public reelController: ReelController[] = []; // Make sure ReelController is imported at the top!

    //Reference from Project File
    @property(SpriteFrame)
    public winSlotBG: SpriteFrame | null = null;

    @property(SpriteFrame)
    public wildBG: SpriteFrame | null = null;

    @property(SpriteFrame)
    public scatterBG: SpriteFrame | null = null;


   //#region Cocos Default Lifecycle
    onLoad() {
        SlotEvents.OnReel3Finished.register(this.evaluateSpinResults);

        // Ensure win panel is hidden on start
        if (this.winPanel) {
            this.winPanel.active = false;
        }
    }

    onDestroy() {
        SlotEvents.OnReel3Finished.unregister(this.evaluateSpinResults);
    }

    //#endregion


    //#region Event Listener

    private evaluateSpinResults = () => {
        // Wait for the final snap and transform updates to completely settle
        this.scheduleOnce(() => {

            if (!this.reelController || this.reelController.length === 0) {
                console.warn("Reel controllers are missing in WinEvaluationManager!");
                return;
            }

            // Target local Y coordinates for Top, Middle, Bottom in the mask window
            const targetYs = [-240, -360, -480];
            const labels = ["TOP", "MIDDLE", "BOTTOM"];

            // Build a 2D grid of SymbolConfig objects: grid[row][reelIndex]
            let boardGrid: SymbolConfig[][] = [[], [], []];

            // Loop through each reel (Reel 1, Reel 2, Reel 3)
            for (let r = 0; r < this.reelController.length; r++) {
                let reelComp = this.reelController[r];
                if (!reelComp || !reelComp.symbolContainer) continue;

                let symbolViews = reelComp.symbolContainer.getComponentsInChildren(SymbolView);
                if (!symbolViews || symbolViews.length === 0) continue;

                for (let i = 0; i < targetYs.length; i++) {
                    let targetY = targetYs[i];

                    // Find the closest symbol to the target Y slot for this reel
                    let closestView = symbolViews.reduce((prev, curr) =>
                        Math.abs(curr.node.position.y - targetY) < Math.abs(prev.node.position.y - targetY) ? curr : prev
                    );

                    // Push the actual SymbolConfig object instead of just a string name
                    if (closestView && closestView.symbolConfig) {
                        boardGrid[i].push(closestView.symbolConfig);
                    } else {
                        console.warn(`Missing SymbolConfig on Reel ${r + 1} at row ${labels[i]}`);
                    }
                }
            }

            // Call your complete payline, scatter, and win-handling method!
            let totalWin = this.checkPaylines(boardGrid);

        }, 0.1); // 100ms delay to let the final frame lock in
    } 

    //#endregion

    //#region method for checking patterns
    
    // Evaluates all standard paylines (with descriptive names) and scatter wins, logging detailed match info.
    public checkPaylines(grid: SymbolConfig[][]): number {
        let totalWinAmount = 0;
        let bet = this.slotGameManager ? this.slotGameManager.currentBet : 1;

        // Group paylines with explicit names for clean and detailed logging
        const paylines = [
            { name: "Top Row", coords: [[0, 0], [0, 1], [0, 2]] },
            { name: "Middle Row", coords: [[1, 0], [1, 1], [1, 2]] },
            { name: "Bottom Row", coords: [[2, 0], [2, 1], [2, 2]] },
            { name: "Diagonal (Top-Left to Bottom-Right)", coords: [[0, 0], [1, 1], [2, 2]] },
            { name: "Diagonal (Top-Right to Bottom-Left)", coords: [[0, 2], [1, 1], [2, 0]] }
        ];

        let hasWildWin = false;
        let hasNormalWin = false;
        let winningSprite: SpriteFrame | null = null; // Store the winning symbol's sprite

        console.log("--- EVALUATING PAYLINES ---");
        for (let lineInfo of paylines) {
            let line = lineInfo.coords;
            const sym1 = grid[line[0][0]][line[0][1]];
            const sym2 = grid[line[1][0]][line[1][1]];
            const sym3 = grid[line[2][0]][line[2][1]];

            let winningSymbol = this.getMatchingSymbolWithWild(sym1, sym2, sym3);

            if (winningSymbol) {
                let multiplier = winningSymbol.payoutValue || 1;
                let lineWin = bet * multiplier;
                totalWinAmount += lineWin;

                winningSprite = winningSymbol.symbolSprite; // Capture the winning sprite here

                // Detailed log showing the specific line name and matched symbol name!
                console.log(`🎉 HIT! [${lineInfo.name}] Symbol: '${winningSymbol.symbolName}' | Payout: ${lineWin} | Bet: ${bet} x Multiplier: ${multiplier}`);
                this.winDetailsLabel.string = `🎉 HIT! [${lineInfo.name}] Symbol: '${winningSymbol.symbolName}' | Payout: ${lineWin} | Bet: ${bet} x Multiplier: ${multiplier}`;


                if (sym1.isWild || sym2.isWild || sym3.isWild) {
                    hasWildWin = true;
                } else {
                    hasNormalWin = true;
                }
            }
        }

        // Check for Scatter condition
        let scatterWinAmount = this.evaluateScatters(grid, bet);
        if (scatterWinAmount > 0) {
            totalWinAmount += scatterWinAmount;
            console.log(`✨ SCATTER HIT! Scatter Bonus Payout: ${scatterWinAmount}`);
        }

        // --- HANDLE WINS & AUTO-SPIN INTERRUPTION ---
        if (totalWinAmount > 0) {
            if (this.playerInfo) {
                this.playerInfo.currentBalance += totalWinAmount;
            }

            // Stop Auto Spin on win so player can see the popup
            if (this.slotGameManager && this.slotGameManager.isAutoSpinActive) {
                this.slotGameManager.DeactivateAutoSpin();
            }

            // Determine win type, fire events, and pass the correct background and symbol sprite frames
            if (scatterWinAmount > 0) {
                SlotEvents.OnScatterWin.raise();
                this.showWinPanel(totalWinAmount, this.scatterBG, winningSprite);
            } else if (hasWildWin) {
                SlotEvents.OnWildWin.raise();
                this.showWinPanel(totalWinAmount, this.wildBG, winningSprite);
            } else if (hasNormalWin) {
                SlotEvents.OnNormalWin.raise();
                this.showWinPanel(totalWinAmount, this.winSlotBG, winningSprite);
            }
        }

        // Final total win summary log
        console.log(`Total Win Amount Calculated: ${totalWinAmount}`);

        return totalWinAmount;
    }

    // Determines if three symbols match on a line, factoring in wild card substitutions.
    private getMatchingSymbolWithWild(s1: SymbolConfig, s2: SymbolConfig, s3: SymbolConfig): SymbolConfig | null {
        let symbols = [s1, s2, s3];

        if (symbols.every(s => s.isWild)) return s1;

        let nonWilds = symbols.filter(s => !s.isWild);
        if (nonWilds.length === 0) return s1;

        let targetSymbolId = nonWilds[0].symbolId;
        let isValidMatch = nonWilds.every(s => s.symbolId === targetSymbolId);

        return isValidMatch ? nonWilds[0] : null;
    }

    // Counts scatter symbols across the board and calculates bonus payouts based on quantity and alignment.
    private evaluateScatters(grid: SymbolConfig[][], bet: number): number {
        let scatterCount = 0;
        let scatterCoordinates: number[][] = [];

        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (grid[r][c].isScatter) {
                    scatterCount++;
                    scatterCoordinates.push([r, c]);
                }
            }
        }

        if (scatterCount >= 3) {
            let isStraightLine = this.isStraightLineCoords(scatterCoordinates);
            if (isStraightLine) {
                console.log("Scatter Straight Line hit! x20 payout.");
                return bet * 20;
            } else {
                console.log("Scatter unaligned hit (3 pieces). x10 payout.");
                return bet * 10;
            }
        }

        return 0;
    }

    // Validates whether the matched scatter coordinates form a valid straight line (row, column, or diagonal).
    private isStraightLineCoords(coords: number[][]): boolean {
        if (coords.length < 3) return false;
        let r0 = coords[0][0], c0 = coords[0][1];
        let r1 = coords[1][0], c1 = coords[1][1];
        let r2 = coords[2][0], c2 = coords[2][1];

        if (r0 === r1 && r1 === r2) return true;
        if (c0 === c1 && c1 === c2) return true;
        if ((r0 === 0 && c0 === 0) && (r1 === 1 && c1 === 1) && (r2 === 2 && c2 === 2)) return true;
        if ((r0 === 0 && c0 === 2) && (r1 === 1 && c1 === 1) && (r2 === 2 && c2 === 0)) return true;

        return false;
    }
    //#endregion

    
    private showWinPanel(amount: number, bgSpriteFrame: SpriteFrame | null, symbolSpriteFrame: SpriteFrame | null) {
        if (!this.winPanel) return;

        this.winPanel.active = true;

        // Apply the specific background sprite frame passed into the function
        if (this.winPanelBG && bgSpriteFrame) {
            this.winPanelBG.spriteFrame = bgSpriteFrame;
        }

        // Update amount text
        if (this.winAmountLabel) {
            this.winAmountLabel.string = `+${amount.toFixed(2)}`;
        }
    }

    //#region onClick Methods

    public clickOkInWinPanel() {
        if (this.winPanel)
        {
            this.winPanel.active = false;
        }
    }
    //#endregion
}