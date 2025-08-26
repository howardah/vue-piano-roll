<template>
  <div
    :style="style"
    class="pr-shrink-wrap"
    :class="{ 'pr-fullscreen': prFullscreen }"
  >
    <FullScreen
      :color="fullscreenColor"
      @click="prFullscreen = !prFullscreen"
      :open="prFullscreen"
    />
    <div class="pr-container">
      <div ref="pianoRoll" class="pr-piano-roll">
        <div
          @mousedown.prevent="addNote"
          @mouseup.prevent="dragEnd"
          :class="`pr-tone ${/#/.test(tone) ? 'pr-sharp' : ''}`"
          v-for="tone in scale"
          :key="tone"
        >
          <div class="pr-label">{{ tone }}</div>
          <div
            :class="`${beatClass(index)}`"
            v-for="index in ticksToBeats(length, true)"
            :key="`${tone}:${index}`"
          ></div>
        </div>

        <div class="pr-note-grid">
          <div
            v-for="ghost in longShadows"
            :class="`pr-ghost ${ghost.note}`"
            :style="{
              gridColumn: `${beatsToTicks(ghost.start || 0) + 2} / span ${beatsToTicks(
                ghost.length || length
              )}`,
              gridRow: `${scaleLookup[ghost.note] + 1} / span 1`,
              height: zoomY * 2 + 'rem',
            }"
          ></div>
          <div
            :class="`pr-note ${note.id === draggingNote?.note?.id ? 'pr-dragging' : ''}`"
            v-for="note in notes"
            :style="{
              gridColumn: `${beatsToTicks(note.start) + 2} / span ${beatsToTicks(note.length)}`,
              gridRow: `${scaleLookup[note.note] + 1} / span 1`,
              height: zoomY * 2 + 'rem',
            }"
            :key="note.id"
            @click.right.prevent="deleteNote(note)"
          >
            <div class="pr-note-inner" :style="noteCSS(note)">
              <span
                @mousedown.prevent="(e) => dragStart(note, { e, dragType: 'left' })"
                @mouseup.prevent="dragEnd"
                class="pr-edge pr-right"
              ></span>
              <span
                @mousedown.prevent="(e) => dragStart(note, { e, dragType: 'drag' })"
                @mouseup.prevent="dragEnd"
                class="pr-middle"
              ></span>
              <span
                @mousedown.prevent="(e) => dragStart(note, { e, dragType: 'right' })"
                @mouseup.prevent="dragEnd"
                class="pr-edge pr-left"
              ></span>
            </div>
          </div>
        </div>
        <div :class="`pr-playhead ${playheadHidden ? 'pr-hidden' : ''}`"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { WritableComputedRef, computed, onMounted, onUnmounted, ref, watch } from "vue";
import { OctaveNote, notesBetweenC1AndG9, convertFlatToSharp } from "../assets/notes";
import {
  PianoRollNote,
  DragDetails,
  DragType,
  PianoRollProps,
  PianoRollSimpleNote,
  ShadowMap,
} from "../assets/piano";
import { darken, lighten, getLuminance } from "color2k";
import FullScreen from "./FullScreen.vue";

const emit = defineEmits(["update:modelValue"]);

const mousePosition = ref({ x: 0, y: 0 });
const pianoRoll = ref<HTMLDivElement | null>(null);
const draggingNote = ref<DragDetails | null>(null);

const rem = ref(16);
const prFullscreen = ref(false);
const rollWidth = ref(0);

const startedNotes = ref([] as OctaveNote[]);

const props = withDefaults(defineProps<PianoRollProps>(), {
  zoomX: 0.5,
  zoomY: 1,
  currentBeat: -1,
  rangeBottom: "C1",
  rangeTop: "G5",
  length: 80,
  ticksPerBeat: 2,
  defaultNoteLength: 1,
  noteColor: "#f43f5f",
  loop: true,
  noteHeight: 2,
  backgroundColor: "rgb(76, 85, 99)",
  gridColor: "rgb(107, 114, 128)",
  incidentalColor: "rgb(55, 65, 81)",
  labelColor: "rgb(255, 255, 255)",
  labelBackgroundColor: "rgb(107, 114, 128)",
  labelIncidentalColor: "rgb(107, 114, 128)",
  labelBorderColor: "rgb(75, 85, 99)",
  borderWidth: 1,
  shadowColor: "rgba(255, 255, 255, 0.3)",
  shadowMap: () => [] as ShadowMap[],
  onNoteEvent: () => {},
});

