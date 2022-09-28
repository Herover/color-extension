<script>
  import chroma from 'chroma-js';
  import { onMount } from 'svelte';
  import ColorWheel from './lib/ColorWheel.svelte'
  import SwatchList from './lib/SwatchList.svelte';

  let swatch = [
    { hsl: "hsl(32, 100%, 50%)", color: "#ff8800" },
    { hsl: "hsl(210, 65.4%, 20.4%)", color: "#123456" },
    { hsl: "hsl(0, 0%, 0%)", color: "#000000" },
  ];

  let rules = [];
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
  };

 /*  onMount(async () => {
    console.log("onMount")
    const response = await chrome.runtime.sendMessage({ action: "getRules" });
    console.log("rules", response)
    rules = response.rules;
  }); */

  $: filteredRules = rules.filter(r => r.properties.length != 0);
</script>

<main>
  <ColorWheel colors="{swatch}"/>
  <SwatchList swatch={swatch}/>
  <button on:click="{selectItem}">Select item</button>
  <button on:click="{updateRules}">Get rules</button>
  <ul>
    {#each filteredRules as rule}
      <li>{rule.selector} {rule.properties.length}
        <ul>
          {#each rule.properties as property}
            <li>{property.key}: {property.value} ({property.swatchId})
              <div class="color-indicator" style="background-color: {property.value}"></div>
            </li>
          {/each}
        </ul>
      </li>
    {/each}
  </ul>
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
  }
</style>
