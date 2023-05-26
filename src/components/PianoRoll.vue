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
            :class="`unit ${unitClass(index)}`"
            v-for="index in length"
            :key="`${tone}:${index}`"
          ></div>
        </div>

        <div
          :class="`note ${note.id === draggingNote?.note?.id ? 'dragging' : ''}`"
          v-for="note in notes"
          :style="{
            left: getLeft(note.start) + 'px',
            width: note.length * zoom.x * noteLength + 'rem',
            top: getTop(note.note) + 'px',
            height: zoomY * 2 + 'rem',
          }"
          :key="note.id"
          @click.right.prevent="deleteNote(note)"
          @dblclick="changeColor(note)"
        >
          <div :class="`note-inner ${note.color}`">
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
        <div :class="`playhead ${playheadHidden ? 'hidden' : ''}`"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { WritableComputedRef, computed, onMounted, onUnmounted, ref } from "vue";
import { OctaveNote, notesBetweenC1AndG9 } from "../assets/notes";
import { PianoRollNote, NoteColor, DragDetails, DragType, PianoRollProps } from "../assets/piano";
import FullScreen from "./FullScreen.vue";

const emit = defineEmits(["update:modelValue"]);

const noteColors: NoteColor[] = ["red", "blue", "green"];

const mousePosition = ref({ x: 0, y: 0 });
const pianoRoll = ref<HTMLDivElement | null>(null);
const draggingNote = ref<DragDetails | null>(null);

const rem = ref(16);
const fullscreen = ref(false);
const rollWidth = ref(0);

const props = withDefaults(defineProps<PianoRollProps>(), {
  zoomX: 0.5,
  zoomY: 1,
  beat: 0,
  rangeBottom: "C1",
  rangeTop: "G5",
  length: 80,
  noteLength: 2,
});

