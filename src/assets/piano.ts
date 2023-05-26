import { OctaveNote } from './notes';

export type NoteColor = "red" | "blue" | "green";

export interface PianoRollNote {
  id: number;
  start: number;
  length: number;
  note: OctaveNote;
  velocity: number;
  color: NoteColor;
  dragging: boolean;
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

export interface PianoRollProps {
  zoomX?: number;
  zoomY?: number;
  rangeBottom?: OctaveNote;
  rangeTop?: OctaveNote;
  beat?: number;
  modelValue: PianoRollNote[];
  length?: number | "infinite";
  noteLength?: number;
}
