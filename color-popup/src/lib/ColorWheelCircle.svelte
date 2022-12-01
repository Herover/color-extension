<script lang="ts">
    import { createEventDispatcher } from "svelte";


  export let x;
  export let y;
  export let id;
  export let color;
  export let highlight;

  let moved = 0;

  const dispatch = createEventDispatcher<{
    highlight: HighlightEvent,
    move: ColorCircleMoveEvent,
    stop: ColorCircleStopMoveEvent
  }>();

  const move = () => {
    dispatch("move", { id });
    moved = new Date().getTime();
  };
  const stop = () => {
    dispatch("stop", { id });
  };
  const click = (e: MouseEvent) => {
    // TODO: consider if circle was moved when deciding to select
    if (new Date().getTime() - moved < 100) {
      dispatch("highlight", { id, deselectOthers: !e.ctrlKey, deselect: true });
    }
  };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<circle
  cx="{x}"
  cy="{y}"
  r="10"
  stroke="black"
  stroke-width="{highlight ? '2px' : '1px'}"
  fill="{color}"
  on:mousedown="{() => move()}"
  on:mouseup={() => stop()}
  on:click="{(e) => click(e)}"
></circle>