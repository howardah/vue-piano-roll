import PianoRoll from "./components/PianoRoll.vue";
import {
  PianoRollNote,
  PianoRollProps,
  PianoRollSimpleNote,
  NoteEvent,
  ShadowMap,
} from "./assets/piano";
import { OctaveNote, Note, notesBetweenC1AndG9 } from "./assets/notes";

export { PianoRoll, notesBetweenC1AndG9 };
export type {
  PianoRollNote,
  OctaveNote,
  PianoRollProps,
  PianoRollSimpleNote,
  NoteEvent,
  ShadowMap,
  Note
};
