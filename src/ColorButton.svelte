<script>
  let pickerOpen = false;
</script>

<div
  class="color-button"
  on:mouseenter={() => (pickerOpen = true)}
  on:mouseleave={() => (pickerOpen = false)}
>
  {#if pickerOpen}
    <div class="left">
      <div class="picker-item" style="background-color: red;" />
      <div class="picker-item" style="background-color: green;" />
    </div>
    <div class="right">
      <div class="picker-item" style="background-color: blue;" />
      <div class="picker-item" style="background-color: yellow;" />
    </div>
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
