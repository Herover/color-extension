<script lang="ts">
  import chroma from 'chroma-js';
  import { onMount } from 'svelte';
  import ColorWheel from './lib/ColorWheel.svelte'
  import SwatchList from './lib/SwatchList.svelte';
  import * as storage from './lib/storage';
  import RuleCode from './lib/RuleCode.svelte';
  import type { SwatchColor } from './lib/swatch';
  import type { Rule } from './lib/rule';
  import type { SiteData, SiteSwatch } from './lib/data';
  import ColorSlider from './lib/ColorSlider.svelte';
  import { getHSLAString } from './lib/util';

  let siteKey = "";
  let swatchID = "";

  let tabSiteData: SiteData = {
    swatches: [],
    rules: [],
    ordinal: [],
  };

  $: activeSwatch = tabSiteData.swatches.find(s => s.id == swatchID);

  $: activeRules = swatchID ? getRules(activeSwatch) : [] as Rule[];

  let highlightedSwatchItems = {};

  const getRules = (swatch: SiteSwatch): Rule[] => tabSiteData.rules.map(r => ({
    selector: r.selector,
    properties: r.properties.map(p => ({
      key: p.key,
      swatchId: p.swatchId,
      value: swatch.swatch.find(s => s.id == p.swatchId).color,
    }))
  }));

  const selectItem = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: "getElement" });

    console.log("response", response);
  };

  const createSwatchFromRules = (rules): SwatchColor[] => {
    const swatch: SwatchColor[] = [];
    rules.forEach(rule => {
      rule.properties.forEach(property => {
        const chromaColor = chroma(property.value);
        const [hue, saturation, value] = chromaColor.hsv();
        const alpha = chromaColor.alpha();
        // TODO: compare colors in different formats correctly?
        let swatchIndex = swatch.findIndex(e => e.color == property.value);
        if (swatchIndex == -1) {
          swatchIndex = swatch.length;
          swatch.push({
            color: property.value,
            id: swatchIndex + "",
            hue: hue || 0,
            saturation,
            value,
            alpha,
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
      name: "Root",
      swatch,
    });
    swatchID = id;
    tabSiteData.rules = response.rules;

    await updateTabConfig();
  };
  const updateVariables = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: "updateVariables" });

    console.log("response", response);
    const id = tabSiteData.swatches.length + "";
    const swatch = createSwatchFromRules(response.rules);
    tabSiteData.swatches[0] = {
      id,
      name: "Root",
      swatch,
    }
    swatchID = id;
    tabSiteData.rules = response.rules;

    await updateTabConfig();
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

    const siteData = await storage.getSiteData(siteKey);
    tabSiteData = siteData || {
      swatches: [],
      rules: [],
      ordinal: [],
    };

    const tabData = await storage.getTabData();

    swatchID = tabData.tabToSwatchId["" + tab.id] || "";

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
              swatch: message.colors.map((color, i) => {
                const chromaColor = chroma(color.color);
                const [hue, saturation, value] = chromaColor.hsv();

                return {
                  color: color.color,
                  id: color.key,
                  hsl: chromaColor.css("hsl"),
                  hue: hue || 0,
                  saturation,
                  value,
                  alpha: chromaColor.alpha(),
                };
              }),
            });
            break;
        
          default:
            console.log("Unknown message type", messageData);
            break;
        }
      });
    }

    // sendCurrentSwatch needs activeSwatch to be calculated, which doesn't happen before we exit
    // this function, use a timeout to wait for it to happen before sending swatch
    setTimeout(() => sendSwatch(activeSwatch), 1);
    // FIXME: data seems to gete deleted unless saved at least once?
    await storage.setSiteData(siteKey, tabSiteData);
    await updateTabConfig();
  });

  $: filteredRules = activeRules.filter(r => r.properties.length != 0);

  const updateSwatchItem = async (event: CustomEvent<UpdateColorEvent>) => {
    console.log(event.detail)
    const { id, hslColor, hue, saturation, value, alpha } = event.detail;

    const swatchIndex = activeSwatch.swatch.findIndex(e => e.id == id);
    if (swatchIndex == -1) {
      console.warn("Updating non-existing swatch item", id, event);
      return;
    }

    const dHue = activeSwatch.swatch[swatchIndex].hue - hue;
    const dSaturation = activeSwatch.swatch[swatchIndex].saturation - saturation;
    const dValue = activeSwatch.swatch[swatchIndex].value - value;
    const dAlpha = activeSwatch.swatch[swatchIndex].alpha - alpha;

    const updateSwatch = (swatch: SiteSwatch, ids: string[]) => {
      
      ids.forEach(sId => {
        const selectedSwatchIndex = swatch.swatch.findIndex(e => e.id == sId);

        // Calculate new values, but clamp them within allowed ranges
        const newHue = (swatch.swatch[selectedSwatchIndex].hue - dHue + 360) % 360;
        const newSaturation = swatch.swatch[selectedSwatchIndex].saturation - dSaturation;
        const newValue = swatch.swatch[selectedSwatchIndex].value - dValue;
        const newAlpha = swatch.swatch[selectedSwatchIndex].alpha - dAlpha;

        swatch.swatch[selectedSwatchIndex].color = getHSLAString(newHue, newSaturation, newValue, newAlpha);
        swatch.swatch[selectedSwatchIndex].hue = newHue;
        swatch.swatch[selectedSwatchIndex].saturation = newSaturation;
        swatch.swatch[selectedSwatchIndex].value = newValue;
        swatch.swatch[selectedSwatchIndex].alpha = newAlpha;
      });

      /* activeSwatch.swatch[swatchIndex].color = hslColor;
      activeSwatch.swatch[swatchIndex].hue = hue;
      activeSwatch.swatch[swatchIndex].saturation = saturation;
      activeSwatch.swatch[swatchIndex].value = value;
      activeSwatch.swatch[swatchIndex].alpha = alpha; */
    };

    const swatchItemIDs = Object.keys(highlightedSwatchItems).reduce((acc, id) => {
      if (highlightedSwatchItems[id]) {
        acc.push(id);
      }
      return acc;
    }, []);
    if (!swatchItemIDs.includes(id)) { swatchItemIDs.push(id); }

    const recurseSwatches = (currentSwatch) => {
      updateSwatch(currentSwatch, swatchItemIDs);
      tabSiteData.swatches.forEach(swatch => {
        if (swatch.dependsOn == currentSwatch.id) {
          recurseSwatches(swatch);
        }
      });
    };
    recurseSwatches(activeSwatch);

    tabSiteData = tabSiteData;

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const currentTabURL = await chrome.tabs.sendMessage(tab.id, {
      action: "getURL",
    });

    const tabs = await chrome.tabs.query({ url: currentTabURL.res });
    const tabData = await storage.getTabData();

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

      tabs.forEach(async tab => {
        if (!tabData.tabToSwatchId["" + tab.id]) {
          return;
        }
        const swatch = tabSiteData.swatches.find(e => e.id == tabData.tabToSwatchId["" + tab.id]);
        sendSwatch(swatch, tab.id, activeRules[ruleIndex].properties[propertyIndex].swatchId);
      });
    }

    // TODO: Only do this if used on a javascript integrated webpage, use registration name
    tabs.forEach(async tab => {
      if (!tabData.tabToSwatchId["" + tab.id]) {
        return;
      }
      const swatch = tabSiteData.swatches.find(e => e.id == tabData.tabToSwatchId["" + tab.id]);
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "setColors",
        colors: swatch.swatch.map(s => ({
          key: s.id,
          color: s.color,
        })),
      });
    });

    await storage.setSiteData(siteKey, tabSiteData);
  };

  /**
   * Sends swatch colors to given or current tab
   * @param swatch Swatch to update from
   * @param tabId Optional tabId to message, when no value is given use current active
   * @param swatchId Optional swatch color id to update, if none given update all (only for css)
   */
  const sendSwatch = async (swatch: SiteSwatch, tabId?: number, swatchId?: string) => {
    if (!swatch) {
      return;
    }

    if (typeof tabId == "undefined") {
      let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      tabId = tab.id;
    }

    await updateTabConfig();

    const rules = getRules(swatch);

    // TODO: Consider only sending changed rules
    rules.map(async rule => {
      rule.properties.map(async property => {
        if (typeof swatchId != "undefined" && property.swatchId != swatchId) {
          return;
        }
        await chrome.tabs.sendMessage(tabId, {
          action: "setCSSRule",
          selector: rule.selector,
          key: property.key,
          value: property.value,
        });
      });
    });

    // TODO: Only do this if used on a javascript integrated webpage, use registration name
    const response = await chrome.tabs.sendMessage(tabId, {
      action: "setColors",
      colors: swatch.swatch.map(s => ({
        key: s.id,
        color: s.color,
      })),
    });
  }

  /**
   * Saves data related to tabs, call every time some meta-data that this tab might want to recover
   * later changes.
  */
  const updateTabConfig = async () => {

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tab.id;

    const tabData = await storage.getTabData();
    tabData.tabToSwatchId["" + tabId] = swatchID;
    return await storage.setTabData(tabData);
  };

  const toggleHighlight = (id: string | undefined, deselectAll: boolean, deselect: boolean) => {
    if (deselectAll) {
      Object
        .keys(highlightedSwatchItems)
        .forEach(key => key != id && (highlightedSwatchItems[key] = false));
    }

    console.log("id", id, typeof id)
    if (typeof id != "string") {
      return;
    }

    if (highlightedSwatchItems[id]) {
      if (deselect) {
        highlightedSwatchItems[id] = false;
      }
    } else {
      highlightedSwatchItems[id] = true;
    }
  };

  const selectSwatch = async (id: string) => {
    swatchID = id;

    await updateTabConfig();

    // Use a timeout in order so that Svelte update dependents on swatchID
    setTimeout(() => sendSwatch(activeSwatch), 1);
  };

  const newSwatch = (isDependent: boolean) => {
    const newId = tabSiteData.swatches.length + "";
    tabSiteData.swatches.push({
      id: newId,
      name: tabSiteData.swatches.length + "",
      swatch: activeSwatch.swatch.map(e => ({
        id: e.id,
        color: e.color,
        hue: e.hue,
        saturation: e.saturation,
        value: e.value,
        alpha: e.alpha,
      })),
      dependsOn: isDependent ? activeSwatch.id : null,
    });
    tabSiteData = tabSiteData;
    selectSwatch(newId);
  };

  const nameOfSwatch = (swatchID: string) => {
    return tabSiteData.swatches.find(swatch => swatch.id == swatchID).name;
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
      {#if swatch.dependsOn}
        <i>({nameOfSwatch(swatch.dependsOn)})</i>
      {/if}
    </button>
  {/each}
  <br>
  <button on:click={() => newSwatch(false)}>+ copy</button>
  <button on:click={() => newSwatch(true)}>+ depend</button>
  <br>
  {#if (typeof activeSwatch != "undefined")}
    <ColorWheel
      colors="{activeSwatch.swatch}"
      highlighted="{highlightedSwatchItems}"
      on:updateColor="{updateSwatchItem}"
      on:highlight="{(e) => toggleHighlight(e.detail.id, e.detail.deselectOthers, e.detail.deselect)}"
    />
    <p>Value</p>
    <ColorSlider
      colors="{activeSwatch.swatch}"
      highlighted="{highlightedSwatchItems}"
      on:updateColor="{updateSwatchItem}"
      on:highlight="{(e) => toggleHighlight(e.detail.id, e.detail.deselectOthers, e.detail.deselect)}"
    />
    <SwatchList
      swatch={activeSwatch.swatch}
      highlighted="{highlightedSwatchItems}"
      on:highlight="{(e) => toggleHighlight(e.detail.id, e.detail.deselectOthers, e.detail.deselect)}"
    />
    <RuleCode
      rules="{filteredRules}"
      highlighted="{highlightedSwatchItems}"
      on:highlight="{(e) => toggleHighlight(e.detail.id, e.detail.deselectOthers, e.detail.deselect)}"
    />
  {/if}
</main>

<style>
  main {
    text-align: left;
  }
</style>
