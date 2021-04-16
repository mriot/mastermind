<script>
  export let label = "[No Value]";
</script>

<button>
  {label}
</button>

<style>
  button {
    outline: none;
    color: var(--color-secondary);
    font-size: 17px;
    padding: 10px;
    margin: 10px auto;
    border: none;
    background-color: var(--color-accent-2);
    cursor: pointer;
    border-radius: 10px;
    box-shadow: 0 1px 0 #222, 1px 2px 0 #222, 3px 4px 0 #222;
    transition: all 100ms;
  }

  button:active {
    box-shadow: none;
    transform: translate(4px, 4px);
  }
</style>
