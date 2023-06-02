<template>
  <h1>Vue3 Piano Roll</h1>
  <TheTransport
    :rewind="rewind"
    :fast-forward="fastForward"
    :stop="stop"
    :play-pause="playPause"
    :tempo="tempo"
    :playing="playing"
    :synth-selector="synthSelector"
    :clear-notes="() => (notes = [])"
    :zoom-in="zoomIn"
    :zoom-out="zoomOut"
    @update:tempo="tempo = $event"
    @update:synth-selector="synthSelector = $event"
  />
  <div class="page">
    <div class="roller">
      <PianoRoll
        :current-tick="beat"
        range-bottom="F#2"
        range-top="D#3"
        v-model="notes"
        :zoom-x="zoomX"
        :zoom-y="zoomY"
        :length="16"
        :on-note-event="onNoteEvent"
        :ticks-per-beat="2"
        :note-height="1"
        :shadow-map="shadowMap"
        shadow-color="rgba(100,50,100,0.3)"
        label-incidental-color="rgba(0,0,0,0.1)"
        label-color="teal"
        background-color="white"
        incidental-color="rgba(0,0,0,0.1)"
        label-background-color="white"
        grid-color="rgba(200,200,200,1)"
        label-border-color="rgba(200,200,200,1)"
        note-color="rgba(0,0,0,0.5)"
      />
    </div>
    <pre
      >{{ notes }}
          </pre
    >
  </div>
</template>

<script lang="ts" setup>
import TheTransport from "./theTransport.vue";
import PianoRoll from "../../src/components/PianoRoll.vue";
import { notes as demoNotes, shadowMap as demoShadowMap } from "../assets/demoData";
import { onMounted, onUpdated, ref, watch } from "vue";
import { NoteEvent } from "../../src/assets/piano";
import * as Tone from "tone";

const notes = ref(demoNotes);
const shadowMap = ref(demoShadowMap);

const beat = ref(-1);
const zoomX = ref(1);
const zoomY = ref(1);

const playing = ref(false);
const tempo = ref(120);

const synthSelector = ref("amSynth");

const rewind = () => {
  beat.value -= 1;
};

const fastForward = () => {
  beat.value += 1;
};

const playPause = () => {
  startStop();
};

const initialized = ref(false);

let synth: null | Tone.PolySynth = null;

const synthList: Record<string, any> = {
  synth: null as null | Tone.Synth,
  amSynth: null as null | Tone.AMSynth,
  fmSynth: null as null | Tone.FMSynth,
};

const unit = "8n";

watch(synthSelector, (value) => {
  if (synth) synth.releaseAll();
  synth = synthList[value];
});

const zoomIn = () => {
  zoomX.value += 0.1;
  zoomY.value += 0.1;
};

const zoomOut = () => {
  zoomX.value -= 0.1;
  zoomY.value -= 0.1;
};

const initialize = async () => {
  await Tone.start();
  // initialize synthList with all the synths
  for (const key in synthList) {
    let newSynth;

    switch (key) {
      case "synth":
        newSynth = new Tone.PolySynth(Tone.Synth).toDestination();
        break;
      case "amSynth":
        newSynth = new Tone.PolySynth(Tone.AMSynth).toDestination();
        break;
      case "fmSynth":
        newSynth = new Tone.PolySynth(Tone.FMSynth).toDestination();
        break;

      default:
        newSynth = new Tone.Synth().toDestination();
        break;
    }

    synthList[key] = newSynth;
  }

  synth = synthList[synthSelector.value];
  initialized.value = true;
};

const play = async () => {
  playing.value = true;
  if (!initialized.value) await initialize();
  if (!synth) synth = new Tone.PolySynth(Tone.Synth).toDestination();

  Tone.Transport.start();
};

const pause = () => {
  Tone.Transport.stop();
  synth?.releaseAll();
  playing.value = false;
};

const stop = () => {
  pause();
  beat.value = -1;
};

const startStop = () => {
  if (Tone.Transport.state === "started") {
    pause();
    return;
  }

  play();
};

const onNoteEvent = (event: NoteEvent) => {
  event.notesEnding.forEach((note) => {
    synth?.triggerRelease(note);
  });

  event.notesStarting.forEach((note) => {
    synth?.triggerAttack(note);
  });
};

watch(tempo, (value) => {
  Tone.Transport.bpm.value = value;
});

onMounted(() => {
  Tone.Transport.bpm.value = tempo.value;

  Tone.Transport.scheduleRepeat(() => {
    if (playing.value) beat.value += 1;
  }, unit);
  // schedule();
});

onUpdated(() => {
  // schedule();
});
</script>

<style lang="scss">
@tailwind base;
@tailwind components;
@tailwind utilities;

h1 {
  @apply text-indigo-600 text-4xl text-center font-bold my-4;
}

.btn {
  @apply bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded;
}

.page {
  @apply m-auto;
  max-width: calc(100vw - 4rem);
}
.roller {
  @apply rounded overflow-hidden shadow-lg;

  max-height: max(calc(100vh - 30rem), 30rem);
  //   min-height: 30rem;
}

pre {
  @apply max-h-64 my-4 rounded overflow-hidden shadow-inner;
  @apply border-2 border-gray-400;
  @apply text-left text-xs text-gray-500 bg-gray-100 p-2 overflow-scroll;
}
</style>
