<script>
    import chroma from "chroma-js";


  export let swatch = [];
  $: sortedSwatch = swatch.sort((a, b) => {
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

{#each swatch as swatchItem}
  <p>
    <span class="swatch-color" style="background-color:{swatchItem.color}"></span>
    {swatchItem.hsl}
  </p>
{/each}

<style>
  .swatch-color {
    display: inline-block;
    height: 22px;
    width: 36px;
  }
</style>