const zoom = computed(() => {
  if (props.length === "infinite") return { x: props.zoomX, y: props.zoomY };
  const minZoomX = (rollWidth.value - rem.value * 4) / (rem.value * props.length);
  const x = Math.max(minZoomX, props.zoomX);

  return { x, y: props.zoomY };
});

const longShadows = computed((): ShadowMap[] => {
  if (!props.shadowMap) return [];
  return props.shadowMap.flatMap((shadow) => {
    shadow = { ...shadow, note: convertFlatToSharp(shadow.note) };
    if (/[0-9]/.test(shadow.note)) {
      if (typeof scaleLookup.value[shadow.note] === "undefined") return [];
      return shadow;
    }
    const shadows = [];
    const start = shadow.start || 0;
    const shadowLength = shadow.length || length.value - start;
    const matchingNotes = (Object.keys(scaleLookup.value) as OctaveNote[]).filter((note) =>
      new RegExp(`${shadow.note}-?[0-9]`).test(note)
    );
    for (const note of matchingNotes) {
      shadows.push({
        note,
        start,
        length: shadowLength,
      });
    }
    return shadows;
  });
});

// const shortShadows = computed(():ShadowMap[] => {
//   if(!props.shadowMap) return [];
//   return props.shadowMap.filter((shadow) => typeof shadow.length === "number");
// });

const simpleNotes = computed(() => {
  return notes.value.map(
    (note) =>
      ({
        id: note.id,
        note: note.note,
      } as PianoRollSimpleNote)
  );
});

const beatsToTicks = (beats: number) => {
  return Math.round(beats * props.ticksPerBeat);
};

const ticksToBeats = (length: number, rounded: boolean = false) => {
  if (rounded) return Math.ceil(length / props.ticksPerBeat);
  return length / props.ticksPerBeat;
};

const currentTime = computed(() => {
  const time = props.currentTick ?? beatsToTicks(props.currentBeat);
  if (props.length === "infinite" || !props.loop) return time;
  return time % length.value;
});

const notes: WritableComputedRef<PianoRollNote[]> = computed({
  get: () => props.modelValue || [],
  set: (value) => emit("update:modelValue", value),
});