const zoom = computed(() => {
  if (props.length === "infinite") return { x: props.zoomX, y: props.zoomY };
  const minZoomX = (rollWidth.value - rem.value * 4) / (rem.value * props.length * props.noteLength);
  const x = Math.max(minZoomX, props.zoomX);

  return { x, y: props.zoomY };
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

const unitClass = (index: number) => {
  const unit = ((index - 1) % props.noteLength) + 1;
  const isBeatEnd = unit === props.noteLength;
  return `unit u${unit} ${isBeatEnd ? "beat-end" : ""}`;
};

const getTop = (note: OctaveNote) => {
  const index = scale.value.findIndex((n) => n === note);
  return index * (rem.value * 2 * zoom.value.y);
};

const getNote = (y: number) => {
  const index = Math.floor(y / (rem.value * 2 * zoom.value.y));
  return scale.value[index];
};

const getLeft = (start: number, units: boolean = false) => {
  const labelWidth = rem.value * 4;
  const unitWidth = rem.value * zoom.value.x;
  const startInUnits = units ? start : start * props.noteLength;
  return labelWidth + startInUnits * unitWidth;
};

const getStart = (x: number) => {
  const labelWidth = rem.value * 4;
  const unitWidth = rem.value * zoom.value.x;
  return Math.floor((x - labelWidth) / unitWidth) / props.noteLength;
};

const changeColor = (note: PianoRollNote) => {
  const colorIndex = noteColors.findIndex((c) => c === note.color);
  note.color = noteColors[colorIndex + 1] || noteColors[0];
};

function convertRemToPixels(rem: number) {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

const dragStart = (
  note: PianoRollNote,
  { e, dragType }: { e: MouseEvent | { offsetX: number }; dragType: DragType }
) => {
  note.dragging = true;
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

  setTimeout(() => {
    // if (!draggingNote.value) changeColor(note);
  }, 100);
};

const dragEnd = () => {
  if (!draggingNote.value) return;
  const note = draggingNote.value.note;
  note.dragging = false;
  draggingNote.value = null;
};

const mouseMove = (e: MouseEvent) => {
  if (!pianoRoll.value) return;
  const rect = pianoRoll.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  mousePosition.value = { x, y };
  if (!draggingNote.value) return;
  const note = draggingNote.value.note;
  const type = draggingNote.value.dragType;
  const xStart = getStart(x);
  const newStart = getStart(x - draggingNote.value.offset);
  const newNote = getNote(y);
  if (type === "drag") {
    const lessThanZero = newStart < 0;
    const greaterThanLength = newStart + note.length > length.value;
    note.start = lessThanZero ? 0 : greaterThanLength ? length.value - note.length - 2 : newStart;
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
    note.length = newLength <= 0 ? (1 / props.noteLength) : newLength;
  }

  if (type === "drag-right") {
    // note.note = newNote;
    if (note.length === 1) {
      note.start = newStart < 0 ? 0 : newStart;
    }
  }
};

// Add note where mouse is
const addNote = () => {
  if (!pianoRoll.value) return;
  // const rect = pianoRoll.value.getBoundingClientRect();
  const x = mousePosition.value.x;
  const y = mousePosition.value.y;
  const start = getStart(x);
  if (start < 0) return;
  const note = getNote(y);
  const newNote = {
    id: notes.value.length,
    start,
    length: 1,
    note,
    velocity: 100,
    color: "red",
    dragging: false,
  } as PianoRollNote;
  notes.value.push(newNote);

  dragStart(newNote, { e: { offsetX: 0 }, dragType: "drag-right" });
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
  return `4rem repeat(${length.value}, calc(1rem * ${zoom.value.x}))`;
});

const toneGridHeight = computed(() => {
  return `${2 * zoom.value.y}rem`;
});

const labelFontSize = computed(() => {
  return zoom.value.y < 1 ? `${zoom.value.y}rem` : "1rem";
});

const playheadLeft = computed(() => {
  return `${getLeft(props.beat, true)}px`;
});

const playheadHeight = computed(() => {
  return `${2 * zoom.value.y * scale.value.length}rem`;
});

const playheadWidth = computed(() => {
  return `${zoom.value.x}rem`;
});

const playheadHidden = computed(() => {
  return props.beat < 0;
});
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
  }
}
.piano-roll-container {
  //   @apply relative overflow-scroll bg-gray-700;
  position: relative;
  overflow: scroll;
  background-color: rgb(55, 65, 81);
  max-height: inherit;
  .piano-roll {
    // @apply min-h-;
    // @apply relative bg-gray-600 text-white font-bold;

    position: relative;
    --tw-bg-opacity: 1;
    background-color: rgb(75 85 99 / 1);
    background-color: rgb(75 85 99 / var(--tw-bg-opacity));
    font-weight: 700;
    --tw-text-opacity: 1;
    color: rgb(255 255 255 / 1);
    color: rgb(255 255 255 / var(--tw-text-opacity));

    .tone {
      //   @apply grid items-center;

      display: grid;
      align-items: center;
      height: v-bind(toneGridHeight);
      grid-template-columns: v-bind(toneGridTemplate);

      & > div {
        // @apply border-b border-r border-gray-500;
        border-style: solid;
        border-width: 0;
        border-bottom-width: 1px;
        border-right-width: 1px;
        --tw-border-opacity: 1;
        border-color: rgb(107 114 128 / 1);
        border-color: rgb(107 114 128 / var(--tw-border-opacity));
      }
      .label {
        // @apply inline-block text-right w-16 bg-gray-500 p-1 border-gray-600;
        // @apply flex flex-col justify-center;

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

      .unit {
        // @apply w-full h-full bg-gray-600;

        height: 100%;
        width: 100%;
        --tw-bg-opacity: 1;
        background-color: rgb(75 85 99 / 1);
        background-color: rgb(75 85 99 / var(--tw-bg-opacity));
        border-right-width: 0;

        &.beat-end {
          // @apply border-r-0;

          border-right-width: 1px;
        }
      }

      &.sharp .unit {
        // @apply bg-gray-700;

        --tw-bg-opacity: 1;
        background-color: rgb(55 65 81 / 1);
        background-color: rgb(55 65 81 / var(--tw-bg-opacity));
      }
    }
    .note {
      //   @apply absolute z-20;

      position: absolute;
      z-index: 20;
      .note-inner {
        // @apply absolute border-2 w-full h-full;
        // @apply grid;

        position: absolute;
        border-style: solid;
        border-width: 2px;
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: 0.5rem 1fr 0.5rem;

        .middle {
          //   @apply cursor-grab;

          cursor: grab;
        }
        .edge {
          //   @apply cursor-col-resize;

          cursor: col-resize;
        }

        &.red {
          //   @apply bg-red-500 border-t-red-400 border-l-red-400 border-r-red-600 border-b-red-600;

          border-top-color: rgb(248 113 113 / 1);
          border-top-color: rgb(248 113 113 / var(--tw-border-opacity));
          border-left-color: rgb(248 113 113 / 1);
          border-left-color: rgb(248 113 113 / var(--tw-border-opacity));
          border-right-color: rgb(220 38 38 / 1);
          border-right-color: rgb(220 38 38 / var(--tw-border-opacity));
          --tw-border-opacity: 1;
          border-bottom-color: rgb(220 38 38 / 1);
          border-bottom-color: rgb(220 38 38 / var(--tw-border-opacity));
          --tw-bg-opacity: 1;
          background-color: rgb(239 68 68 / 1);
          background-color: rgb(239 68 68 / var(--tw-bg-opacity));
        }

        &.blue {
          //   @apply bg-blue-500 border-t-blue-400 border-l-blue-400 border-r-blue-600 border-b-blue-600;

          border-top-color: rgb(96 165 250 / 1);
          border-top-color: rgb(96 165 250 / var(--tw-border-opacity));
          border-left-color: rgb(96 165 250 / 1);
          border-left-color: rgb(96 165 250 / var(--tw-border-opacity));
          border-right-color: rgb(37 99 235 / 1);
          border-right-color: rgb(37 99 235 / var(--tw-border-opacity));
          --tw-border-opacity: 1;
          border-bottom-color: rgb(37 99 235 / 1);
          border-bottom-color: rgb(37 99 235 / var(--tw-border-opacity));
          --tw-bg-opacity: 1;
          background-color: rgb(59 130 246 / 1);
          background-color: rgb(59 130 246 / var(--tw-bg-opacity));
        }

        &.green {
          //   @apply bg-green-500 border-t-green-400 border-l-green-400 border-r-green-600 border-b-green-600;

          border-top-color: rgb(74 222 128 / 1);
          border-top-color: rgb(74 222 128 / var(--tw-border-opacity));
          border-left-color: rgb(74 222 128 / 1);
          border-left-color: rgb(74 222 128 / var(--tw-border-opacity));
          border-right-color: rgb(22 163 74 / 1);
          border-right-color: rgb(22 163 74 / var(--tw-border-opacity));
          --tw-border-opacity: 1;
          border-bottom-color: rgb(22 163 74 / 1);
          border-bottom-color: rgb(22 163 74 / var(--tw-border-opacity));
          --tw-bg-opacity: 1;
          background-color: rgb(34 197 94 / 1);
          background-color: rgb(34 197 94 / var(--tw-bg-opacity));
        }
      }

      &.dragging .note-inner .middle {
        // @apply cursor-grabbing;

        cursor: grabbing;
      }
    }

    .playhead {
      //   @apply absolute bg-gray-400 z-10 top-0 opacity-50 pointer-events-none;

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
        // @apply hidden;

        display: none;
      }
    }
  }
}
</style>
