<script>
  export let result = {};

  let rightGuessPins = 0;
  let rightColorsPins = 0;

  $: {
    rightGuessPins = result.rightGuesses ?? 0;
    rightColorsPins = result.goodColors ?? 0;
  }
</script>

<div id="wrapper">
  {#each Array(rightColorsPins) as _}
    <div class="pin right-color" />
  {/each}
  {#each Array(rightGuessPins) as _}
    <div class="pin right-guess" />
  {/each}
  {#each Array(4 - rightColorsPins - rightGuessPins) as _}
    <div class="pin" />
  {/each}
</div>

<style>
  #wrapper {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px;
  }

  .pin {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: black;
  }

  .right-color {
    background-color: green;
  }

  .right-guess {
    background-color: white;
  }
</style>
