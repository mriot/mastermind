<script>
  import Gameboard from "./Gameboard.svelte";
  import Header from "./Header.svelte";
</script>

<div id="app">
  <Header />
  <Gameboard />
</div>

<style>
  #app {
    color: var(--color-secondary);
  }
</style>
