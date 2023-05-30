<template>
  <div class="shrink-wrap" :class="{ fullscreen }">
    <FullScreen @click="fullscreen = !fullscreen" :open="fullscreen" />
    <div class="piano-roll-container w-full rounded">
      <div ref="pianoRoll" class="piano-roll">
        <div
          @mousedown.prevent="addNote"
          @mouseup.prevent="dragEnd"
          :class="`tone ${/#/.test(tone) ? 'sharp' : ''}`"
          v-for="tone in scale"
          :key="tone"
        >
          <div class="label">{{ tone }}</div>
          <div
            :class="`beat ${beatClass(index)}`"
            v-for="index in unitsToBeats(length)"
            :key="`${tone}:${index}`"
          ></div>
        </div>

        <div class="note-grid">
          <div
            :class="`note ${note.id === draggingNote?.note?.id ? 'dragging' : ''}`"
            v-for="note in notes"
            :style="{
              gridColumn: `${beatsToUnits(note.start) + 2} / span ${beatsToUnits(note.length)}`,
              gridRow: `${scaleLookup[note.note] + 1} / span 1`,
              height: zoomY * 2 + 'rem',
            }"
            :key="note.id"
            @click.right.prevent="deleteNote(note)"
          >
            <div class="note-inner" :style="noteCSS(note)">
              <span
                @mousedown.prevent="(e) => dragStart(note, { e, dragType: 'left' })"
                @mouseup.prevent="dragEnd"
                class="edge right"
              ></span>
              <span
                @mousedown.prevent="(e) => dragStart(note, { e, dragType: 'drag' })"
                @mouseup.prevent="dragEnd"
                class="middle"
              ></span>
              <span
                @mousedown.prevent="(e) => dragStart(note, { e, dragType: 'right' })"
                @mouseup.prevent="dragEnd"
                class="edge left"
              ></span>
            </div>
          </div>
        </div>
        <div :class="`playhead ${playheadHidden ? 'hidden' : ''}`"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { WritableComputedRef, computed, onMounted, onUnmounted, ref, watch } from "vue";
import { OctaveNote, notesBetweenC1AndG9 } from "../assets/notes";
import {
  PianoRollNote,
  DragDetails,
  DragType,
  PianoRollProps,
  PianoRollSimpleNote,
} from "../assets/piano";
import { darken, lighten } from "color2k";
import FullScreen from "./FullScreen.vue";

const emit = defineEmits(["update:modelValue"]);

const mousePosition = ref({ x: 0, y: 0 });
const pianoRoll = ref<HTMLDivElement | null>(null);
const draggingNote = ref<DragDetails | null>(null);

const rem = ref(16);
const fullscreen = ref(false);
const rollWidth = ref(0);

const startedNotes = ref([] as OctaveNote[]);

const props = withDefaults(defineProps<PianoRollProps>(), {
  zoomX: 0.5,
  zoomY: 1,
  beat: 0,
  rangeBottom: "C1",
  rangeTop: "G5",
  length: 80,
  noteLength: 2,
  noteColor: "#f43f5f",
  loop: true,
  onNoteEvent: () => {},
});

const zoom = computed(() => {
  if (props.length === "infinite") return { x: props.zoomX, y: props.zoomY };
  const minZoomX = (rollWidth.value - rem.value * 4) / (rem.value * props.length);
  const x = Math.max(minZoomX, props.zoomX);

  return { x, y: props.zoomY };
});

const simpleNotes = computed(() => {
  return notes.value.map(
    (note) =>
      ({
        id: note.id,
        note: note.note,
      } as PianoRollSimpleNote)
  );
});

const actualBeat = computed(() => {
  if (props.length === "infinite" || !props.loop) return props.beat;
  return props.beat % length.value;
});

const notes: WritableComputedRef<PianoRollNote[]> = computed({
  get: () => props.modelValue || [],
  set: (value) => emit("update:modelValue", value),
});

const length = computed(() => {
  if (props.length !== "infinite") return props.length * props.noteLength;
  const defaultLength = Math.ceil(
    (pianoRoll.value?.getBoundingClientRect().width || 0) / (rem.value * zoom.value.x)
  );
  if (notes.value.length === 0) return defaultLength;
  const lastNote = notes.value.sort((a, b) => b.start + b.length - (a.start + a.length))[0];
  return Math.max(lastNote.start + lastNote.length + 20, defaultLength);
});

