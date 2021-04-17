<script>
  export let selectedColor;
  const colorsL = ["red", "green"];
  const colorsR = ["blue", "yellow"];
</script>

<div>
  <div class="left">
    {#each colorsL as color}
      <div
        class="picker-item"
        style="background-color: {color};"
        on:click={() => (selectedColor = color)}
      />
    {/each}
  </div>
  <div class="right">
    {#each colorsR as color}
      <div
        class="picker-item"
        style="background-color: {color};"
        on:click={() => (selectedColor = color)}
      />
    {/each}
  </div>
</div>

<style>
  .left {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translate(-100%, -50%);
    display: flex;
  }
  .right {
    position: absolute;
    top: 50%;
    right: 0;
    transform: translate(100%, -50%);
    display: flex;
  }
  .picker-item {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: yellow;
  }
</style>
