<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Rule } from "./rule";


  export let rules: Rule[] = [];
  export let highlighted = {};

  const dispatch = createEventDispatcher<{
    highlight: HighlightEvent,
  }>();
</script>

<div class="code">
  {#each rules as rule}
    <div class="code-line">{rule.selector} &#123;</div>
    {#each rule.properties as property}
      <div
        class="code-line"
        class:highlight="{highlighted[property.swatchId]}"
        on:dblclick="{() => dispatch("highlight", { id: property.swatchId })}"
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