const scale = computed(() => {
  const topIndex = notesBetweenC1AndG9.findIndex((note) => note === props.rangeTop);
  const bottomIndex = notesBetweenC1AndG9.findIndex((note) => note === props.rangeBottom);
  return notesBetweenC1AndG9
    .slice(bottomIndex, topIndex + 1)
    .filter((note) => !/[A-G]b-?[0-9]/.test(note))
    .reverse();
});

const scaleLookup = computed(() => {
  const lookup: Record<string, number> = {};
  scale.value.forEach((note, index) => {
    lookup[note] = index;
  });
  return lookup;
});

const notesStartingAt = (beat: number) => {
  return notes.value.filter((note) => note.start === unitsToBeats(beat)).map((note) => note.note);
};

const notesEndingAt = (beat: number) => {
  return notes.value
    .filter((note) => {
      if (beat === 0) beat = length.value;
      return note.start + note.length === unitsToBeats(beat);
    })
    .map((note) => note.note);
};

watch(actualBeat, (beat) => {
  props.onNoteEvent({
    notesStarting: notesStartingAt(beat),
    notesEnding: notesEndingAt(beat),
  });
});

watch(simpleNotes, (notes, oldNotes) => {
  const difference = notes.filter((note) => {
    const oldNote = oldNotes.find((n) => n.id === note.id);
    return !oldNote || oldNote.note !== note.note;
  });

  if (difference.some((note) => draggingNote.value?.note.id === note.id)) {
    const note = (draggingNote.value as DragDetails).note;
    endStartedNotes();
    startAndEndNotes([note.note], (note.length * 1000 * 60) / 120);
  }
});

const beatClass = (index: number) => {
  const unit = ((index - 1) % props.noteLength) + 1;
  return `beat b${unit} beat-end`;
};

// ====================
// Calculate Note Position
// ====================

const getNote = (y: number) => {
  const index = Math.floor(y / (rem.value * 2 * zoom.value.y));
  return scale.value[index];
};

const getLeft = (start: number, units: boolean = false) => {
  const labelWidth = rem.value * 4;
  const unitWidth = rem.value * zoom.value.x;
  const startInUnits = units ? unitsToBeats(start) : start;
  return labelWidth + startInUnits * unitWidth;
};

const getStart = (x: number) => {
  const labelWidth = rem.value * 4;
  const unitWidth = rem.value * zoom.value.x;
  return Math.floor((x - labelWidth) / unitWidth);
};

