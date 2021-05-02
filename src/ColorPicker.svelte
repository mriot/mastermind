<script>
  import { backInOut } from "svelte/easing";

  import { scale, fly } from "svelte/transition";

  export let selectedColor;

  const colorsL = [
    { name: "red", value: "#ff0000" },
    { name: "green", value: "#00ff34" },
    { name: "purple", value: "#7400ff" }
  ];
  const colorsR = [
    { name: "blue", value: "#00dbff" },
    { name: "yellow", value: "#ffd700" },
    { name: "pink", value: "#ff00d7" }
  ];
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
        style="background-color: {color.value};"
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
        style="background-color: {color.value};"
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
    background-color: grey;
    z-index: 1;
    box-shadow: 2px 2px 2px #222;
    transition: transform 100ms;
  }

  .picker-item:hover {
    z-index: 20;
    transform: scale(1.2);
  }
</style>
