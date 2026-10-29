/**
 * This is attached to Reel_1, Reel_2, and Reel_3 in the scene.
 * Since each reel has its own controller, we can manage them independently.
 * since each reel rotate on their own, we can have different spin speeds and stop times for each reel.
 * 
 */


import { _decorator, Component, Node, Prefab, instantiate } from 'cc';
import { SymbolConfig } from '../Data/SymbolConfig';
import { SymbolView } from '../Views/SymbolView';

const { ccclass, property } = _decorator;

@ccclass('ReelController')
export class ReelController extends Component {
    @property(Prefab)
    public symbolPrefab: Prefab | null = null;

    @property(Node)
    public symbolContainer: Node | null = null;

    @property
    public totalSymbolsInReel: number = 8;

    @property
    public symbolSpacing: number = 120;

    public symbolViews: SymbolView[] = [];

    public initReel(availableSymbols: SymbolConfig[]): void {
        if (!this.symbolPrefab || !this.symbolContainer) {
            console.error("Symbol Prefab or Symbol Container is missing on ReelController!");
            return;
        }

        // Clear existing symbols from the container
        this.symbolContainer.removeAllChildren();
        this.symbolViews = [];

        for (let i = 0; i < this.totalSymbolsInReel; i++) {
            const symbolNode = instantiate(this.symbolPrefab);
            this.symbolContainer.addChild(symbolNode);

            const posX = 0;
            const posY = i * -this.symbolSpacing;
            symbolNode.setPosition(posX, posY);

            const symbolView = symbolNode.getComponent(SymbolView);
            if (symbolView && availableSymbols.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableSymbols.length);
                symbolView.init(availableSymbols[randomIndex]);
                this.symbolViews.push(symbolView);
            }
        }
    }


    //#region Calls from SlotGameController

    /**
     * Calls from the SlotGameController when the spin button is pressed.
     */
    public startSpin(): void
    {
        console.log("Reel started spinning...");
    }

    /**
     * Placeholder for stopping logic with final results
     */
    public stopSpin(finalResults: SymbolConfig[]): void
    {
        console.log("Reel stopping with results...");
    }

    //#endregion

}