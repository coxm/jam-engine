/** Enumerated relationships between states. */
export const enum Relation {
	/** The next state is a sibling. */
	sibling,
	/** The next state is a child. */
	child,
	/** The next state is the current state's parent. */
	parent,
}
