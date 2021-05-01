<script>
  import ColorPicker from "./ColorPicker.svelte";

  export let active = false;
  export let selectedColor = "";
  let pickerOpen = false;
</script>

<div
  class="color-button"
  class:inactive={!active}
  style="background-color: {selectedColor}"
  on:mouseenter={() => (pickerOpen = true)}
  on:mouseleave={() => (pickerOpen = false)}
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
    background-color: #ccc;
    border-radius: 50%;
    position: relative;
  }

  .inactive {
    pointer-events: none;
  }
</style>
