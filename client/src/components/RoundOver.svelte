<script>
  import { TEAMS } from '../../../shared/constants.js'

  let { summary, onclose } = $props()

  const title = $derived(summary.winner ? `Equipe ${summary.winner} venceu o jogo!` : 'Fim da rodada')
  const rows = $derived(Object.entries(summary.breakdown).map(([k, v]) => ({
    label: k,
    value: typeof v === 'object' && v !== null ? JSON.stringify(v) : (v ?? 'empate')
  })))
</script>

<div class="overlay">
  <section class="panel">
    <h2>{title}</h2>
    <p>Pontos da rodada: {TEAMS.map(t => `${t} ${summary.points[t]}`).join(' · ')}</p>
    <p>Placar: {TEAMS.map(t => `${t} ${summary.scores[t]}`).join(' · ')}</p>
    <ul>
      {#each rows as row (row.label)}
        <li>{row.label}: {row.value}</li>
      {/each}
    </ul>
    <button type="button" onclick={onclose}>Continuar</button>
  </section>
</div>
