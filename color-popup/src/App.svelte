<script>
  import { onMount } from 'svelte';
  import svelteLogo from './assets/svelte.svg'
  import Counter from './lib/Counter.svelte'

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

  onMount(async () => {
    console.log("onMount")
    const response = await chrome.runtime.sendMessage({ action: "getRules" });
    console.log("rules", response)
    rules = response.rules;
  });

  $: filteredRules = rules.filter(r => r.properties.length != 0);
</script>

<main>
  <button on:click="{selectItem}">Select item</button>
  <button on:click="{updateRules}">Get rules</button>
  <ul>
    {#each filteredRules as rule}
      <li>{rule.selector} {rule.properties.length}
      <ul>
        {#each rule.properties as property}
        <li>{property.key}: {property.value}</li>
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
</style>
