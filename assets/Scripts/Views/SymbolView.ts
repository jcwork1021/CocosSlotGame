import { _decorator, Component, Sprite, Node, tween, Vec3 } from 'cc';
import { SymbolConfig } from '../Data/SymbolConfig'; // Adjust path if your folder structure differs
const { ccclass, property } = _decorator;

@ccclass('SymbolView')
export class SymbolView extends Component {

    @property(Sprite)
    private symbolSprite: Sprite | null = null;

    
    public symbolConfig: SymbolConfig | null = null;

    public symbolN: string;


    public init(config: SymbolConfig): void {

        this.symbolConfig = config; //Saved the config details assigned to it

        if (!this.symbolSprite) {
            console.error("SymbolView: no Sprite component found on", this.node.name);
            return;
        }

        if (!config?.symbolSprite) {
            console.error("SymbolView: config has no symbolSprite for", config?.symbolName);
            return;
        }

        this.symbolSprite.spriteFrame = config.symbolSprite;

        //this.playWinAnimation(); Visualize Sample Onli
    }

    //Pluse Animation using tween
    public playWinAnimation() {

        // Stop any existing tweens to prevent overlapping conflicts
        tween(this.node).stop();

        // Create a smooth pulsing/breathing loop effect
        tween(this.node)
            .to(0.15, { scale: new Vec3(1.2, 1.2, 1) }) // Pop up slightly
            .to(0.15, { scale: new Vec3(1.0, 1.0, 1) }) // Return to normal
            .union()
            .repeat(10) // Repeat x
            .start();
    }
}