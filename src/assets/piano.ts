import { OctaveNote } from './notes';

export interface PianoRollNote {
  id: number;
  start: number;
  length: number;
  note: OctaveNote;
  velocity: number;
  color: string;
  selected: boolean;
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
  beat?: number;
  modelValue: PianoRollNote[];
  length?: number | "infinite";
  noteLength?: number;
  loop?: boolean;
  noteColor?: string;
  notesStarting?: (notes: OctaveNote[]) => void;
  notesEnding?: (notes: OctaveNote[]) => void;
  onNoteEvent?: (event: NoteEvent) => void;
  onLastNoteEnd?: () => void;
  onLastBeatEnd?: () => void;
}
