import { _decorator, Component, Node, Prefab, instantiate } from 'cc';
import { SymbolConfig } from '../Data/SymbolConfig';
import { SymbolView } from '../Views/SymbolView';
import { SlotEvents } from '../Data/SlotEvents';
import { SlotGameManager } from '../Managers/SlotGameManager';

const { ccclass, property } = _decorator;

@ccclass('ReelController')
export class ReelController extends Component {
    @property(Prefab)
    public symbolPrefab: Prefab | null = null;

    @property(Node)
    public symbolContainer: Node | null = null;

    //Script Reference
    @property(SlotGameManager)
    public slotGameManager: SlotGameManager | null = null;

    //Reel configuration
    @property
    public totalSymbolsInReel: number = 8;

    @property
    public symbolSpacing: number = 120;

    @property
    public reelIndex: number = 0; // 0 for Reel 1, 1 for Reel 2, 2 for Reel 3, etc.

    //Speed Config
    @property
    public _spinSpeed1: number = 1000;
    @property
    public _spinSpeed2: number = 2000;
    @property
    public _spinSpeed3: number = 3000;

    //Generated Symbol
    public symbolViews: SymbolView[] = [];

    //Private Status
    private _isSpinning: boolean = false;
    private _isStopping: boolean = false;
    private _spinSpeed: number = this._spinSpeed1;

    onLoad() {
        SlotEvents.OnSpinStarted.register(this.startSpin);
        SlotEvents.OnSpinStopped.register(this.stopSpin);
    }

    onDestroy() {
        SlotEvents.OnSpinStarted.unregister(this.startSpin);
        SlotEvents.OnSpinStopped.unregister(this.stopSpin);
    }

    public initReel(availableSymbols: SymbolConfig[]): void {
        if (!this.symbolPrefab || !this.symbolContainer) {
            console.error("Symbol Prefab or Symbol Container is missing on ReelController!");
            return;
        }

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

    //#region Event Handlers
    private startSpin = () => {
        if (this._isSpinning || this._isStopping) return;

        this._isSpinning = true;
        this._isStopping = false;
    }

    private stopSpin = () => {
        if (!this._isSpinning || this._isStopping) return;

        this._isStopping = true;
        const stopDelay = this.reelIndex * 0.3;

        this.scheduleOnce(() => {
            this._isSpinning = false;
            this.snapToGrid();
        }, stopDelay);
    }
    //#endregion

    private snapToGrid() {
        if (!this.symbolContainer) return;

        // --- SURE WIN TEST MODE OVERRIDE ---
        if (this.slotGameManager && this.slotGameManager.forcedToWin)
        {
            let symbolViews = this.symbolContainer.getComponentsInChildren(SymbolView);
            const targetYs = [-240, -360, -480]; // Top, Middle, Bottom mask window slots

            if (symbolViews && symbolViews.length > 0) {
                // Target the middle row (-360) to guarantee a matching line win across reels
                let targetY = targetYs[1]; // Middle row index
                let closestView = symbolViews.reduce((prev, curr) =>
                    Math.abs(curr.node.position.y - targetY) < Math.abs(prev.node.position.y - targetY) ? curr : prev
                );

                if (closestView && this.slotGameManager) {
                    // Use symbolDatabase instead of availableSymbolConfigs
                    let winConfig = (this.slotGameManager as any).symbolDatabase?.find((s: any) => s.symbolName === "Diamond");
                    if (winConfig) {
                        closestView.init(winConfig);
                    } else {
                        console.warn("Could not find 'diamond' in symbolDatabase!");
                    }
                }
            }

            // Reset regular win flag on the final reel, cuz the index is 0,1,2
            if (this.reelIndex === 2) {
                this.slotGameManager.forcedToWin = false;
            }

            //console.error(`[TEST MODE] Forcing Regular Win on Reel ${this.reelIndex}`);

        }

        // Snap each child to the nearest multiple of symbolSpacing
        for (const child of this.symbolContainer.children) {
            const currentY = child.position.y;
            const targetY = Math.round(currentY / this.symbolSpacing) * this.symbolSpacing;
            child.setPosition(child.position.x, targetY);
        }

        this._isStopping = false;

        // If this is the last reel, raise the event to notify WinEvaluationManager to evaluate the board
        if (this.reelIndex === 2 && this.slotGameManager) {
            SlotEvents.OnReel3Finished.raise();
        }

        console.log(`Reel ${this.reelIndex} successfully snapped and stopped.`);
    }

    public setSpeedMode(mode: number): void {
        switch (mode) {
            case 1: this._spinSpeed = this._spinSpeed1; break;
            case 2: this._spinSpeed = this._spinSpeed2; break;
            case 3: this._spinSpeed = this._spinSpeed3; break;
        }
    }

    update(dt: number) {
        if (!this._isSpinning || !this.symbolContainer) return;

        const stripHeight = this.totalSymbolsInReel * this.symbolSpacing;
        const bottomLimit = -(this.totalSymbolsInReel - 1) * this.symbolSpacing - this.symbolSpacing * 0.5;

        for (const child of this.symbolContainer.children) {
            const p = child.position;
            let y = p.y - this._spinSpeed * dt;
            if (y < bottomLimit) y += stripHeight;
            child.setPosition(p.x, y);
        }
    }
}