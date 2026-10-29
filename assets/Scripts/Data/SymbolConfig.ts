import { _decorator, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SymbolConfig')
export class SymbolConfig {
    @property
    public symbolId: number = 0;

    @property
    public symbolName: string = "";

    @property
    public payoutValue: number = 0;

    @property(SpriteFrame)
    public symbolSprite: SpriteFrame;
}