import {foreverTrue, noop} from 'jam/util/misc';

import {OptionsHandlerItem, Event} from './Manager';


/** A definition for a predicate which checks whether to dispatch a trigger. */
export interface PredicateDef {
	readonly type: PropertyKey;
}


/** A definition for a triggerable action. */
export interface ActionDef {
	readonly type: PropertyKey;
}


export interface TriggerDefBase<Category> {
	readonly on: Category;
	readonly limit?: number;
}


/**
 * A definition for if/then/else triggers.
 *
 * Defines a trigger which executes the `then` action when the `when` predicate
 * is satisfied, and the `else` action otherwise.
 */
export interface LinearTriggerDef<Category> extends TriggerDefBase<Category> {
	readonly when?: PredicateDef;
	readonly then?: ActionDef;
	readonly else?: ActionDef;
}


export type SwitchCaseDef = [
	PropertyKey,  // The key used for accessing a value from the event data.
	any,  // The value to compare against.
	ActionDef  // The action to take if this case is chosen.
];


/**
 * A definition for switch triggers.
 *
 * The resulting trigger will search through the list of cases for a value. If
 * the value is found, the corresponding action is executed. Otherwise, if the
 * else action is present, that action is used.
 */
export interface SwitchTriggerDef<Category> extends TriggerDefBase<Category> {
	readonly switch: SwitchCaseDef[];
	readonly else?: ActionDef;
}


export type TriggerDef<Category> = (
	LinearTriggerDef<Category> |
	SwitchTriggerDef<Category>
);


export interface Action<EventOb> {
	(event: EventOb): void;
}


export interface Predicate<EventOb> {
	(event: EventOb): boolean;
}


export type PredicateFactory<Event> = (def: PredicateDef) => Predicate<Event>;


export type ActionFactory<Event> = (def: ActionDef) => Action<Event>;


export interface Context<Category, EventData> {
	trigger(ev: Event<Category, EventData>): void;
}


export interface LinearContext<Category, EventData>
	extends Context<Category, EventData>
{
	readonly pred: Predicate<Event<Category, EventData>>;
	readonly yes: Action<Event<Category, EventData>>;
	readonly no: Action<Event<Category, EventData>>;
}


export type SwitchCase<Category, EventData> = [
	Predicate<Event<Category, EventData>>,
	Action<Event<Category, EventData>>
];


export interface SwitchContext<Category, EventData>
	extends Context<Category, EventData>
{
	readonly cases: SwitchCase<Category, EventData>[];
	readonly else: Action<Event<Category, EventData>>;
}


export class Factory<Category, EventData> {
	private actionFactories =
		new Map<PropertyKey, ActionFactory<Event<Category, EventData>>>();

	private conditionFactories =	
		new Map<PropertyKey, PredicateFactory<Event<Category, EventData>>>();

	addActionFactory(
		type: PropertyKey,
		factory: ActionFactory<Event<Category, EventData>>
	)
		: void
	{
		this.actionFactories.set(type, factory)
	}

	addPredicateFactory(
		type: PropertyKey,
		factory: PredicateFactory<Event<Category, EventData>>
	)
		: void
	{
		this.conditionFactories.set(type, factory);
	}

	action(def: ActionDef): Action<Event<Category, EventData>> {
		const factory = this.actionFactories.get(def.type);
		if (!factory) {
			throw new Error(`No '${def.type}' factory`);
		}
		return factory(def);
	}

	predicate(def: PredicateDef) {
		const factory = this.conditionFactories.get(def.type);
		if (!factory) {
			throw new Error(`No '${def.type}' factory`);
		}
		return factory(def);
	}

	handler(def: TriggerDef<Category>)
		:	OptionsHandlerItem<Category, EventData>
	{
		return [
			def.on,
			handleEvent,
			{
				limit: def.limit,
				context: this.makeContext(def),
			}
		];
	}

	batch(defs: TriggerDef<Category>[])
		:	OptionsHandlerItem<Category, EventData>[]
	{
		return defs.map(def => this.handler(def));
	}

	makeContext(def: TriggerDef<Category>)
		: Context<Category, EventData>
	{
		return ((<SwitchTriggerDef<Category>> def).switch
			?	this.makeSwitchContext(<SwitchTriggerDef<Category>> def)
			:	this.makeLinearContext(<LinearTriggerDef<Category>> def)
		);
	}

	protected makeLinearContext(def: LinearTriggerDef<Category>)
		:	LinearContext<Category, EventData>
	{
		return {
			trigger: linearTrigger,
			pred: def.when ? this.predicate(def.when) : foreverTrue,
			yes: def.then ? this.action(def.then) : noop,
			no: def.else ? this.action(def.else) : noop,
		};
	}

	protected makeSwitchContext(def: SwitchTriggerDef<Category>)
		:	SwitchContext<Category, EventData>
	{
		return {
			trigger: switchTrigger,
			cases: def.switch.map(
				(c: SwitchCaseDef): SwitchCase<Category, EventData> => [
					checkValue.bind(null, c[0], c[1]),
					this.action(c[2])
				]
			),
			else: def.else ? this.action(def.else) : noop,
		};
	}
}


function handleEvent<Category, EventData>(
	this: Context<Category, EventData>,
	event: Event<Category, EventData>
)
	:	void
{
	this.trigger(event);
}


function linearTrigger<Category, EventData>(
	this: LinearContext<Category, EventData>,
	ev: Event<Category, EventData>
)
	:	void
{
	if (this.pred(ev)) {
		this.yes(ev);
	}
	else {
		this.no(ev);
	}
}


function switchTrigger<Category, EventData>(
	this: SwitchContext<Category, EventData>,
	ev: Event<Category, EventData>
)
	:	void
{
	for (let c of this.cases) {
		if (c[0](ev)) {
			c[1](ev);
			return;
		}
	}
	this.else(ev);
}


function checkValue<Category>(
	key: PropertyKey,
	expected: any,
	event: Event<Category, any>
)
	:	boolean
{
	if (!event.data.hasOwnProperty(key)) {
		throw new Error("No such key");
	}
	return event.data[key] === expected;
}
