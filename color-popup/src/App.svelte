<script>
  import { onMount } from 'svelte';
  import HSLWheel from './lib/HSLWheel.svelte'

  let rules = [];
  const selectItem = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: "getElement" });

    console.log("response", response);
    //testData = JSON.stringify(response);
  };

  const updateRules = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const response = await chrome.tabs.sendMessage(tab.id, { action: "updateRules" });

    console.log("response", response);
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
  <HSLWheel />
  <button on:click="{selectItem}">Select item</button>
  <button on:click="{updateRules}">Get rules</button>
  <ul>
    {#each filteredRules as rule}
      <li>{rule.selector} {rule.properties.length}
        <ul>
          {#each rule.properties as property}
            <li>{property.key}: {property.value}
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
