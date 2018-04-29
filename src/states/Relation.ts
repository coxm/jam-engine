/** Enumerated relationships between states. */
export const enum Relation {
	/** The next state is a sibling. */
	sibling,
	/** The next state is the next sibling, or the parent if none left. */
	siblingElseUp,
	/** The next state is a child. */
	child,
	/** Try the first child, if any; otherwise, the next parent. */
	childElseSibling,
	/** Try the first child, then the next sibling, then the parent. */
	childElseSiblingElseUp,
	/** The next state is the current state's parent. */
	parent,
	/** The next state is the current one. */
	same,
}
