<script>
  import { roomState, roundSummary, dismissRoundSummary } from './lib/connection.js'
  import Lobby from './components/Lobby.svelte'
  import Board from './components/Board.svelte'
  import RoundOver from './components/RoundOver.svelte'
  import GameOver from './components/GameOver.svelte'
</script>

<main class="mx-auto flex max-w-4xl flex-col gap-4 p-4">
  <h1 class="text-center text-3xl font-black tracking-tight">Escova</h1>

  {#if $roomState?.started}
    <Board view={$roomState} />
  {:else}
    <Lobby view={$roomState} />
  {/if}

  {#if $roomState?.winner}
    <GameOver view={$roomState} />
  {:else if $roundSummary}
    <RoundOver summary={$roundSummary} onclose={dismissRoundSummary} />
  {/if}
</main>
