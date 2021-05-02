<script>
  import ColorButton from "./ColorButton.svelte";
  import GuessInfo from "./GuessInfo.svelte";
  import { currentStep, game } from "./store";

  export let lineNumber = 0;
  export let active = false;

  let color1;
  let color2;
  let color3;
  let color4;

  let result;

  $: {
    if (color1 && color2 && color3 && color4) {
      // console.log(color1);
      // console.log(color2);
      // console.log(color3);
      // console.log(color4);

      result = $game.validateGuess([
        color1.name,
        color2.name,
        color3.name,
        color4.name
      ]);
      console.log(result);

      if (result.rightGuesses !== 4) {
        currentStep.update(current => current + 1);
      } else {
        $game.win();
      }
    }
  }
</script>

<div id="gamerow" class:active>
  <aside>{lineNumber}</aside>
  <main>
    <ColorButton bind:selectedColor={color1} {active} />
    <ColorButton bind:selectedColor={color2} {active} />
    <ColorButton bind:selectedColor={color3} {active} />
    <ColorButton bind:selectedColor={color4} {active} />
  </main>
  <aside>
    <GuessInfo {result} />
  </aside>
</div>

<style>
  #gamerow {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.1);
    opacity: 0.3;
    border-bottom: 1px solid #0a0a0a;
    border-radius: 10px;
    margin: 5px 0;
    padding: 5px 15px;
  }

  #gamerow:hover {
    background-color: rgba(100, 100, 100, 0.1);
  }

  #gamerow.active {
    opacity: 1;
  }

  main {
    flex: 1;
    display: flex;
    justify-content: space-evenly;
  }
</style>
