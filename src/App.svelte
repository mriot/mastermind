<script>
	import Gameboard from "./Gameboard.svelte";
import Header from "./Header.svelte";

</script>

<style>
	#app {
		display: grid;
	}
</style>

<div id="app">
	<Header />
	<main>
		<Gameboard />
	</main>
</div>
