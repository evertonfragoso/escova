<script>
  import CardView from './CardView.svelte'
  import { EVENTS } from '../../../shared/events.js'
  import { TEAMS, TARGET_SCORE, TAKE_SUM } from '../../../shared/constants.js'
  import { request } from '../lib/connection.js'
  import { selectionSum, canDiscard, canCapture, prune } from '../lib/view.js'

  let { view } = $props()

  let selectedHand = $state(null)
  let selectedTable = $state(new Set())
  let error = $state('')

  const round = $derived(view.round)
  const me = $derived(round.players.find(p => p.id === view.you))
  const myTurn = $derived(round.currentPlayerId === view.you)
  const onTurn = $derived(round.players.find(p => p.id === round.currentPlayerId))
  const sum = $derived(selectionSum(round.table, selectedTable))
  const discardOk = $derived(canDiscard({ myTurn, cardSelected: !!selectedHand, tableCount: selectedTable.size }))
  const captureOk = $derived(canCapture({ myTurn, cardSelected: !!selectedHand, tableCount: selectedTable.size, sum }))
  const sumClass = $derived(sum === TAKE_SUM ? 'ok' : (selectedTable.size || selectedHand ? 'bad' : ''))

  // Keep selections valid after every server update
  $effect(() => {
    const next = prune(view, selectedHand, selectedTable)
    if (next.hand !== selectedHand) selectedHand = next.hand
    if (next.table.size !== selectedTable.size) selectedTable = next.table
  })

  function pickHand (id) {
    selectedHand = selectedHand === id ? null : id
  }

  function toggleTable (id) {
    const next = new Set(selectedTable)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedTable = next
  }

  async function play (tableCardIds) {
    const res = await request(EVENTS.GAME_PLAY, { cardId: selectedHand, tableCardIds })
    if (!res.ok) return (error = res.error)
    error = ''
    selectedHand = null
    selectedTable = new Set()
  }
</script>

<section class="panel row">
  {#each TEAMS as t (t)}
    <strong>Equipe {t}: {view.scores[t]}</strong>
  {/each}
  <span class="muted">Meta: {TARGET_SCORE}</span>
</section>

<ul class="seats">
  {#each round.players as p (p.id)}
    {@const info = view.players.find(x => x.id === p.id)}
    <li class:turn={p.id === round.currentPlayerId} class:offline={!info.connected}>
      {p.id === view.you ? 'Você' : p.name} · {p.team} · {p.handSize} na mão · {p.capturedCount} capturadas
      {#if !info.connected} (desconectado){/if}
      {#if p.escovas}
        · <img src="/images/escova.png" alt="escova" height="18" /> {p.escovas}
      {/if}
    </li>
  {/each}
</ul>

<section class="panel">
  <p class="muted">Monte: {round.deckSize} cartas</p>
  <h3>Mesa</h3>
  <div class="table-area">
    {#if round.table.length}
      {#each round.table as c (c.id)}
        <CardView card={c} selectable={myTurn} selected={selectedTable.has(c.id)} onselect={toggleTable} />
      {/each}
    {:else}
      <p class="muted">Mesa vazia</p>
    {/if}
  </div>
</section>

<section class="panel">
  <h3>Minhas cartas</h3>
  <div class="hand-area">
    {#if me?.hand}
      {#each me.hand as c (c.id)}
        <CardView card={c} selectable={myTurn} selected={selectedHand === c.id} onselect={pickHand} />
      {/each}
    {/if}
  </div>
</section>

<section class="panel row">
  <span class="sum {sumClass}">Soma: {sum}</span>
  <button type="button" disabled={!discardOk} onclick={() => play([])}>Descartar</button>
  <button type="button" disabled={!captureOk} onclick={() => play([...selectedTable])}>Capturar</button>
  <p class="muted">
    {#if myTurn}
      Sua vez: escolha uma carta da mão e, se quiser capturar, cartas da mesa que somem 15.
    {:else}
      Aguardando {onTurn?.name ?? ''}
    {/if}
  </p>
</section>

<p class="error">{error}</p>
