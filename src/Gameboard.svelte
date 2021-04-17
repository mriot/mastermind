<script>
  import Button from "./common/Button.svelte";
  import Game from "./game";
  import Gamerow from "./Gamerow.svelte";

  // DEBUGGING:
  const game = new Game();
  game.start();
  game.validateGuess();
</script>

<div id="gameboard">
  <nav>
    <Button label="Pause" />
    <Button label="Reset" />
    <Button label="Rules" />
  </nav>
  <section>
    {#each Array(10) as _, i}
      <Gamerow lineNumber={i + 1} />
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
