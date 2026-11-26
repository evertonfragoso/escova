<script>
  import { EVENTS } from '../../../shared/events.js'
  import { TEAMS, TARGET_SCORE } from '../../../shared/constants.js'
  import { request, leaveRoom } from '../lib/connection.js'

  let { view } = $props()

  let dialog = $state(null)
  let swap = $state(false)
  let error = $state('')

  const canSwap = $derived(view.capacity === 4)
  const myVote = $derived(view.rematch.votes[view.you])
  const waitingFor = $derived(view.players.filter(p => !(p.id in view.rematch.votes)).map(p => p.name))
  const teamNames = $derived(TEAMS.map(t => ({
    team: t,
    names: view.players.filter(p => p.team === t).map(p => p.name).join(' e ')
  })))

  // The player must choose: Escape does not dismiss this dialog
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal()
  })

  async function replay () {
    const res = await request(EVENTS.ROOM_REMATCH, { swapPartners: canSwap && swap })
    if (!res.ok) error = res.error
  }

  async function home () {
    const res = await leaveRoom()
    if (!res.ok) error = res.error
  }
</script>

<dialog bind:this={dialog} aria-labelledby="game-over-title" oncancel={e => e.preventDefault()} class="flex flex-col gap-3">
  <h2 id="game-over-title">
    {view.winner ? `Equipe ${view.winner} venceu o jogo!` : 'Fim de jogo'}
  </h2>

  <p>Placar final (meta {TARGET_SCORE}): {TEAMS.map(t => `${t} ${view.scores[t]}`).join(' · ')}</p>

  <h3>Rodadas</h3>
  <ol class="list-decimal pl-5 text-sm">
    {#each view.history as round, i (i)}
      <li>Rodada {i + 1}: A {round.points.A} · B {round.points.B}</li>
    {/each}
  </ol>

  <h3>Equipes</h3>
  <ul class="list-disc pl-5 text-sm">
    {#each teamNames as t (t.team)}
      <li>Equipe {t.team}: {t.names}</li>
    {/each}
  </ul>

  {#if myVote === undefined}
    {#if canSwap}
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" bind:checked={swap} class="size-4 accent-emerald-700" />
        Trocar parceiros (vale só se todos marcarem)
      </label>
    {/if}
    <div class="flex flex-wrap gap-2">
      <button type="button" class="btn btn-primary" onclick={replay}>Jogar novamente</button>
      <button type="button" class="btn" onclick={home}>Voltar ao início</button>
    </div>
  {:else}
    <p role="status">Você já escolheu. Aguardando: {waitingFor.join(', ') || 'ninguém'}</p>
    <button type="button" class="btn" onclick={home}>Voltar ao início</button>
  {/if}

  <p class="error" role="alert">{error}</p>
</dialog>
