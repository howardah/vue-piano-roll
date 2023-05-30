Here's an updated readme including the new props and explanations:

# PianoRoll Vue Component

A flexible, highly customizable Piano Roll component for Vue.js. This component allows you to create a piano roll in your Vue application with ease.

## Demo

Demo available [here](https://vue-piano-roll.netlify.app/) and demo source code, [here](https://github.com/howardah/vue-piano-roll-demo).

## Installation

```bash
yarn add vue-piano-roll
```

## Usage

Import the component in your Vue application:

```javascript
import { PianoRoll } from "vue-piano-roll";
import "vue-piano-roll/dist/style.css";

const notes = ref([]);
```

or

```typescript
import { PianoRoll, PianoRollNote } from "vue-piano-roll";
import "vue-piano-roll/dist/style.css";

const notes = ref([] as PianoRollNote[]);
```

Then use the `PianoRoll` component in your template:

```html
<piano-roll v-model="notes"></piano-roll>
```

The `PianoRoll` component requires a v-model binding to an array to function correctly and also supports a variety of optional props:

```html
<piano-roll
  v-model="notes"
  :zoomX="0.5"
  :zoomY="1"
  :currentBeat="0"
  :currentTick="0"
  :ticksPerBeat="4"
  :rangeBottom="'C1'"
  :rangeTop="'G5'"
  :length="80"
  :defaultNoteLength="2"
  :noteHeight="1"
  :noteColor="'#f43f5f'"
  :loop="true"
  :onNoteEvent="handleNoteEvent"
></piano-roll>
```

## Props

| Prop              | Type               | Description                                                                                          |
| ----------------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| zoomX             | Number             | Defines the zoom level along the x-axis.                                                             |
| zoomY             | Number             | Defines the zoom level along the y-axis.                                                             |
| rangeBottom       | OctaveNote         | The lowest note that the piano roll should display.                                                  |
| rangeTop          | OctaveNote         | The highest note that the piano roll should display.                                                 |
| currentBeat       | Number             | The current beat.                                                                                    |
| currentTick       | Number             | The current tick within the beat.                                                                    |
| ticksPerBeat      | Number             | The number of ticks in a beat. (defaults to 4)                                                       |
| defaultNoteLength | Number             | The default number of beats in a note. (defaults to 2)                                               |
| noteHeight        | Number             | The apparent 3D height of the piano roll notes.                                                      |
| modelValue        | Array              | The array of notes for the piano roll.                                                               |
| length            | Number\|"infinite" | The total length of the piano roll. (also supports the string "infinite")                            |
| loop              | Boolean            | If true, the piano roll will loop back to the beginning when it reaches the end.                     |
| noteColor         | String             | The default color of the piano roll notes.                                                           |
| onNoteEvent       | Function           | A callback function with a NoteEvent argument that includes a list of notes that have started/ended. |

## Events

The PianoRoll emits the following events:

| Event               | Output Type | Description                                               |
| ------------------- | ----------- | --------------------------------------------------------- |
| `update:modelValue` | Array       | Emits the updated array of notes when notes are modified. |

## Contributing

Contributions are welcome! If you have any issues or

feature requests, please submit an issue on Github.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