function convertRemToPixels(rem: number) {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

// ====================
// Dragging Logic
// ====================

const dragStart = (
  note: PianoRollNote,
  { e, dragType }: { e: MouseEvent; dragType: DragType },
  isNew: boolean = false
) => {
  // Ignore right click
  if (e.button !== 0) return;

  note.selected = true;
  draggingNote.value = {
    note,
    offset: e.offsetX,
    dragType,
    placement: {
      start: note.start,
      length: note.length,
      end: note.start + note.length,
    },
  };

  startAndEndNotes([note.note], (note.length * 1000 * 60) / 120);

  setTimeout(() => {
    if (!note.selected && !isNew) {
      if (!e.shiftKey) notes.value.forEach((note) => (note.selected = false));
      note.selected = true;
    }
  }, 100);
};

const dragEnd = () => {
  if (!draggingNote.value) return;
  const note = draggingNote.value.note;
  note.selected = false;
  draggingNote.value = null;
};

const beatsToUnits = (beats: number) => {
  return beats * props.noteLength;
};

const unitsToBeats = (length: number) => {
  return length / props.noteLength;
};

const setSelectedNotePosition = () => {
  if (!draggingNote.value) return;
  const { x, y } = mousePosition.value;
  const note = draggingNote.value.note;
  const type = draggingNote.value.dragType;
  const xStart = getStart(x) - unitsToBeats(1);
  const newStart = getStart(x - draggingNote.value.offset);
  const newNote = getNote(y);
  if (type === "drag") {
    const lessThanZero = newStart < 0;
    const greaterThanLength = beatsToUnits(newStart + note.length) > length.value;
    note.start = lessThanZero
      ? 0
      : greaterThanLength
      ? unitsToBeats(length.value - note.length - 1)
      : newStart;
    note.note = newNote;
    return;
  }

  if (type === "left") {
    note.start =
      newStart < draggingNote.value.placement.end ? newStart : draggingNote.value.placement.end - 1;
    note.length = draggingNote.value.placement.end - newStart || 1;
    return;
  }

  if (type === "right" || type === "drag-right") {
    const newLength = xStart - note.start + 1;
    note.length = newLength <= 0 ? 1 / props.noteLength : newLength;
  }

  if (type === "drag-right") {
    // note.note = newNote;
    if (note.length === 1) {
      note.start = newStart < 0 ? 0 : newStart;
    }
  }
};

// =================================== //
// ============ Mouse Tracking ============= //
// =================================== //

const mouseMove = (e: MouseEvent) => {
  if (!pianoRoll.value) return;
  const rect = pianoRoll.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  mousePosition.value = { x, y };
  setSelectedNotePosition();
};

const getLastId = () => {
  if (notes.value.length === 0) return 0;
  return notes.value.sort((a, b) => b.id - a.id)[0].id;
};

const startAndEndNotes = (notes: OctaveNote[], timeout: number) => {
  props.onNoteEvent({
    notesStarting: notes,
    notesEnding: [],
  });

  startedNotes.value.push(...notes);

  setTimeout(() => {
    props.onNoteEvent({
      notesStarting: [],
      notesEnding: notes,
    });

    startedNotes.value = startedNotes.value.filter((note) => !notes.includes(note));
  }, timeout);
};

const endStartedNotes = () => {
  props.onNoteEvent({
    notesStarting: [],
    notesEnding: startedNotes.value,
  });
  startedNotes.value = [];
};

// Add note where mouse is
const addNote = (e: MouseEvent) => {
  console.log("add note");
  if (e.button !== 0) return;
  if (!pianoRoll.value) return;
  const x = mousePosition.value.x;
  const y = mousePosition.value.y;
  const start = getStart(x);
  if (start < 0) return;
  const note = getNote(y);
  const newNote = {
    id: getLastId() + 1,
    start,
    length: 1,
    note,
    velocity: 100,
    color: props.noteColor,
    selected: false,
  } as PianoRollNote;
  notes.value.push(newNote);

  dragStart(newNote, { e, dragType: "right" });
};

const deleteNote = (note: PianoRollNote) => {
  notes.value = notes.value.filter((n) => n.id !== note.id);
};

function outputsize() {
  rollWidth.value = pianoRoll.value?.offsetWidth || 0;
}

onMounted(() => {
  // window.addEventListener("mousemove", mouseMove);
  rem.value = convertRemToPixels(1);
  if (!pianoRoll.value) return;
  pianoRoll.value.addEventListener("mousemove", mouseMove);

  new ResizeObserver(outputsize).observe(pianoRoll.value);
});

onUnmounted(() => {
  // window.removeEventListener("mousemove", mouseMove);
  if (!pianoRoll.value) return;
  pianoRoll.value.removeEventListener("mousemove", mouseMove);
});

const toneGridTemplate = computed(() => {
  return `4rem repeat(${unitsToBeats(length.value)}, calc(1rem * ${zoom.value.x}))`;
});

const noteGridTemplate = computed(() => {
  return `4rem repeat(${length.value}, calc(1rem * ${unitsToBeats(zoom.value.x)}))`;
});

const noteGridTemplateRows = computed(() => {
  return `repeat(${length.value}, ${2 * zoom.value.y}rem)`;
});

const toneGridHeight = computed(() => {
  return `${2 * zoom.value.y}rem`;
});

const labelFontSize = computed(() => {
  return zoom.value.y < 1 ? `${zoom.value.y}rem` : "1rem";
});

const playheadLeft = computed(() => {
  return `${getLeft(actualBeat.value, true)}px`;
});

const playheadHeight = computed(() => {
  return `${2 * zoom.value.y * scale.value.length}rem`;
});

const playheadWidth = computed(() => {
  return `${unitsToBeats(zoom.value.x)}rem`;
});

const playheadHidden = computed(() => {
  return props.beat < 0;
});

const noteColor = (note: PianoRollNote) => {
  if (note.selected) return lighten(note.color, 0.1);
  return note.color;
};

const noteColorShadow = (note: PianoRollNote) => {
  if (note.selected) return note.color;
  return darken(note.color, 0.1);
};

const noteColorHighlight = (note: PianoRollNote) => {
  if (note.selected) return lighten(note.color, 0.2);
  return lighten(note.color, 0.1);
};

const noteCSS = (note: PianoRollNote) => {
  const noteShadow = noteColorShadow(note);
  const noteHighlight = noteColorHighlight(note);

  return {
    backgroundColor: noteColor(note),
    borderTopColor: noteHighlight,
    borderLeftColor: noteHighlight,
    borderRightColor: noteShadow,
    borderBottomColor: noteShadow,
  };
};
</script>

<style lang="scss" scoped>
* {
  box-sizing: border-box;
  -moz-box-sizing: border-box;
  -webkit-box-sizing: border-box;
}

.shrink-wrap {
  position: relative;
  width: 100%;
  max-height: inherit;

  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    max-height: 100%;
    z-index: 5;
    background-color: rgb(76, 85, 99);
  }
}
.piano-roll-container {
  position: relative;
  overflow: scroll;
  background-color: rgb(55, 65, 81);
  max-height: inherit;
  .piano-roll {
    position: relative;
    --tw-bg-opacity: 1;
    background-color: rgb(75 85 99 / 1);
    background-color: rgb(75 85 99 / var(--tw-bg-opacity));
    font-weight: 700;
    --tw-text-opacity: 1;
    color: rgb(255 255 255 / 1);
    color: rgb(255 255 255 / var(--tw-text-opacity));

    .tone {
      display: grid;
      align-items: center;
      height: v-bind(toneGridHeight);
      grid-template-columns: v-bind(toneGridTemplate);

      & > div {
        border-style: solid;
        border-width: 0;
        border-bottom-width: 1px;
        border-right-width: 1px;
        --tw-border-opacity: 1;
        border-color: rgb(107 114 128 / 1);
        border-color: rgb(107 114 128 / var(--tw-border-opacity));
      }
      .label {
        display: inline-block;
        width: 4rem;
        --tw-border-opacity: 1;
        border-color: rgb(75 85 99 / 1);
        border-color: rgb(75 85 99 / var(--tw-border-opacity));
        --tw-bg-opacity: 1;
        background-color: rgb(107 114 128 / 1);
        background-color: rgb(107 114 128 / var(--tw-bg-opacity));
        padding: 0.25rem;
        text-align: right;
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: var(--61d86246-toneGridHeight);
        font-size: var(--61d86246-labelFontSize);
        height: v-bind(toneGridHeight);
        font-size: v-bind(labelFontSize);
      }

      .beat {
        height: 100%;
        width: 100%;
        --tw-bg-opacity: 1;
        background-color: rgb(75 85 99 / 1);
        background-color: rgb(75 85 99 / var(--tw-bg-opacity));
        border-right-width: 0;

        &.beat-end {
          border-right-width: 1px;
        }
      }

      &.sharp .beat {
        --tw-bg-opacity: 1;
        background-color: rgb(55 65 81 / 1);
        background-color: rgb(55 65 81 / var(--tw-bg-opacity));
      }
    }

    .note-grid {
      display: grid;
      width: 100%;
      height: v-bind(toneGridHeight);
      grid-template-columns: v-bind(noteGridTemplate);
      grid-template-rows: v-bind(noteGridTemplateRows);
      position: absolute;
      top: 0;
      pointer-events: none;
      .note {
        position: relative;
        z-index: 20;
        pointer-events: initial;
        .note-inner {
          position: absolute;
          border-style: solid;
          border-width: 2px;
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: 0.5rem 1fr 0.5rem;

          .middle {
            cursor: grab;
          }
          .edge {
            cursor: col-resize;
          }
        }

        &.dragging .note-inner .middle {
          cursor: grabbing;
        }
      }
    }
    .playhead {
      position: absolute;
      --tw-bg-opacity: 1;
      background-color: rgb(156 163 175 / 1);
      background-color: rgb(156 163 175 / var(--tw-bg-opacity));
      z-index: 10;
      top: 0;
      opacity: 0.5;
      pointer-events: none;

      left: v-bind(playheadLeft);
      height: v-bind(playheadHeight);
      width: v-bind(playheadWidth);

      &.hidden {
        display: none;
      }
    }
  }
}
</style>
