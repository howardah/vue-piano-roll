<template>
    <div :class="classes">
        <svg v-if="playing" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="currentColor" d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="currentColor" d="m11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
    playing: boolean;
}

const props = defineProps<Props>();

const classes = computed(() => {
    return `play-pause ${props.playing ? 'playing' : ''}`;
});

</script>

<style lang="scss" scoped>
.play-pause {
    width: 2em;
    height: 2em;
    border-radius: 50%;
    background-color: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: background-color 300ms;
    &:hover {
        background-color: #eee;
    }
    svg {
        width: 1em;
        height: 1em;
    }
    &.playing {
        background-color: #eee;
    }
}
</style>