const length = computed(() => {
  if (props.length !== "infinite") return beatsToTicks(props.length);
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

const notesStartingAt = (tick: number) => {
  return notes.value.filter((note) => beatsToTicks(note.start) === tick).map((note) => note.note);
};

const notesEndingAt = (tick: number) => {
  return notes.value
    .filter((note) => {
      if (tick === 0) tick = length.value;
      return beatsToTicks(note.start + note.length) === tick;
    })
    .map((note) => note.note);
};

watch(currentTime, (beat) => {
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
  const unit = ((index - 1) % props.ticksPerBeat) + 1;
  return `pr-beat pr-b${unit} pr-beat-end`;
};

// ====================
// Calculate Note Position
// ====================

const getNote = (y: number) => {
  const index = Math.floor(y / (rem.value * 2 * zoom.value.y));
  return scale.value[index];
};

const getLeft = (start: number, ticks: boolean = false) => {
  const labelWidth = rem.value * 4;
  const unitWidth = rem.value * zoom.value.x;
  const startInBeats = ticks ? ticksToBeats(start) : start;
  return labelWidth + startInBeats * unitWidth;
};

const getStart = (x: number) => {
  const labelWidth = rem.value * 4;
  const unitWidth = rem.value * zoom.value.x;
  return ticksToBeats(Math.floor(beatsToTicks((x - labelWidth) / unitWidth)));
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

const setSelectedNotePosition = () => {
  if (!draggingNote.value) return;
  const { x, y } = mousePosition.value;
  const note = draggingNote.value.note;
  const type = draggingNote.value.dragType;
  const xStart = getStart(x) - ticksToBeats(props.ticksPerBeat - 1);
  const newStart = Math.max(getStart(x - draggingNote.value.offset), 0);
  const newNote = getNote(y);
  if (type === "drag") {
    note.start = Math.min(ticksToBeats(length.value - beatsToTicks(note.length)), newStart);
    note.note = newNote;
    return;
  }

  if (type === "left") {
    note.start = Math.min(newStart, draggingNote.value.placement.end - ticksToBeats(1));
    note.length = draggingNote.value.placement.end - newStart || ticksToBeats(1);
    return;
  }

  if (type === "right" || type === "drag-right") {
    const newLength = xStart - note.start + 1;
    note.length = newLength <= 0 ? 1 / props.ticksPerBeat : newLength;
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
  if (e.button !== 0) return;
  if (!pianoRoll.value) return;
  const x = mousePosition.value.x;
  const y = mousePosition.value.y;
  const start = getStart(x);
  let noteLength = props.defaultNoteLength;

  if (beatsToTicks(start + noteLength) > length.value) {
    noteLength = ticksToBeats(length.value - beatsToTicks(start));
  }

  if (start < 0) return;
  const note = getNote(y);
  const newNote = {
    id: getLastId() + 1,
    start,
    length: noteLength,
    note,
    velocity: 100,
    color: props.noteColor,
    selected: false,
  } as PianoRollNote;
  notes.value.push(newNote);

  console.log(`${beatsToTicks(newNote.start) + 2} / span ${beatsToTicks(newNote.length)}`);

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
  const lengthInBeats = ticksToBeats(length.value);
  const repeat = Math.floor(lengthInBeats);

  if (repeat !== lengthInBeats) {
    const fraction = lengthInBeats % 1;
    const lastBox = `calc(1rem * ${zoom.value.x} * ${fraction})`;
    return `4rem repeat(${repeat}, calc(1rem * ${zoom.value.x})) ${lastBox}`;
  }

  return `4rem repeat(${repeat}, calc(1rem * ${zoom.value.x}))`;
});

const noteGridTemplate = computed(() => {
  return `4rem repeat(${length.value}, calc(1rem * ${ticksToBeats(zoom.value.x)}))`;
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
  return `${getLeft(currentTime.value, true)}px`;
});

const playheadHeight = computed(() => {
  return `${2 * zoom.value.y * scale.value.length}rem`;
});

const playheadWidth = computed(() => {
  return `${ticksToBeats(zoom.value.x)}rem`;
});

const playheadHidden = computed(() => {
  return currentTime.value < 0;
});

const backgroundColor = computed(() => {
  return props.backgroundColor;
});

const gridColor = computed(() => {
  return props.gridColor;
});

const incidentalColor = computed(() => {
  return props.incidentalColor;
});

const labelColor = computed(() => {
  return props.labelColor;
});

const labelBackgroundColor = computed(() => {
  return props.labelBackgroundColor;
});

const labelIncidentalColor = computed(() => {
  return props.labelIncidentalColor;
});

const labelBorderColor = computed(() => {
  return props.labelBorderColor;
});

const borderWidth = computed(() => {
  return props.borderWidth + "px";
});

const noteGridTop = computed(() => {
  return `-${Math.ceil(props.borderWidth / 2)}px`;
});

const noteGridLeft = computed(() => {
  return `-${Math.ceil(props.borderWidth / 2)}px`;
});

const shadowColor = computed(() => {
  return props.shadowColor;
});

const fullscreenColor = computed(() => {
  return getLuminance(props.backgroundColor) > 0.5 ? "#000" : "#fff";
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

const noteHeight = computed(() => {
  return `${props.noteHeight}px`;
});

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

const style = computed(() => {
  return {
    '--pr-background-color': backgroundColor.value,
    '--pr-grid-color': gridColor.value,
    '--pr-incidental-color': incidentalColor.value,
    '--pr-label-color': labelColor.value,
    '--pr-label-background-color': labelBackgroundColor.value,
    '--pr-label-incidental-color': labelIncidentalColor.value,
    '--pr-label-border-color': labelBorderColor.value,
    '--pr-border-width': borderWidth.value,
    '--pr-shadow-color': shadowColor.value,
    '--pr-tone-grid-height': toneGridHeight.value,
    '--pr-tone-grid-template': toneGridTemplate.value,
    '--pr-note-grid-template': noteGridTemplate.value,
    '--pr-note-grid-template-rows': noteGridTemplateRows.value,
    '--pr-note-grid-top': noteGridTop.value,
    '--pr-note-grid-left': noteGridLeft.value,
    '--pr-label-font-size': labelFontSize.value,
    '--pr-playhead-left': playheadLeft.value,
    '--pr-playhead-height': playheadHeight.value,
    '--pr-playhead-width': playheadWidth.value,
    '--pr-note-height': noteHeight.value,
  };
});
</script>

<style lang="scss" scoped>
* {
  box-sizing: border-box;
  -moz-box-sizing: border-box;
  -webkit-box-sizing: border-box;
}

.pr-shrink-wrap {
  position: relative;
  width: 100%;
  max-height: inherit;

  &.pr-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    max-height: 100%;
    z-index: 5;
    background-color: rgb(76, 85, 99);
    background-color: var(--pr-background-color);
  }
}
.pr-container {
  position: relative;
  overflow: scroll;
  max-height: inherit;
  .pr-piano-roll {
    position: relative;
    font-weight: 700;
    color: white;
    color: var(--pr-label-color);

    .pr-tone {
      display: grid;
      align-items: center;
      height: var(--pr-tone-grid-height);
      grid-template-columns: var(--pr-tone-grid-template);
      background-color: rgb(75, 85, 99);
      background-color: var(--pr-background-color);

      & > div {
        border-style: solid;
        border-width: 0;
        border-bottom-width: 1px;
        border-right-width: 1px;
        border-bottom-width: var(--pr-border-width);
        border-right-width: var(--pr-border-width);
        border-color: rgb(107, 114, 128);
        border-color: var(--pr-grid-color);
      }
      .pr-label {
        display: inline-block;
        width: 4rem;
        border-color: rgb(75, 85, 99);
        border-color: var(--pr-label-border-color);
        background-color: rgb(107, 114, 128);
        background-color: var(--pr-label-background-color);
        padding: 0.25rem;
        text-align: right;
        display: flex;
        flex-direction: column;
        justify-content: center;
        height: var(--pr-tone-grid-height);
        font-size: var(--pr-label-font-size);
      }

      .pr-beat {
        height: 100%;
        width: 100%;
        border-right-width: 0;

        &.pr-beat-end {
          border-right-width: 1px;
          border-right-width: var(--pr-border-width);
        }
      }

      &.pr-sharp {
        background-color: rgb(55, 65, 81);
        background-color: var(--pr-incidental-color);

        .pr-label {
          background-color: rgb(55, 65, 81);
          background-color: var(--pr-label-incidental-color);
        }
      }
    }

    .pr-note-grid {
      display: grid;
      width: 100%;
      height: var(--pr-tone-grid-height);
      grid-template-columns: var(--pr-note-grid-template);
      grid-template-rows: var(--pr-note-grid-template-rows);
      position: absolute;
      top: -1px;
      top: var(--pr-note-grid-top);
      left: 0;
      left: var(--pr-note-grid-left);
      pointer-events: none;

      .pr-ghost {
        pointer-events: none;
        position: absolute;
        z-index: 10;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.3);
        background-color: var(--pr-shadow-color);
      }
      .pr-note {
        position: relative;
        z-index: 20;
        pointer-events: initial;
        .pr-note-inner {
          position: absolute;
          border-style: solid;
          border-width: 2px;
          border-width: var(--pr-note-height);
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: 0.5rem 1fr 0.5rem;

          .pr-middle {
            cursor: grab;
          }
          .pr-edge {
            cursor: col-resize;
          }
        }

        &.pr-dragging .pr-note-inner .pr-middle {
          cursor: grabbing;
        }
      }
    }
    .pr-playhead {
      position: absolute;
      background-color: rgb(156 163 175 / 1);
      z-index: 10;
      top: 0;
      opacity: 0.5;
      pointer-events: none;

      left: var(--pr-playhead-left);
      height: var(--pr-playhead-height);
      width: var(--pr-playhead-width);

      &.pr-hidden {
        display: none;
      }
    }
  }
}
</style>
