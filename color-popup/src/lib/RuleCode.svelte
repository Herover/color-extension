<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Rule } from "./rule";


  export let rules: Rule[] = [];
  export let highlighted = {};

  let searchFor = "";

  $: rulesFiltered = rules.filter(e => e.selector.includes(searchFor));

  const dispatch = createEventDispatcher<{
    highlight: HighlightEvent,
  }>();
</script>

<div class="code">
  <input bind:value="{searchFor}" placeholder="Selector filter"/>
  {#each rulesFiltered as rule}
    <div class="code-line">{rule.selector} &#123;</div>
    {#each rule.properties as property}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        class="code-line"
        class:highlight="{highlighted[property.swatchId]}"
        on:dblclick="{() => dispatch("highlight", { id: property.swatchId, deselect: true, deselectOthers: false })}"
        on:click="{(e) => e.ctrlKey && dispatch("highlight", { id: property.swatchId, deselect: true, deselectOthers: false })}"
      >
      &nbsp;&nbsp;{property.key}: {property.value};<div class="color-indicator" style="background-color: {property.value}"></div>
    </div>
    {/each}
    <div class="code-line">&#125;</div>
  {/each}
</div>

<style>
  .color-indicator {
    height: 14px;
    width: 42px;
    border: 1px solid #333;
    border-radius: 4px;
    display: inline-block;
    margin-left: 4px;
  }
  .highlight .color-indicator {
    border: 2px solid #333;
  }
  .code-line.highlight {
    font-weight: bold;
  }
  .code .code-line {
    font-family: monospace;
    width: 100%;
  }
</style>