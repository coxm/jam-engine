import {foreverTrue, noop, uniqueKey, forceArray} from 'jam/util/misc';
import * as nary from 'jam/util/naryRelations';

import {OptionsHandlerItem, Event} from './Manager';


/** Definition for a relation argument to be obtained from an event. */
export interface EventArgumentDef {
	readonly key: PropertyKey;
}


/** Definition for a relation argument provided as a value. */
export interface ValueArgumentDef {
	readonly val: any;
}


/** Definition for a custom argument type. */
export interface CustomArgumentDef {
	readonly [uniqueKey: string]: any;
}


/** Definition for an argument to be checked in a relation. */
export type ArgumentDef = (
	EventArgumentDef |
	ValueArgumentDef |
	CustomArgumentDef
);


export type RelationArgs = ArgumentDef | ArgumentDef[];


export interface AllRelationDef { readonly all: RelationArgs; }
export interface SomeRelationDef { readonly some: RelationArgs; }
export interface NoneRelationDef { readonly none: RelationArgs; }
export interface EqRelationDef { readonly eq: RelationArgs; }
export interface LtRelationDef { readonly lt: RelationArgs; }
export interface LteRelationDef { readonly lte: RelationArgs; }
export interface GtRelationDef { readonly gt: RelationArgs; }
export interface GteRelationDef { readonly gte: RelationArgs; }


/** Definition for a relation which can be used to build predicates. */
export type RelationDef = (
	EqRelationDef |
	LtRelationDef |
	LteRelationDef |
	GtRelationDef |
	GteRelationDef
);


export interface AllPredicateDef { readonly allof: PredicateDef[]; }
export interface NonePredicateDef { readonly none: PredicateDef[]; }
export interface SomePredicateDef { readonly some: PredicateDef[]; }


/** Definition for a predicate built from other predicates. */
export type CompositePredicateDef = (
	AllPredicateDef |
	NonePredicateDef |
	SomePredicateDef
);


/** Base interface for a custom predicate type. */
export interface CustomPredicateDef {
	readonly [uniqueKey: string]: any;
}


/** A definition for a function which checks whether to dispatch a trigger. */
export type PredicateDef = (
	RelationDef |
	CompositePredicateDef |
	CustomPredicateDef
);


export type RelationKey = (
	'all' |
	'none' |
	'some' |
	'nall' |
	'eq' |
	'lt' |
	'lte' |
	'gt' |
	'gte'
);


export type CompositePredicateKey = 'allof' | 'noneof' | 'someof';


export type CustomPredicateKey = string;


export type PredicateKey = (
	RelationKey |
	CompositePredicateKey |
	CustomPredicateKey
);


/** A definition for a triggerable action. */
export interface ActionDef {
	readonly do: PropertyKey;
}


/** Properties common to all trigger definitions. */
export interface TriggerDefBase<Category> {
	readonly on: Category;
	readonly limit?: number;
}


/**
 * A definition for if/then/else triggers.
 *
 * Defines a trigger which executes the `then` action when the `if` predicate
 * is satisfied, and the `else` action otherwise.
 */
export interface LinearTriggerDef<Category> extends TriggerDefBase<Category> {
	readonly if?: PredicateDef | RelationDef;
	readonly then?: ActionDef;
	readonly else?: ActionDef;
}


/** Definition for an individual switch statement case. */
export interface SwitchCaseDef {
	/** The value being compared in this case. */
	readonly if: any;
	/** The action to undertake if this case is selected. */
	readonly then: ActionDef;
}


/**
 * A definition for switch triggers.
 *
 * The resulting trigger will search through the list of cases for a value. If
 * the value is found, the corresponding action is executed. Otherwise, if the
 * else action is present, that action is used.
 */
export interface SwitchTriggerDef<Category> extends TriggerDefBase<Category> {
	readonly key: PropertyKey;
	readonly switch: SwitchCaseDef[];
	readonly else?: ActionDef;
}


/** Definition for any kind of trigger. */
export type TriggerDef<Category> = (
	LinearTriggerDef<Category> |
	SwitchTriggerDef<Category>
);


export type Action<EventOb> = (ev: EventOb) => void;


export type ArgumentGetter<EventOb> = (ev: EventOb) => any;


export type Predicate<EventOb> = (ev: EventOb) => boolean;


export type ActionGetter = () => PropertyKey;


export type PredicateFactory<EventOb> = (def: any) => Predicate<EventOb>;


export type ActionFactory<EventOb> = (def: ActionDef) => Action<EventOb>;


export type ArgumentFactory<EventOb> = (def: any) => ArgumentGetter<EventOb>;


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


const someof = (args: Iterable<boolean>): boolean => {
	for (let arg of args) {
		if (arg) {
			return true;
		}
	}
	return false;
};


const allof = (args: Iterable<boolean>): boolean => {
	for (let arg of args) {
		if (!arg) {
			return false;
		}
	}
	return true;
};


export const composites = {
	allof,
	someof,
	noneof: (args: Iterable<boolean>): boolean => !someof(args),
	nallof: (args: Iterable<boolean>): boolean => !allof(args),
};


const relations: {readonly [key: string]: nary.NAryRelation;} = Object.assign(
	{},
	nary.relations,
	{
		all: composites.allof,
		none: composites.noneof,
		some: composites.someof,
		nall: composites.nallof,
	}
);


