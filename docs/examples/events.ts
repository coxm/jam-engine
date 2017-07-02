/**
 * @file docs/examples/events.ts
 *
 * Here we demonstrate some potential uses of an event manager.
 */
import {Manager, Event} from 'jam/events/Manager';


/**
 * The different types of event which can be used.
 *
 * Alternatively enums, symbols, numbers or arbitrary strings can be used.
 */
export type Category = (
	'SomeEvent' |
	'AntherEvent'
);


/** The event manager. */
export const manager = new Manager<Category, any>();


/** A simple event handler. */
function handler(this: {whatami: string;}, event: Event<Category, any>): void {
	let message: string = event.type + ' happened';
	if (this && this.whatami) {
		message += ' and was observed by ' + this.whatami;
	}
	message += '!';
	console.log(message);
}


/** A context for some handlers. */
const context = {
	whatami: 'The context'
};


// # Setting handlers.
// We can set event handlers using `Manager#on` and `Manager#once`:
manager
	// `handler` will be called on every 'SomeEvent' until removed.
	.on('SomeEvent', handler)
	// `handler` will be called at most once.
	.once('SomeEvent', handler)
	// `handler` will be called with `context` as its context.
	.on('SomeEvent', handler, context)
	// `handler` will be called at most 5 times.
	.on('SomeEvent', handler, null, 5);


// # Removing handlers.
// Any handlers set in this way can be removed. When a context is provided for
// a handler, it must also be used in the removal call.
manager
	// Cancel `handler` for 'SomeEvent' events.
	.off('SomeEvent', handler)
	// Cancel `handler` calls with `context` as the context.
	.off('SomeEvent', handler, context);  // Necessary to cancel such handlers.


// # Batching handlers.
// Batches can be initialised using the `Manager#batch` method, and removed
// using the `Manager#unbatch` method.
const batchID = manager.batch([  // Initialise a batch.
	['SomeEvent', handler],  // Context `context`.
	[
		'SomeEvent',
		handler,
		{whatami: 'A different context'}  // Different context (optional).
	]
	// ...
], {ctx: context});
// Remove the entire batch, e.g. when ending a level:
manager.unbatch(batchID);


// # Extending handler batches.
// Batches can be created with a specific ID, and extended after creation.
const batchID = Symbol('MyHandlerBatch');
manager.batch(  // Creates the batch with ID `batchID`.
	[
		['SomeEvent', handler]
	],
	{
		ctx: context,
		id: batchID
	}
);
manager.batch(  // Extends the same batch with more event handlers.
	[
		['AnotherEvent', handler]
	],
	{
		id: batchID
	}
);
// Removes both handlers.
manager.unbatch(batchID);
