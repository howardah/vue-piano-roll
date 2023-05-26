import { MidiRangeNote } from './notes';

export type NoteColor = "red" | "blue" | "green";

export interface Note {
  id: number;
  start: number;
  length: number;
  note: MidiRangeNote;
  velocity: number;
  color: NoteColor;
  dragging: boolean;
}

export interface ExtendedNote extends Note {
    end: number;
}

export type DragType = "left" | "drag" | "right" | "drag-right";

export interface DragPlacement {
  start: number;
  length: number;
  end: number;
}

export interface DragDetails {
  note: Note;
  offset: number;
  dragType: DragType;
  placement: DragPlacement;
}

export interface PianoRollProps {
  zoomX?: number;
  zoomY?: number;
  rangeBottom?: MidiRangeNote;
  rangeTop?: MidiRangeNote;
  beat?: number;
  modelValue: Note[];
  length?: number | "infinite";
  noteLength?: number;
}