export class Factory<Category, EventData extends {
	readonly [key: number]: any;
	readonly [key: string]: any;
}> {
	private argumentFactories =
		new Map<PropertyKey, ArgumentFactory<Event<Category, EventData>>>();

	private conditionFactories =
		new Map<PropertyKey, PredicateFactory<Event<Category, EventData>>>();

	private actionFactories =
		new Map<PropertyKey, ActionFactory<Event<Category, EventData>>>();

	addActionFactory(
		type: PropertyKey,
		factory: ActionFactory<Event<Category, EventData>>
	)
		:	void
	{
		this.actionFactories.set(type, factory)
	}

	addCustomPredicateFactory(
		type: string,
		factory: PredicateFactory<Event<Category, EventData>>
	)
		:	void
	{
		this.conditionFactories.set(type, factory);
	}

	addCustomArgumentFactory(
		type: string,
		factory: ArgumentFactory<Event<Category, EventData>>
	)
		:	void
	{
		this.argumentFactories.set(type, factory);
	}

	/**
	 * Compile a predicate.
	 *
	 * @param def a predicate definition.
	 * @returns a compiled predicate function.
	 *
	 * @example
	 *   const predicate = factory.compile({
	 *       all: [
	 *           {key: 'eventProperty1'},
	 *           {key: 'eventProperty2'}
	 *       ]
	 *   });
	 *   const event = {
	 *       category: 'category',
	 *       meta: null,
	 *       data: {
	 *           eventProperty1: true,
	 *           eventProperty2: false,
	 *       },
	 *   };
	 *   expect(predicate(event)).toBe(false);
	 *   event.data.eventProperty2 = true;
	 *   expect(predicate(event)).toBe(true);
	 */
	compile(def: PredicateDef): Predicate<Event<Category, EventData>> {
		const key = uniqueKey(def) as PredicateKey;

		if (relations[key as RelationKey]) {
			return evalPredicate.bind({
				rel: relations[key as RelationKey],
				args: forceArray((def as any)[key]).map(
					arg => this.argument(arg)),
			});
		}

		if (composites[key as CompositePredicateKey]) {
			return evalPredicate.bind({
				rel: composites[key as CompositePredicateKey],
				args: forceArray((def as any)[key]).map(
					arg => this.compile(arg)),
			});
		}

		const factory = this.conditionFactories.get(key);
		if (!factory) {
			throw new Error("Invalid predicate");
		}
		return factory(def);
	}

	argument(def: ArgumentDef): ArgumentGetter<Event<Category, EventData>> {
		if ((def as EventArgumentDef).key) {
			return getEventProperty.bind(null, (def as EventArgumentDef).key);
		}
		if (def.hasOwnProperty('val')) {
			const val = (def as ValueArgumentDef).val;
			return () => val;
		}

		const factory = this.argumentFactories.get(uniqueKey(def));
		if (!factory) {
			throw new Error("Invalid argument");
		}
		return factory(def);
	}

	action(def: ActionDef): Action<Event<Category, EventData>> {
		const factory = this.actionFactories.get(def.do);
		if (!factory) {
			throw new Error(`No '${def.do}' factory`);
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
				context: this.makeHandlerContext(def),
			}
		];
	}

	batch(defs: TriggerDef<Category>[])
		:	OptionsHandlerItem<Category, EventData>[]
	{
		return defs.map(def => this.handler(def));
	}

	makeHandlerContext(def: TriggerDef<Category>)
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
			pred: def.if ? this.compile(def.if) : foreverTrue,
			yes: def.then ? this.action(def.then) : noop,
			no: def.else ? this.action(def.else) : noop,
		};
	}

	protected makeSwitchContext(def: SwitchTriggerDef<Category>)
		:	SwitchContext<Category, EventData>
	{
		const key = def.key;
		return {
			trigger: switchTrigger,
			cases: def.switch.map(
				(c: SwitchCaseDef): SwitchCase<Category, EventData> => [
					checkValue.bind(null, key, c.if),
					this.action(c.then)
				]
			),
			else: def.else ? this.action(def.else) : noop,
		};
	}
}


function handleEvent<Category, EventData>(
	this: Context<Category, EventData>,
	ev: Event<Category, EventData>
)
	:	void
{
	this.trigger(ev);
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


function checkValue<Category, EventData extends {
	readonly [key: number]: any;
	readonly [key: string]: any;
}> (
	key: PropertyKey,
	expected: any,
	ev: Event<Category, EventData>
)
	:	boolean
{
	if (!ev.data.hasOwnProperty(key)) {
		throw new Error('No such key');
	}
	return ev.data[key] === expected;
}


function getEventProperty<Category, EventData extends {
	readonly [key: number]: any;
	readonly [key: string]: any;
}>(
	key: PropertyKey,
	ev: Event<Category, EventData>
)
	:	any
{
	if (!ev.data.hasOwnProperty(key)) {
		throw new Error("No such key");
	}
	return ev.data[key];
}


function* argumentIterator<EventOb>(
	ev: EventOb,
	args: Iterable<ArgumentGetter<EventOb>>
)
	:	Iterable<boolean>
{
	for (let arg of args) {
		yield arg(ev);
	}
}


function evalPredicate<EventOb>(
	this: {rel: nary.NAryRelation; args: ArgumentGetter<EventOb>[];},
	ev: EventOb
)
	:	boolean
{
	return this.rel(argumentIterator(ev, this.args));
}
