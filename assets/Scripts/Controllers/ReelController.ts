import { _decorator, Component, Node, Prefab, instantiate} from 'cc'; // Make sure 'section' is imported
import { SymbolConfig } from '../Data/SymbolConfig';
import { SymbolView } from '../Views/SymbolView';
import { SlotEvents } from '../Data/SlotEvents';

const { ccclass, property } = _decorator;

@ccclass('ReelController')
export class ReelController extends Component
{
    @property(Prefab)
    public symbolPrefab: Prefab | null = null;

    @property(Node)
    public symbolContainer: Node | null = null;

    //Reel configuration
    @property
    public totalSymbolsInReel: number = 8;

    @property
    public symbolSpacing: number = 120;

    @property
    public reelIndex: number = 0; // 0 for Reel 1, 1 for Reel 2, 2 for Reel 3, etc.

    @property
    public _spinSpeed1: number = 1000; // Default speed for normal mode

    @property
    public _spinSpeed2: number = 4000; // Default speed for fast mode

    @property
    public _spinSpeed3: number = 8000; // Default speed for turbo mode

    public symbolViews: SymbolView[] = [];

    private _isSpinning: boolean = false;
    private _isStopping: boolean = false; // New state for snapping/deceleration
    private _spinSpeed: number = this._spinSpeed1; // Current speed, can be adjusted based on mode

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

        // Snap each child to the nearest multiple of symbolSpacing
        for (const child of this.symbolContainer.children) {
            const currentY = child.position.y;

            // Find the closest grid position based on symbolSpacing
            const targetY = Math.round(currentY / this.symbolSpacing) * this.symbolSpacing;

            // Instantly snap (or we can tween this later for smoothness)
            child.setPosition(child.position.x, targetY);
        }

        // Fully finish stopping state after snapping
        this._isStopping = false;
        console.log("Reel successfully snapped and stopped.");
    }

    //Called by SlotGameManager to adjust speed based on the selected mode
    public setSpeedMode(mode: number): void {
        // Adjust speed and stop delay multipliers based on the selected mode
        switch (mode) {
            case 1: // Normal (1x)
                this._spinSpeed = this._spinSpeed1;
                break;
            case 2: // Fast (2x)
                this._spinSpeed = this._spinSpeed2;
                break;
            case 3: // Turbo (Instant / Very Fast)
                this._spinSpeed = this._spinSpeed3;
                break;
        }
        console.log(`Reel ${this.reelIndex} updated speed to match mode ${mode}`);
    }

    update(dt: number) {
        if (!this._isSpinning || !this.symbolContainer) return;

        const stripHeight = this.totalSymbolsInReel * this.symbolSpacing;
        const bottomLimit = -(this.totalSymbolsInReel - 1) * this.symbolSpacing - this.symbolSpacing * 0.5;

        for (const child of this.symbolContainer.children) {
            const p = child.position;
            let y = p.y - this._spinSpeed * dt;   // scroll DOWN
            if (y < bottomLimit) y += stripHeight; // wrap to the top
            child.setPosition(p.x, y);
        }
    }
}