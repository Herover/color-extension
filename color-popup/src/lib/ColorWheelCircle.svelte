<script>
    import { createEventDispatcher } from "svelte";


  export let x;
  export let y;
  export let id;
  export let color;

  const dispatch = createEventDispatcher();
</script>

<circle
  cx="{x}"
  cy="{y}"
  r="10"
  stroke="black"
  fill="{color}"
  on:mousedown="{() => dispatch("move", { id })}"
  on:mouseup={() => dispatch("stop", { id })}
></circle>