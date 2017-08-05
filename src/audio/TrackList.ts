export interface TrackListOptions {
	/** The ID of this track list. */
	readonly id?: string;
	/** Whether to loop. */
	readonly loop?: boolean;
	/** The key under which the next track will be stored. */
	readonly nextKey?: string;
}


function onTrackEnded(ev: Event): void {
	const parent = (ev.target as HTMLElement).parentElement!;
	const index = +(ev.target as HTMLAudioElement).dataset.next!;
	const next = parent.children[index] as HTMLAudioElement;
	if (next) {
		next.play();
		parent.dataset.current = index as any as string;
	}
}


let idCounter: number = 0;
let trackIdCounter: number = 0;


const idOf = (elem: HTMLAudioElement): string => {
	return elem.id || (elem.id = `track-${++trackIdCounter}`);
};


export class TrackList {
	readonly id: string;
	readonly nextKey: string;
	readonly tracks: HTMLAudioElement[];
	readonly container: HTMLElement;
	readonly loop: boolean;
	private currentID: string;

	constructor(
		tracks: ArrayLike<HTMLAudioElement>,
		options: TrackListOptions = {}
	) {
		this.id = options.id || `track-list-${++idCounter}`;
		this.nextKey = options.nextKey || `${this.id}-next`;
		this.loop = options.loop || false;
		this.reload(tracks);
	}

	get current(): HTMLAudioElement {
		const elem = document.getElementById(this.currentID);
		if (!elem) {
			throw new Error(`No '${this.currentID}' element`);
		}
		return elem as HTMLAudioElement;
	}

	play(): void {
		this.current.play();
	}

	pause(): void {
		this.current.pause();
	}

	reset(): void {
		const elem = this.current;
		elem.pause();
		elem.currentTime = 0;
	}

	reload(tracks: ArrayLike<HTMLAudioElement>): void {
		this.clear();
		let i = tracks.length - 1;
		if (i < 0) {
			return;
		}

		let nextTrack = tracks[i];
		if (this.loop) {
			nextTrack.dataset[this.nextKey] = idOf(tracks[0]);
		}
		nextTrack.onended = onTrackEnded;
		for (--i; 0 <= i; --i) {
			const track = tracks[i];
			track.dataset[this.nextKey] = idOf(nextTrack);
			track.onended = onTrackEnded;
			nextTrack = track;
		}
		this.currentID = tracks[0].id;
	}

	clear(): void {
		for (const track of this.tracks) {
			delete track.dataset[this.nextKey];
		}
	}
}
