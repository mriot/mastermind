<script>
  import { backInOut } from "svelte/easing";

  import { scale, fly } from "svelte/transition";

  export let selectedColor;
  const colorsL = ["red", "green", "purple"];
  const colorsR = ["blue", "yellow", "brown"];
</script>

<div>
  <div
    class="container left"
    out:scale
    in:fly={{
      x: 25,
      opacity: 0,
      delay: 0,
      easing: backInOut
    }}
  >
    {#each colorsL as color, i}
      <div
        class="picker-item"
        style="background-color: {color};"
        on:click={() => (selectedColor = color)}
      />
    {/each}
  </div>
  <div
    class="container right"
    out:scale
    in:fly={{
      x: -25,
      opacity: 0,
      delay: 0,
      easing: backInOut
    }}
  >
    {#each colorsR as color, i}
      <div
        class="picker-item"
        style="background-color: {color};"
        on:click={() => (selectedColor = color)}
      />
    {/each}
  </div>
</div>

<style>
  .container {
    position: absolute;
    top: 50%;
    display: flex;
    padding: 10px 60%;
    gap: 5px;
    /* outline: 1px dashed red; */
  }

  .left {
    left: 50%;
    transform: translate(-100%, -50%);
  }
  .right {
    right: 50%;
    transform: translate(100%, -50%);
  }

  .picker-item {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: yellow;
    z-index: 1;
    box-shadow: 2px 2px 2px #222;
    transition: transform 100ms;
  }

  .picker-item:hover {
    z-index: 20;
    transform: scale(1.2);
  }
</style>
