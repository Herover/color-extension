<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import chroma from "chroma-js";
	import ColorWheelCircle from './ColorWheelCircle.svelte';

	export let height = 30;
	export let width = 400;

  export let colors = [];

  export let highlighted = {};


	let movingItem = -1;

  const dispatch = createEventDispatcher<{ updateColor: UpdateColorEvent, highlight: HighlightEvent }>();

  const startSwatchItemMove = (event: CustomEvent<ColorCircleMoveEvent>) => {
    movingItem = computedColors.findIndex(e => e.id == event.detail.id);
  };
  const endSwatchItemMove = (event: CustomEvent<ColorCircleStopMoveEvent>) => {
    movingItem = -1;
  }
  const updatePosition = (event) => {
    if (movingItem != -1) {
      try {
        const rect = event.currentTarget.getBoundingClientRect();

        computedColors[movingItem].x = Math.max(0, Math.min(width, event.clientX - rect.left));

        const color = chroma(computedColors[movingItem].color);
        const [hue, saturation] = color.hsl();
        const lightness = computedColors[movingItem].x/width;
        const hslString = `${Math.floor(hue*100)/100}, ${Math.floor(saturation*10000)/100}%, ${lightness*100}%`;
        if (color.alpha() !== 1) {
          computedColors[movingItem].color = `hsla(${hslString},${color.alpha()})`;
        } else {
          computedColors[movingItem].color = `hsl(${hslString})`;
        }

        dispatch("updateColor", { id: computedColors[movingItem].id, hslColor: computedColors[movingItem].color });
      } catch(e) {
        // FIXME: quick way to avoid getting "stuck" dragging a circle when color becomes invalid
        movingItem = -1;
        console.error(e);
      }
    }

    return false;
  }

	$: computedColors = colors
		.map(e => {
      let chromaColor;
      try {
			  chromaColor = chroma(e.color);
      } catch (e) {
        console.error(e);
        return;
      }

			const [hue, saturation, lightness] = chromaColor.hsl();
			return {
				x: lightness * width,
				color: e.color,
				id: e.id,
				highlight: highlighted[e.id],
			};
		})
		.sort((a, b) => {
			if (a.highlight && b.highlight) return 0;
			if (!a.highlight && b.highlight) return -1;
			if (a.highlight && !b.highlight) return 1;
			return 0;
		});

</script>

<svg
  width="{width}px"
  height="{height}px"
  on:mousemove="{updatePosition}"
>
  {#each computedColors as color}
    <ColorWheelCircle
      color="{color.color}"
      id="{color.id}"
      x="{color.x}"
      y="{height/2}"
      highlight="{color.highlight}"
      on:move="{startSwatchItemMove}"
      on:stop="{endSwatchItemMove}"
      on:highlight
    />
  {/each}
</svg>