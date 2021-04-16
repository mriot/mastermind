<script>
  import ColorButton from "./ColorButton.svelte";
  import GuessInfo from "./GuessInfo.svelte";

  export let lineNumber = 0;
</script>

<div id="gamerow">
  <aside>{lineNumber}</aside>
  <main>
    <ColorButton />
    <ColorButton />
    <ColorButton />
    <ColorButton />
  </main>
  <aside>
    <GuessInfo />
  </aside>
</div>

<style>
  #gamerow {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid #0a0a0a;
    border-radius: 10px;
    margin: 5px 0;
    padding: 5px 15px;
  }

  #gamerow:hover {
    background-color: rgba(100, 100, 100, 0.1);
  }

  main {
    flex: 1;
    display: flex;
    justify-content: space-evenly;
  }
</style>
