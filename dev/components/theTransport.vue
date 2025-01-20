<template>
  <div class="transport">
    <div class="top">
      <button class="btn rewind" @click="rewind"><Icon :icon="rewindIcon" /></button>
      <button class="btn fast-forward" @click="fastForward">
        <Icon :icon="fastForwardIcon" />
      </button>
      <button class="btn stop" @click="stop"><Icon :icon="stopIcon" /></button>
      <button class="btn play" :class="{ playing }" @click="playPause">
        <Icon :icon="playing ? pauseIcon : playIcon" />
      </button>
    </div>
    <div class="bottom">
      <select v-model="synthSelectorModel">
        <option value="synth">Synth</option>
        <option value="amSynth">AM Synth</option>
        <option value="fmSynth">FM Synth</option>
      </select>

      <input v-model="tempoModel" min="1" max="400" type="number" name="tempo" id="tempo" />

      <button class="btn zoom-in" @click="zoomIn">+</button>
      <button class="btn zoom-out" @click="zoomOut">-</button>

      <button class="btn clear" @click="clearNotes">Clear</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import playIcon from "@iconify-icons/mdi/play";
import pauseIcon from "@iconify-icons/mdi/pause";
import stopIcon from "@iconify-icons/mdi/stop";
import rewindIcon from "@iconify-icons/mdi/rewind";
import fastForwardIcon from "@iconify-icons/mdi/fast-forward";
import { computed, withDefaults } from 'vue';

interface Props {
    tempo: number;
    playing: boolean;
    synthSelector: string;
    clearNotes?: () => void;
    rewind?: () => void;
    fastForward?: () => void;
    stop?: () => void;
    playPause?: () => void;
    zoomIn?: () => void;
    zoomOut?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
    tempo: 120,
    playing: false,
    synthSelector: 'synth',
    clearNotes: () => { },
    rewind: () => { },
    fastForward: () => { },
    stop: () => { },
    playPause: () => { },
    zoomIn: () => { },
    zoomOut: () => { },
});

const emit = defineEmits({
    'update:tempo': (value: number) => true,
    'update:synthSelector': (value: string) => true,
});

const tempoModel = computed({
    get: () => props.tempo,
    set: (value) => emit('update:tempo', value)
});

const synthSelectorModel = computed({
    get: () => props.synthSelector,
    set: (value) => emit('update:synthSelector', value)
});

</script>

<style lang="scss" scoped>
.transport {
  @apply grid gap-2 pt-2 pb-8 px-4;
  .top,
  .bottom {
    @apply flex items-center justify-center;
  }
  .top {
    .btn {
      // @apply bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded;
      @apply rounded-none;

      &:first-child {
        @apply rounded-l;
      }

      &:last-child {
        @apply rounded-r;
      }
    }
  }

  .bottom {
    @apply gap-2;

    select {
      //   @apply bg-indigo-500 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded;
      @apply bg-white text-indigo-500 text-xs font-bold py-2 px-4 rounded border-4 border-indigo-500;
      @apply hover:border-indigo-700 hover:text-indigo-700;

      &:focus {
        @apply outline-none;
      }
    }

    input {
      @apply bg-white text-indigo-500 text-xs font-bold py-2 px-4 rounded border-4 border-indigo-500;
      @apply hover:border-indigo-700 hover:text-indigo-700;

      width: fit-content;

      &:focus {
        @apply outline-none;
      }
    }

    .clear {
      // @apply bg-white text-indigo-500 text-xs font-bold py-2 px-4 rounded border-4 border-indigo-500;
      @apply bg-rose-500 text-white text-xs font-bold py-2 px-4 rounded border-4 border-rose-500;
      @apply hover:border-rose-700 hover:bg-rose-700;
    }
  }
}
</style>
