/** Enumerated exit strategies for terminating states. */
export const enum ExitType {
	/** Do nothing: leave the state attached and running. */
	none = 0,
	/** Detach the state but leave running. */
	detach = 1,
	/** End the state completely. */
	end = 2
}
