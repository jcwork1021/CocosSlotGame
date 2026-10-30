Developed by: John Carlo Roa

Setup Instructions
## Setup Instructions
1. Download or clone the repository to your local machine.
2. Open **Cocos Creator (v3.8.4)**.
3. On the dashboard, click the **Open** button and select the root folder of this cloned repository.
4. Once the project finishes importing and compiling assets, open the main game scene from `assets/Scenes/Game` and click the **Play** button in the editor.

### Architecture Approach
The project follows a **Component-Based Architecture with an Event-Driven pattern**, adhering to core SOLID principles to ensure clean separation of responsibilities and low coupling:
- **Manager & Controller Pattern:** 
Game flow, state management, and rules are isolated within dedicated managers (SlotGameManager.ts, WinEvaluationManager.ts), 
while mechanical behaviors are handled by controllers (ReelController.ts, SpinController.ts)and views ("SymbolView.ts").
- **Decoupled Communication:** System triggers and state changes (OnStartSpin, OnStopSpin) utilize a custom event bus (SlotEvent.ts), 
preventing tight dependencies between UI elements, reels, and evaluation logic.
- **Data-Driven Symbol Configuration:** Individual symbol attributes (IDs, sprites, payouts, wild/scatter flags) are decoupled from game logic using dedicated configuration classes/structures (SymbolConfig.ts), 
making it easy to add or modify symbols in the future.
- **Variables** - No Hardcoded value in the script, everything is variable basis.


### Key Design Decisions
- **Event-Driven Synchronization:** Used a decoupled event bus (SlotEvent.ts) to trigger win evaluations upon the final reel stopping, preventing tight dependencies between animations and game rules.
- **Data-Driven Symbol Configuration:** Encapsulated symbol properties (IDs, sprites, payouts, wild/scatter flags) into a dedicated structure (SymbolConfig.ts), allowing for clean and scalable expansion of game symbols.
- **Tween-Based Visual Delays & Animations:** Leveraged Cocos Creator's native tween().delay() system to handle pause timing and symbol pulsing effects synchronously, keeping the code clean and engine-friendly.
- **Logical Grid Mapping:** Translated physical reel node coordinates to a 2D array matrix (SymbolConfig[][]) dynamically on spin completion to accurately evaluate 3 rows and 2 diagonal paylines.
- **Debug "Sure Win" Mechanism:** Integrated a forced-state override in the controller (snapToGrid) to streamline testing and validation of payline outcomes and payout calculations.

### Assumptions Made During Development
- **Economy & Betting:** Assumed a different Symbol and its own multiplier value 
- **Grid Layout & Evaluation:** Assumed that the vertical patterm is not included as win since it is not on the requirements
- **Wild & Scatter Behavior:** Assumed standard slot rules—wilds substitute for any standard payline symbol, and scatters evaluate independently across the board for bonus payouts based on quantity and alignment (straight-line vs. unaligned).
- **Speed 3:** Since the speed description is "Instant" I made it auto stop after of roll animation made in tween, so it can show result instantly 

### Optional Features & Improvements Implemented
- **Auto-Spin Toggle:** Allows players to toggle continuous automated spinning, with automatic interruption when a win is hit.
- **Wild Symbols:** Fully integrated wildcard substitution logic into payline evaluation to help complete winning combinations.
- **Scatter Symbols:** Implemented independent scatter tracking across the board with custom bonus payouts based on quantity and straight-line vs. unaligned configurations.
- **Dynamic Win Presentation & Backgrounds:** Different background panels and visual states dynamically load depending on the win type (Normal Win, Wild Win, or Scatter Win).
- **Debug "Sure Win" Mechanism:** Added a forced-state override tool (snapToGrid method) for rapid testing and QA, which can also double as a tutorial win feature.
- **Free Spins System:** Triggered specialized free spin rewards after hitting milestones like 3 paid spins.



