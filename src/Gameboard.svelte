<script>
  import Button from "./common/Button.svelte";
  import Gamerow from "./Gamerow.svelte";
  import { game, currentStep } from "./store.js";

  $: {
    if (currentStep >= 10) {
      $game.gameover();
    }
  }
</script>

<div id="gameboard">
  <nav>
    <Button label="Pause" />
    <Button label="Reset" />
    <Button label="Rules" />
  </nav>
  <section>
    {#each Array(10) as _, i}
      <Gamerow lineNumber={i + 1} active={$currentStep === i} />
    {/each}
  </section>
</div>

<style>
  #gameboard {
    display: flex;
    flex-direction: column;
    max-width: 80%;
    margin: 0 auto;
  }

  nav {
    display: flex;
    /* justify-content: center; */
    gap: 15px;
    background-color: var(--color-accent-1);
  }

  section {
    margin-top: 10px;
  }
</style>
