<script>
  import { roomState, roundSummary, dismissRoundSummary } from './lib/connection.js'
  import Lobby from './components/Lobby.svelte'
  import Board from './components/Board.svelte'
  import RoundOver from './components/RoundOver.svelte'
</script>

<main>
  {#if $roomState?.started}
    <Board view={$roomState} />
  {:else}
    <Lobby view={$roomState} />
  {/if}

  {#if $roundSummary}
    <RoundOver summary={$roundSummary} onclose={dismissRoundSummary} />
  {/if}
</main>
