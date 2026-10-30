import { _decorator, Component, Sprite } from 'cc';
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
    }
}