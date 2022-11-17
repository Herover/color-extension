<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import chroma from "chroma-js";
	import ColorWheelCircle from './ColorWheelCircle.svelte';
  import type { SwatchColor } from './swatch';
    import { getHSLAString } from './util';

	export let height = 30;
	export let width = 400;

  export let colors: SwatchColor[] = [];

  export let highlighted = {};


	let movingItem = -1;

  const dispatch = createEventDispatcher<{ updateColor: UpdateColorEvent, highlight: HighlightEvent }>();

  const startSwatchItemMove = (event: CustomEvent<ColorCircleMoveEvent>) => {
    movingItem = computedColors.findIndex(e => e.id == event.detail.id);
  };
  const endSwatchItemMove = () => {
    movingItem = -1;
  }
  const updatePosition = (event) => {
    if (movingItem != -1) {
      try {
        const rect = event.currentTarget.getBoundingClientRect();

        computedColors[movingItem].x = Math.max(0, Math.min(width, event.clientX - rect.left));

        const lightness = computedColors[movingItem].x/width;
        computedColors[movingItem].color = getHSLAString(computedColors[movingItem].hue, computedColors[movingItem].saturation, lightness, computedColors[movingItem].alpha);

        dispatch("updateColor", {
          id: computedColors[movingItem].id,
          hslColor: computedColors[movingItem].color,
          hue: computedColors[movingItem].hue,
          saturation: computedColors[movingItem].saturation,
          lightness,
          alpha: computedColors[movingItem].alpha,
        });
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

			// const [hue, saturation, lightness] = chromaColor.hsl();
			return {
				x: e.lightness * width,
				highlight: highlighted[e.id],
				color: e.color,
				id: e.id,
        hue: e.hue,
        saturation: e.saturation,
        lightness: e.lightness,
        alpha: e.alpha,
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
  on:mouseup="{() => endSwatchItemMove()}"
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