<script lang="ts">
  import chroma from 'chroma-js';
  import { onDestroy, onMount } from 'svelte';
  import ColorWheel from './lib/ColorWheel.svelte'
  import SwatchList from './lib/SwatchList.svelte';
  import * as storage from './lib/storage';
  import RuleCode from './lib/RuleCode.svelte';

  let swatch: Swatch[] = [
    // { hsl: "hsl(32, 100%, 50%)", color: "#ff8800" },
    // { hsl: "hsl(210, 65.4%, 20.4%)", color: "#123456" },
    // { hsl: "hsl(0, 0%, 0%)", color: "#000000" },
  ];

  let rules: Rule[] = [];

  let ordinalScale = [];

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
    storage.clear(storage.ORDINAL);
  }

  onMount(async () => {
    const data = await storage.getValues([ storage.RULES, storage.SWATCH, storage.ORDINAL ]);
    rules = data[storage.RULES] || rules;
    swatch = (data[storage.SWATCH] || swatch).sort((a, b) => chroma(b.hsl).hsl[0] - chroma(a.hsl).hsl[0]);;
    ordinalScale = data[storage.ORDINAL] || ordinalScale;

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "getMessages",
    });
    if (response.res && response.res.length != 0) {
      response.res.forEach(message => {
        switch (message.action) {
          case "registerOrdinal":
            ordinalScale = message.colors;
            swatch = message.colors.map((color, i) => ({
              color: color.color,
              id: color.key,
              hsl: chroma(color.color).css("hsl"),
            }));
            break;
        
          default:
            console.log("Unknown message type", message);
            break;
        }
      });
    }

    // FIXME: data seems to gete deleted unless saved at least once?
    return Promise.all([
      storage.setValue(storage.RULES, rules),
      storage.setValue(storage.SWATCH, swatch),
      storage.setValue(storage.ORDINAL, ordinalScale),
    ]);
  });

  $: filteredRules = rules.filter(r => r.properties.length != 0);

  const updateSwatchItem = async (event: CustomEvent<UpdateColorEvent>) => {
    const { id, hslColor } = event.detail;
    const swatchIndex = swatch.findIndex(e => e.id == id);
    if (swatchIndex == -1) {
      console.warn("Updating non-existing swatch item", id, event);
      return;
    }
    swatch[swatchIndex].color = hslColor;
    swatch[swatchIndex].hsl = hslColor;

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

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
    if (ruleIndex != -1 && propertyIndex != -1) {
      rules[ruleIndex].properties[propertyIndex].value = hslColor;

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "setCSSRule",
        selector: rules[ruleIndex].selector,
        key: rules[ruleIndex].properties[propertyIndex].key,
        value: rules[ruleIndex].properties[propertyIndex].value,
      });
    }

    // TODO: Only do this if used on a javascript integrated webpage, use registration name
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "setColors",
      colors: swatch.map(s => ({
        key: s.id,
        color: s.color,
      })),
    });


    storage.setValue(storage.RULES, rules);
    storage.setValue(storage.SWATCH, swatch);
    storage.setValue(storage.ORDINAL, ordinalScale);
  };

  const toggleHighlight = (id: string) => {
    if (highlightedSwatchItems[id]) {
      highlightedSwatchItems[id] = false;
    } else {
      highlightedSwatchItems[id] = true;
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
    on:highlight="{(e) => toggleHighlight(e.detail.id)}"
  />
  <SwatchList
    swatch={swatch}
    highlighted="{highlightedSwatchItems}"
    on:highlight="{(e) => toggleHighlight(e.detail.id)}"
  />
  <RuleCode
    rules="{filteredRules}"
    highlighted="{highlightedSwatchItems}"
    on:highlight="{(e) => toggleHighlight(e.detail.id)}"
  />
</main>

<style>
  main {
    text-align: left;
  }
</style>
