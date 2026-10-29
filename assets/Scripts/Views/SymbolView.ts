import { _decorator, Component, Sprite } from 'cc';
import { SymbolConfig } from '../Data/SymbolConfig'; // Adjust path if your folder structure differs
const { ccclass, property } = _decorator;

@ccclass('SymbolView')
export class SymbolView extends Component {

    @property(Sprite)
    private symbolSprite: Sprite | null = null;

    public init(config: SymbolConfig): void {
        // Fallback in case the slot wasn't assigned in the prefab
        if (!this.symbolSprite) {
            this.symbolSprite = this.getComponent(Sprite);
        }

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