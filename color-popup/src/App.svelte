<script lang="ts">
  import chroma from 'chroma-js';
  import { onMount } from 'svelte';
  import ColorWheel from './lib/ColorWheel.svelte'
  import SwatchList from './lib/SwatchList.svelte';
  import * as storage from './lib/storage';
  import RuleCode from './lib/RuleCode.svelte';
  import type { SwatchColor } from './lib/swatch';
  import type { Rule } from './lib/rule';
  import type { SiteData } from './lib/data';

  let siteKey = "";
  let swatchID = "";

  let tabSiteData: SiteData = {
    swatches: [],
    rules: [],
    ordinal: [],
  };

  $: activeSwatch = tabSiteData.swatches.find(s => s.id == swatchID);

  $: activeRules = tabSiteData.rules.map(r => ({
    selector: r.selector,
    properties: r.properties.map(p => ({
      key: p.key,
      swatchId: p.swatchId,
      value: activeSwatch.swatch.find(s => s.id == p.swatchId).color,
    }))
  })) as Rule[];

  let highlightedSwatchItems = {};

  const selectItem = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: "getElement" });

    console.log("response", response);
  };

  const createSwatchFromRules = (rules): SwatchColor[] => {
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
    const id = tabSiteData.swatches.length + "";
    tabSiteData.swatches.push({
      id,
      name: "Default",
      swatch,
    });
    swatchID = id;
    tabSiteData.rules = response.rules;
  };
  const updateVariables = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: "updateVariables" });

    console.log("response", response);
    const id = tabSiteData.swatches.length + "";
    const swatch = createSwatchFromRules(response.rules).
      // @ts-ignore
      sort((a, b) => chroma(b.hsl).hsl[0] - chroma(a.hsl).hsl[0]);
    tabSiteData.swatches[0] = {
      id,
      name: "Default",
      swatch,
    }
    swatchID = id;
    tabSiteData.rules = response.rules;
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
    tabSiteData = siteData || {
      swatches: [],
      rules: [],
      ordinal: [],
    };

    if (siteData) {
      swatchID = "0"; // TODO: use tab data
    }

    if (response.res && response.res.length != 0) {
      response.res.forEach(messageData => {
        switch (messageData.action) {
          case "registerOrdinal":
            if (tabSiteData.swatches.find(o => o.id == messageData.name)) {
              // If we already have this swatch, don't re-register it automatically
              console.warn("ignoring " + messageData.action)
              break;
            }
            const message = messageData as MessageRegisterOrdinal;
            swatchID = messageData.name;
            
            tabSiteData.ordinal = message.colors;
            tabSiteData.swatches.push({
              id: swatchID,
              name: messageData.name,
              swatch: message.colors.map((color, i) => ({
                color: color.color,
                id: color.key,
                hsl: chroma(color.color).css("hsl"),
              })),
            });
            break;
        
          default:
            console.log("Unknown message type", messageData);
            break;
        }
      });
    }

    await sendCurrentSwatch();
    // FIXME: data seems to gete deleted unless saved at least once?
    await storage.setSiteData(siteKey, tabSiteData);
  });

  $: filteredRules = activeRules.filter(r => r.properties.length != 0);

  const updateSwatchItem = async (event: CustomEvent<UpdateColorEvent>) => {
    const { id, hslColor } = event.detail;
    const swatchIndex = activeSwatch.swatch.findIndex(e => e.id == id);
    if (swatchIndex == -1) {
      console.warn("Updating non-existing swatch item", id, event);
      return;
    }
    activeSwatch.swatch[swatchIndex].color = hslColor;
    activeSwatch.swatch[swatchIndex].hsl = hslColor;

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    let ruleIndex = -1;
    let propertyIndex = -1;
    for (let groupIndex = 0; groupIndex < activeRules.length; groupIndex++) {
      const ruleGroup = activeRules[groupIndex];
      propertyIndex = ruleGroup.properties.findIndex(e => e.swatchId == id);
      if (propertyIndex != -1) {
        ruleIndex = groupIndex;
        break;
      }
    }
    if (ruleIndex != -1 && propertyIndex != -1) {
      activeRules[ruleIndex].properties[propertyIndex].value = hslColor;

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "setCSSRule",
        selector: activeRules[ruleIndex].selector,
        key: activeRules[ruleIndex].properties[propertyIndex].key,
        value: activeRules[ruleIndex].properties[propertyIndex].value,
      });
    }

    // TODO: Only do this if used on a javascript integrated webpage, use registration name
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "setColors",
      colors: activeSwatch.swatch.map(s => ({
        key: s.id,
        color: s.color,
      })),
    });

    await storage.setSiteData(siteKey, tabSiteData);
  };

  const sendCurrentSwatch = async () => {
    if (!activeSwatch) {
      return;
    }
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    activeRules.map(async rule => {
      rule.properties.map(async property => {
        await chrome.tabs.sendMessage(tab.id, {
          action: "setCSSRule",
          selector: rule.selector,
          key: property.key,
          value: property.value,
        });
      });
    });

    // TODO: Only do this if used on a javascript integrated webpage, use registration name
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "setColors",
      colors: activeSwatch.swatch.map(s => ({
        key: s.id,
        color: s.color,
      })),
    });
  }

  const toggleHighlight = (id: string) => {
    if (highlightedSwatchItems[id]) {
      highlightedSwatchItems[id] = false;
    } else {
      highlightedSwatchItems[id] = true;
    }
  };

  const selectSwatch = async (id: string) => {
    swatchID = id;

    // Use a timeout in order so that Svelte update dependents on swatchID
    setTimeout(() => sendCurrentSwatch(), 1);
  };

  const newSwatch = () => {
    const newId = tabSiteData.swatches.length + "";
    tabSiteData.swatches.push({
      id: newId,
      name: tabSiteData.swatches.length + "",
      swatch: activeSwatch.swatch.map(e => ({
        id: e.id,
        color: e.color,
        hsl: e.hsl,
      })),
    });
    tabSiteData = tabSiteData;
    selectSwatch(newId);
  };
</script>

<main>
  <button on:click="{selectItem}">Select item</button>
  <button on:click="{updateRules}">Get rules</button>
  <button on:click="{updateVariables}">Get variables only</button>
  <button on:click="{removeData}">Clear store</button>
  <br>
  <p>Swatches for site</p>
  {#each tabSiteData.swatches as swatch}
    <button on:click={() => selectSwatch(swatch.id)}>
      {#if swatchID == swatch.id}
        <b>{swatch.name}</b>
      {:else}
        {swatch.name}
      {/if}
    </button>
  {/each}
  <button on:click={newSwatch}>+</button>
  <br>
  {#if (typeof activeSwatch != "undefined")}
    <ColorWheel
      colors="{activeSwatch.swatch}"
      highlighted="{highlightedSwatchItems}"
      on:updateColor="{updateSwatchItem}"
      on:highlight="{(e) => toggleHighlight(e.detail.id)}"
    />
    <SwatchList
      swatch={activeSwatch.swatch}
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
