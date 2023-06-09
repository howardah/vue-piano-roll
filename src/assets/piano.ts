import { Note, OctaveNote } from './notes';

export interface PianoRollNote {
  id: number;
  start: number;
  length: number;
  note: OctaveNote;
  velocity: number;
  color: string;
  selected: boolean;
}

export interface ShadowMap {
  start?: number;
  length?: number;
  note: OctaveNote | Note;
}

export interface PianoRollSimpleNote {
  id: number;
  note: OctaveNote;
}

export type DragType = "left" | "drag" | "right" | "drag-right";

export interface DragPlacement {
  start: number;
  length: number;
  end: number;
}

export interface DragDetails {
  note: PianoRollNote;
  offset: number;
  dragType: DragType;
  placement: DragPlacement;
}

export interface NoteEvent {
  notesStarting: OctaveNote[];
  notesEnding: OctaveNote[];
}

export interface PianoRollProps {
  zoomX?: number;
  zoomY?: number;
  rangeBottom?: OctaveNote;
  rangeTop?: OctaveNote;
  currentBeat?: number;
  currentTick?: number;
  ticksPerBeat?: number;
  defaultNoteLength?: number;
  noteHeight?: number;
  modelValue: PianoRollNote[];
  length?: number | "infinite";
  loop?: boolean;
  noteColor?: string;
  backgroundColor?: string;
  incidentalColor?: string;
  gridColor?: string;
  labelColor?: string;
  labelIncidentalColor?: string;
  labelBackgroundColor?: string;
  labelBorderColor?: string;
  borderWidth?: number;
  shadowColor?: string;
  shadowMap?: ShadowMap[];
  onNoteEvent?: (event: NoteEvent) => void;
}
