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

| Prop                  | Type                  | Default Value           | Description                                                                                                |
| --------------------- | --------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| zoomX                 | Number                | 0.5                     | Defines the zoom level along the x-axis.                                                                   |
| zoomY                 | Number                | 1                       | Defines the zoom level along the y-axis.                                                                   |
| rangeBottom           | OctaveNote            | "C1"                    | The lowest note that the piano roll should display.                                                        |
| rangeTop              | OctaveNote            | "G5"                    | The highest note that the piano roll should display.                                                       |
| currentBeat           | Number                | -1                      | The current beat.                                                                                          |
| currentTick           | Number                | --                      | The current tick within the beat.                                                                          |
| ticksPerBeat          | Number                | 2                       | The number of ticks in a beat.                                                                             |
| defaultNoteLength     | Number                | 1                       | The default number of beats in a note.                                                                     |
| noteHeight            | Number                | 2                       | The apparent 3D height of the piano roll notes.                                                            |
| modelValue            | Array                 | --                      | The array of notes for the piano roll.                                                                     |
| length                | Number\|"infinite"    | 80                      | The total length of the piano roll. (also supports the string "infinite")                                  |
| loop                  | Boolean               | true                    | If true, the piano roll will loop back to the beginning when it reaches the end.                            |
| noteColor             | String                | "#f43f5f"               | The default color of the piano roll notes.                                                                 |
| backgroundColor       | String                | "rgb(76, 85, 99)"       | The background color of the piano roll.                                                                    |
| incidentalColor       | String                | "rgb(55, 65, 81)"       | The color of the incidentals (sharps and flats) in the piano roll.                                         |
| gridColor             | String                | "rgb(107, 114, 128)"    | The color of the grid lines in the piano roll.                                                             |
| labelColor            | String                | "rgb(255, 255, 255)"    | The color of the note labels in the piano roll.                                                            |
| labelIncidentalColor  | String                | "rgb(107, 114, 128)"    | The color of the incidental note labels in the piano roll.                                                 |
| labelBackgroundColor  | String                | "rgb(107, 114, 128)"    | The background color of the note labels in the piano roll.                                                 |
| labelBorderColor      | String                | "rgb(75, 85, 99)"       | The border color of the note labels in the piano roll.                                                     |
| borderWidth           | Number                | 1                       | The width of the border around the piano roll.                                                             |
| shadowColor           | String                | "rgba(255, 255, 255, 0.3)" | The color of the shadow cast by the notes in the piano roll.                                               |
| shadowMap             | Array                 | []                      | An array of ShadowMap objects, each defining how shadows appear for a specific note in the piano roll.     |
| onNoteEvent           | Function              | --                      | A callback function with a NoteEvent argument that includes a list of notes that have started/ended.       |

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
