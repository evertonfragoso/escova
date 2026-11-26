<script>
  import { TEAMS } from '../../../shared/constants.js'

  let { summary, onclose } = $props()

  let dialog = $state(null)

  const title = $derived(summary.winner ? `Equipe ${summary.winner} venceu o jogo!` : 'Fim da rodada')
  const rows = $derived(Object.entries(summary.breakdown).map(([k, v]) => ({
    label: k,
    value: typeof v === 'object' && v !== null ? JSON.stringify(v) : (v ?? 'empate')
  })))

  // showModal() gives focus trapping, a backdrop, and Escape to close for free
  $effect(() => {
    if (dialog && !dialog.open) dialog.showModal()
  })
</script>

<!-- 'close' fires for the button and for Escape alike, so onclose runs in one place -->
<dialog bind:this={dialog} aria-labelledby="round-over-title" onclose={onclose} class="flex flex-col gap-3">
  <h2 id="round-over-title">{title}</h2>
  <p>Pontos da rodada: {TEAMS.map(t => `${t} ${summary.points[t]}`).join(' · ')}</p>
  <p>Placar: {TEAMS.map(t => `${t} ${summary.scores[t]}`).join(' · ')}</p>
  <ul class="list-disc pl-5 text-sm text-stone-600">
    {#each rows as row (row.label)}
      <li>{row.label}: {row.value}</li>
    {/each}
  </ul>
  <div>
    <button type="button" class="btn" onclick={() => dialog.close()}>Continuar</button>
  </div>
</dialog>
