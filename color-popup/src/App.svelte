<script>
  import chroma from 'chroma-js';
  import { onMount } from 'svelte';
  import ColorWheel from './lib/ColorWheel.svelte'
  import SwatchList from './lib/SwatchList.svelte';
  import * as storage from './lib/storage';

  let swatch = [
    // { hsl: "hsl(32, 100%, 50%)", color: "#ff8800" },
    // { hsl: "hsl(210, 65.4%, 20.4%)", color: "#123456" },
    // { hsl: "hsl(0, 0%, 0%)", color: "#000000" },
  ];

  let rules = [];

  let highlightedSwatchItems = {};

  const selectItem = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: "getElement" });

    console.log("response", response);
    //testData = JSON.stringify(response);
  };

  const createSwatchFromRules = (rules) => {
    const swatch = [];
    rules.forEach(rule => {
      rule.properties.forEach(property => {
        const color = chroma(property.value).css("hsl");
        let swatchIndex = swatch.findIndex(e => e.hsl == color);
        if (swatchIndex == -1) {
          swatchIndex = swatch.length;
          swatch.push({
            hsl: color,
            color: property.value,
            id: swatchIndex,
          });
        }

        property.swatchId = swatchIndex;
      })
    });

    return swatch;
  };

  const updateRules = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: "updateRules" });

    console.log("response", response);
    swatch = createSwatchFromRules(response.rules);
    rules = response.rules;
    storage.setValue(storage.RULES, rules);
    storage.setValue(storage.SWATCH, swatch);
  };
  const updateVariables = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: "updateVariables" });

    console.log("response", response);
    swatch = createSwatchFromRules(response.rules).sort((a, b) => chroma(b.hsl).hsl[0] - chroma(a.hsl).hsl[0]);
    rules = response.rules;
    storage.setValue(storage.RULES, rules);
    storage.setValue(storage.SWATCH, swatch);
  };

  const removeData = async () => {
    storage.clear(storage.RULES);
    storage.clear(storage.SWATCH);
  }

  onMount(async () => {
    const data = await storage.getValues([ storage.RULES, storage.SWATCH ]);
    rules = data[storage.RULES] || rules;
    swatch = (data[storage.SWATCH] || swatch).sort((a, b) => chroma(b.hsl).hsl[0] - chroma(a.hsl).hsl[0]);;
  });

  $: filteredRules = rules.filter(r => r.properties.length != 0);

  const updateSwatchItem = async (event) => {
    const { id, hslColor } = event.detail;
    const swatchIndex = swatch.findIndex(e => e.id == id);
    if (swatchIndex == -1) {
      console.warn("Updating non-existing swatch item", id, event);
      return;
    }
    swatch[swatchIndex].color = hslColor;
    swatch[swatchIndex].hsl = hslColor;

    let ruleIndex = -1;
    let propertyIndex = -1;
    for (let groupIndex = 0; groupIndex < rules.length; groupIndex++) {
      const ruleGroup = rules[groupIndex];
      propertyIndex = ruleGroup.properties.findIndex(e => e.swatchId == id);
      if (propertyIndex != -1) {
        ruleIndex = groupIndex;
        break;
      }
    }
    if (ruleIndex == -1 || propertyIndex == -1) {
      console.warn("Updating non-existing rule item", id, event);
      return;
    }
    rules[ruleIndex].properties[propertyIndex].value = hslColor;

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "setCSSRule",
      selector: rules[ruleIndex].selector,
      key: rules[ruleIndex].properties[propertyIndex].key,
      value: rules[ruleIndex].properties[propertyIndex].value,
    });
  };

  const toggleHighlight = (event) => {
    if (highlightedSwatchItems[event.detail.id]) {
      highlightedSwatchItems[event.detail.id] = false;
    } else {
      highlightedSwatchItems[event.detail.id] = true;
    }
  };
</script>

<main>
  <button on:click="{selectItem}">Select item</button>
  <button on:click="{updateRules}">Get rules</button>
  <button on:click="{updateVariables}">Get variables only</button>
  <button on:click="{removeData}">Clear store</button>
  <ColorWheel
    colors="{swatch}"
    highlighted="{highlightedSwatchItems}"
    on:updateColor="{updateSwatchItem}"
    on:highlight="{toggleHighlight}"
  />
  <SwatchList
    swatch={swatch}
    highlighted="{highlightedSwatchItems}"
    on:highlight="{toggleHighlight}"
  />
  <div class="code">
    {#each filteredRules as rule}
      <div class="code-line">{rule.selector} &#123;</div>
      {#each rule.properties as property}
        <div
          class="code-line"
          class:highlight="{highlightedSwatchItems[property.swatchId]}"
          on:dblclick={() => toggleHighlight({detail: { id: property.swatchId }})}
        >
        &nbsp;&nbsp;{property.key}: {property.value};<div class="color-indicator" style="background-color: {property.value}"></div>
      </div>
      {/each}
      <div class="code-line">&#125;</div>
    {/each}
  </div>
</main>

<style>
  main {
    text-align: left;
  }
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
