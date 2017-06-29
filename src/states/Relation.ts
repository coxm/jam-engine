/** Enumerated relationships between states. */
export const enum Relation {
	/** The next state is a sibling. */
	sibling,
	/** The next state is the next sibling, or the parent if none left. */
	siblingElseUp,
	/** The next state is a child. */
	child,
	/** The next state is the current state's parent. */
	parent,
	/** The next state is the current one. */
	same,
}
