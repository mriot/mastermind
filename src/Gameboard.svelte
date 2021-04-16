<script>
  import Button from "./common/Button.svelte";
</script>

<div id="gameboard">
  <nav>
    <Button label="Pause" />
    <Button label="Reset" />
    <Button label="Rules" />
    <Button label="Highscore" />
    <Button label="About" />
  </nav>
  <section>
    <aside>
      <!-- lines -->
    </aside>
    <main />
    <aside>
      <!-- guess info -->
    </aside>
  </section>
</div>

<style>
  #gameboard {
    display: grid;
  }
</style>
