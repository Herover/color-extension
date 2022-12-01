<script lang="ts">
    import chroma from "chroma-js";
    import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{ highlight: HighlightEvent }>();

  export let swatch = [];
  export let highlighted = {};
  $: sortedSwatch = swatch
    .map(item => {
      item.lookalikes = [];
      return item;
    })
    .map((item, i) => {
      const color1 = chroma(item.color);
        if (color1.alpha() !== 1) {
          return item;
        }

      // TODO: Could be faster by looping from i-swatch.length instead of this which is about n^2
      item.lookalikes = swatch
        .filter((item2, i2) => {
          if (i == i2) {
            return false;
          }

          const color2 = chroma(item2.color);

          // Ignore comparing colors with transparency
          if (color2.alpha() !== 1) {
            return;
          }

          // TODO: Define a constant to use
          if (chroma.deltaE(color1, color2) < 1) {
            return true;
          }
        })
        .map(e => ({ color: e.color }));

      return item;
    })
    .map(e => e) // Shallow-copy to avoid mutating original array
    .sort((a, b) => {
      const aHSL = chroma(a.color).hsl();
      const bHSL = chroma(b.color).hsl();

      const hueDiff = (bHSL[0] || -1) - (aHSL[0] || -1);
      if (hueDiff == 0) {
        const saturationDiff = bHSL[1] - aHSL[1];
        if (saturationDiff == 0) {
          const lightnessDiff = bHSL[2] - aHSL[2];
          if (lightnessDiff == 0) {
            // @ts-ignore because color.hsl() now returns 4 components
            const alphaDiff = (bHSL[3] || 1) - (aHSL[3] || 1);
            return alphaDiff;
          }
          return lightnessDiff;
        }
        return saturationDiff;
      }
      return hueDiff;
    });
</script>

{#each sortedSwatch as swatchItem}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <p
    class:highlight="{highlighted[swatchItem.id]}"
    on:dblclick="{() => dispatch("highlight", { id: swatchItem.id, deselect: true, deselectOthers: false })}"
    on:click="{(e) => e.ctrlKey && dispatch("highlight", { id: swatchItem.id, deselect: true, deselectOthers: false })}"
  >
    <span
      class="swatch-color"
      style="background-color:{swatchItem.color}"
    ></span>
    {swatchItem.color}
    {#if swatchItem.lookalikes.length}
      {#each swatchItem.lookalikes as lookalike}
        <span class="swatch-color" style="background-color:{lookalike.color}"></span>
      {/each}
    {/if}
  </p>
{/each}

<style>
  .swatch-color {
    display: inline-block;
    height: 22px;
    width: 36px;
  }
  .highlight {
    font-weight: bold;
  }
</style>