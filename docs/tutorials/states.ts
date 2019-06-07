/**
 * @file docs/examples/states.ts
 *
 * Here is a simplified example configuration of a state manager. We'll
 * organise the game's flow into several states, with a main menu "root" state,
 * several (linearly ordered) levels, and a "game complete" splash screen.
 *
 * Our state tree looks like this:
 *
 *     MainMenu (root state)
 *       |-- Level_0
 *       |-- Level_1
 *       |-- GameComplete
 *
 * On game start, the main menu will be shown. We also want to define the
 * following transitions between states.
 *
 * 1.  When the player causes the 'playGame' trigger to be fired (perhaps by
 *     clicking a button in the main menu), the 'Level_0' state starts.
 * 2.  If the player fails a level, that level restarts.
 * 3.  If the player completes a level, they progress to the next state.
 * 4.  On completing the final level, we show the 'GameComplete' splash screen.
 * 5.  While playing a level, the player can quit the game and return to the
 *     main menu.
 */
import {State} from 'jam/states/State';
import {Relation} from 'jam/states/Relation';
import {Manager, TriggerEvent, Transition} from 'jam/states/Manager';


/** A fictitious Level class. */
class Level extends State {
	constructor(readonly id: string) {
		super();
	}
}


/** A fictitious MainMenu class. */
class MainMenu extends State {
}


/**
 * State "trigger" type.
 *
 * These are game flow event types that can cause transitions from one state to
 * another.
 */
export const enum Trigger {
	playGame,
	levelFailed,
	levelComplete,
	returnToMainMenu,
}


/**
 * The state manager.
 *
 * Can be used to trigger state transitions, and stores the state tree which we
 * define below.
 */
export const manager = new Manager<State, Trigger>({
	// This function gets called before `manager` acts on any trigger.
	preTrigger: (event: TriggerEvent<State, Trigger>): void => {
		console.log('Closing state', event.old.id);
	},
	// This function gets called after `manager` acts on any trigger.
	postTrigger: (event: TriggerEvent<State, Trigger>): void => {
		console.log('Started state', event.new.id);
	},
});


const startFirstLevelOnPlayGame: Transition<State, Trigger> = {
	trigger: Trigger.playGame,
	change(ev: TriggerEvent<State, Trigger>): void {
		ev.old.state.detach(null);  // Keep main menu alive in the background.
		ev.new.state.start();
	},
	rel: Relation.child,  // Start this (main menu) state's first child.
};

const restartOnLevelFailure: Transition<State, Trigger> = {
	trigger: Trigger.levelFailed,
	change(ev: TriggerEvent<State, Trigger>): void {
		console.assert(ev.new.state === ev.old.state);
		ev.old.state.restart();  // Reset the current state on failure.
	},
	rel: Relation.same,  // Specify the same state with a `Relation`.
};

const advanceOnLevelSuccess: Transition<State, Trigger> = {
	trigger: Trigger.levelComplete,
	change(ev: TriggerEvent<State, Trigger>): void {
		ev.old.state.destroy();  // Destroy the level as we no longer need it.
		ev.new.state.start();
	},
	rel: Relation.sibling,  // Move to the next sibling state.
};

const returnToMainMenu: Transition<State, Trigger> = {
	trigger: Trigger.returnToMainMenu,
	change(ev: TriggerEvent<State, Trigger>): void {
		ev.old.state.pause();  // Pause the level while we're in the menu.
	},
	id: 'MainMenu',  // Specify the main menu state.
};


/**
 * The main menu ID.
 *
 * The main menu acts as the head of our state tree:
 *
 *     MainMenu (root state)
 *       |-- Level_0
 *       |-- Level_1
 *       |-- GameComplete
 *
 * Notice the state transitions also included in the definition.
 */
const mainMenuID = manager.add(new MainMenu(), {
	alias: 'MainMenu',
	transitions: [startFirstLevelOnPlayGame],
	children: [
		manager.add(new Level('level-0'), {
			alias: 'Level_0',
			transitions: [
				restartOnLevelFailure,
				advanceOnLevelSuccess,
				returnToMainMenu,
			],
		}),
		manager.add(new Level('level-1'), {
			alias: 'Level_1',
			transitions: [
				restartOnLevelFailure,
				advanceOnLevelSuccess,
				returnToMainMenu,
			],
		}),
	],
});
manager.setInitial(mainMenuID);  // Set the initial state.
manager.current.start(); // Start the main menu state.
