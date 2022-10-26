<script lang="ts">
    import { createEventDispatcher } from "svelte";


  export let x;
  export let y;
  export let id;
  export let color;
  export let highlight;

  const dispatch = createEventDispatcher<{
    highlight: HighlightEvent,
    move: ColorCircleMoveEvent,
    stop: ColorCircleStopMoveEvent
  }>();
</script>

<circle
  cx="{x}"
  cy="{y}"
  r="10"
  stroke="black"
  stroke-width="{highlight ? '2px' : '1px'}"
  fill="{color}"
  on:mousedown="{() => dispatch("move", { id })}"
  on:mouseup={() => dispatch("stop", { id })}
  on:dblclick="{() => dispatch("highlight", { id: id })}"
></circle>