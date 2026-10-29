import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlayerInfo')
export class PlayerInfo extends Component {

    @property(Label)
    public balanceLabel: Label | null = null; // Drag your Balance_Label here in the Inspector

    @property
    private _currentBalance: number = 9000; // Default Balance

    start() {
        this.updateBalanceUI();
    }

    @property
    public get currentBalance(): number {
        return this._currentBalance;
    }

    public set currentBalance(value: number) {
        if (this._currentBalance !== value) {
            this._currentBalance = value;
            this.updateBalanceUI(); // Automatically updates UI whenever balance changes!
        }
    }

    private updateBalanceUI(): void {
        if (this.balanceLabel) {
            this.balanceLabel.string = this._currentBalance.toString();
            console.log(`Balance updated to: ${this._currentBalance}`);
        }
    }
}