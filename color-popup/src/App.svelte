<script lang="ts">
  import chroma from 'chroma-js';
  import { onDestroy, onMount } from 'svelte';
  import ColorWheel from './lib/ColorWheel.svelte'
  import SwatchList from './lib/SwatchList.svelte';
  import * as storage from './lib/storage';
  import RuleCode from './lib/RuleCode.svelte';
  import type { Swatch } from './lib/swatch';
  import type { Rule } from './lib/rule';
  import type { SiteData, SiteSwatch } from './lib/data';

  let siteKey = "";

  let tabSiteData: SiteData | undefined;
  let swatches: SiteSwatch | undefined;

  let rules: Rule[] = [];

  let ordinalScale = [];

  let highlightedSwatchItems = {};

  const selectItem = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: "getElement" });

    console.log("response", response);
    //testData = JSON.stringify(response);
  };

  const createSwatchFromRules = (rules): Swatch[] => {
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

        property.swatchId = "" + swatchIndex;
      })
    });

    return swatch;
  };

  const updateRules = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: "updateRules" });

    console.log("response", response);
    const swatch = createSwatchFromRules(response.rules);
    swatches = {
      id: "0",
      name: "Default",
      swatch,
    }
    rules = response.rules;
    //storage.setValue(storage.RULES, rules);
    //storage.setValue(storage.SWATCH, swatch);
  };
  const updateVariables = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: "updateVariables" });

    console.log("response", response);
    const swatch = createSwatchFromRules(response.rules).
      // @ts-ignore
      sort((a, b) => chroma(b.hsl).hsl[0] - chroma(a.hsl).hsl[0]);
    swatches = {
      id: "0",
      name: "Default",
      swatch,
    }
    rules = response.rules;
    //storage.setValue(storage.RULES, rules);
    //storage.setValue(storage.SWATCH, swatch);
  };

  const removeData = async () => {
    storage.clear(storage.RULES);
    storage.clear(storage.SWATCH);
    storage.clear(storage.ORDINAL);
  }

  onMount(async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "getMessages",
    });
    siteKey = response.origin;

    //const tabData = await storage.getTabData(tab.id);
    const siteData = await storage.getSiteData(siteKey);
    tabSiteData = siteData;

    if (siteData) {
      rules = siteData.rules || rules;
      swatches = (siteData.swatches[0] || swatches)
      swatches.swatch.sort((a, b) => chroma(b.hsl).hsl[0] - chroma(a.hsl).hsl[0]);;
      ordinalScale = siteData.ordinal || ordinalScale;
    }

    if (response.res && response.res.length != 0) {
      response.res.forEach(messageData => {
        switch (messageData.action) {
          case "registerOrdinal":
            const message = messageData as MessageRegisterOrdinal;
            ordinalScale = message.colors;
            swatches.swatch = message.colors.map((color, i) => ({
              color: color.color,
              id: color.key,
              hsl: chroma(color.color).css("hsl"),
            }));
            break;
        
          default:
            console.log("Unknown message type", messageData);
            break;
        }
      });
    }

    // FIXME: data seems to gete deleted unless saved at least once?
    return Promise.all([
      storage.setSiteData(siteKey, tabSiteData),
      //storage.setValue(storage.RULES, rules),
      //storage.setValue(storage.SWATCH, swatch),
      //storage.setValue(storage.ORDINAL, ordinalScale),
    ]);
  });

  $: filteredRules = rules.filter(r => r.properties.length != 0);

  const updateSwatchItem = async (event: CustomEvent<UpdateColorEvent>) => {
    const { id, hslColor } = event.detail;
    const swatchIndex = swatches.swatch.findIndex(e => e.id == id);
    if (swatchIndex == -1) {
      console.warn("Updating non-existing swatch item", id, event);
      return;
    }
    swatches.swatch[swatchIndex].color = hslColor;
    swatches.swatch[swatchIndex].hsl = hslColor;

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
      colors: swatches.swatch.map(s => ({
        key: s.id,
        color: s.color,
      })),
    });

    tabSiteData = {
      ordinal: ordinalScale,
      rules: rules,
      swatches: [swatches],
    }

    await storage.setSiteData(siteKey, tabSiteData);
    //storage.setValue(storage.RULES, rules);
    //storage.setValue(storage.SWATCH, swatch);
    //storage.setValue(storage.ORDINAL, ordinalScale);
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
  {#if (typeof swatches != "undefined")}
    <ColorWheel
      colors="{swatches.swatch}"
      highlighted="{highlightedSwatchItems}"
      on:updateColor="{updateSwatchItem}"
      on:highlight="{(e) => toggleHighlight(e.detail.id)}"
    />
    <SwatchList
      swatch={swatches.swatch}
      highlighted="{highlightedSwatchItems}"
      on:highlight="{(e) => toggleHighlight(e.detail.id)}"
    />
    <RuleCode
      rules="{filteredRules}"
      highlighted="{highlightedSwatchItems}"
      on:highlight="{(e) => toggleHighlight(e.detail.id)}"
    />
  {/if}
</main>

<style>
  main {
    text-align: left;
  }
</style>
