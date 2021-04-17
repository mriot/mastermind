<script>
  import ColorPicker from "./ColorPicker.svelte";

  let pickerOpen = false;
  let selectedColor = "";
</script>

<div
  class="color-button"
  style="background-color: {selectedColor}"
  on:mouseenter={() => (pickerOpen = true)}
  on:mouseleave={() => (pickerOpen = false)}
>
  {#if pickerOpen}
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
</style>
