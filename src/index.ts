import {
	type Note,
	notesBetweenC1AndG9,
	type OctaveNote,
} from "./assets/notes";
import type {
	NoteEvent,
	PianoRollNote,
	PianoRollProps,
	PianoRollSimpleNote,
	ShadowMap,
} from "./assets/piano";
import PianoRoll from "./components/PianoRoll.vue";

export { PianoRoll, notesBetweenC1AndG9 };
export type {
	PianoRollNote,
	OctaveNote,
	PianoRollProps,
	PianoRollSimpleNote,
	NoteEvent,
	ShadowMap,
	Note,
};
