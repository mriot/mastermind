<script>
  import ColorPicker from "./ColorPicker.svelte";
  import { clickOutside } from "./util/clickOutside.js";

  export let active = false;
  export let selectedColor = "";
  export let pickerOpen = false;
</script>

<div
  class="color-button"
  class:inactive={!active}
  style="background-color: {selectedColor}"
  use:clickOutside
  on:click={() => (pickerOpen = !pickerOpen)}
  on:clickoutside={() => (pickerOpen = false)}
>
  {#if pickerOpen && active}
    <ColorPicker bind:selectedColor />
  {/if}
</div>

<style>
  .color-button {
    cursor: pointer;
    width: 50px;
    height: 50px;
    background-color: #888;
    border-radius: 50%;
    position: relative;
  }

  .inactive {
    pointer-events: none;
  }
</style>
