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
import {State, resume, reset} from 'jam/states/State';
import {Relation} from 'jam/states/Relation';
import {Manager, TriggerEvent} from 'jam/states/Manager';

// These are all fictitious states imagined for the purpose of this example. We
// assume they all extend the `State` class.
import {Level} from 'my-game/states/Level';
import {SplashScreen} from 'my-game/states/Level';
import {MainMenu} from 'my-game/states/MainMenu';


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
	// This function gets called before `manager` acts on any trigger. It
	// pauses, detaches and stops the old state.
	preTrigger: (event: TriggerEvent<State, Trigger>): void => {
		reset(event.old)
		console.log('Closing state', event.old.name);
	},
	// This function gets called after `manager` acts on any trigger. It
	// starts up/resumes the new state.
	postTrigger: (event: TriggerEvent<State, Trigger>): void => {
		resume(event.new);
		console.log('Started state', event.new.name);
	},
});


const startFirstLevelOnPlayGame: Transition<Trigger, State> = {
	trigger: Trigger.playGame,
	exit(mainMenu: MainMenu): void {
		mainMenu.detach();  // Keep the main menu alive, but in the background.
	},
	rel: Relation.child,  // Start this (main menu) state's first child.
};

const restartOnLevelFailure: Transition<Trigger, State> = {
	trigger: Trigger.levelFailed,
	exit: reset,  // Reset the current level on failure.
	rel: Relation.same,  // Specify the same state with a `Relation`.
};

const advanceOnLevelSuccess: Transition<Trigger, State> = {
	trigger: Trigger.levelComplete,
	exit(level: Level): void {
		level.destroy();  // Destroy the level as we no longer need it.
	},
	rel: Relation.sibling,  // Move to the next sibling state.
};

const returnToMainMenu: Transition<Trigger, State> = {
	trigger: Trigger.returnToMainMenu,
	exit: reset,
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
				returnToMainMenuOnQuit,
			],
		}),
		manager.add(new Level('level-1'), {
			alias: 'Level_1',
			transitions: [
				restartOnLevelFailure,
				advanceOnLevelSuccess,
				returnToMainMenuOnQuit,
			],
		}),
		manager.add(new SplashScreen('GameComplete.png'))
	],
});
manager.set(mainMenuID);  // Set the initial state.
resume(manager.current);  // Start the main menu state.
