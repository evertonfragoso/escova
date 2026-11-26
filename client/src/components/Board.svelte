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
  const handCard = $derived(me?.hand?.find(c => c.id === selectedHand) ?? null)
  const sum = $derived(selectionSum({ handCard, table: round.table, selectedTableIds: selectedTable }))
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

<header class="panel flex flex-wrap items-baseline gap-x-6 gap-y-1">
  {#each TEAMS as t (t)}
    <p class="text-lg"><strong>Equipe {t}:</strong> <span class="font-mono text-2xl font-bold">{view.scores[t]}</span></p>
  {/each}
  <p class="muted">Meta: {TARGET_SCORE}</p>
</header>

<ol class="seats" aria-label="Jogadores">
  {#each round.players as p (p.id)}
    {@const info = view.players.find(x => x.id === p.id)}
    <li aria-current={p.id === round.currentPlayerId ? 'step' : undefined} class:offline={!info.connected}>
      <span class="font-medium">{p.id === view.you ? 'Você' : p.name}</span>
      <span class="muted">· {p.team} · {p.handSize} na mão · {p.capturedCount} capturadas</span>
      {#if !info.connected}<span class="muted">(desconectado)</span>{/if}
      {#if p.escovas}
        <span class="badge" title="Escovas"><img src="/images/escova.png" alt="Escovas" /> {p.escovas}</span>
      {/if}
      {#if p.hasSeteBelo}
        <span class="badge" title="Sete belo (7 de ouros)"><img src="/images/7belo.png" alt="Sete belo (7 de ouros)" /></span>
      {/if}
    </li>
  {/each}
</ol>

<p class="muted">Monte: {round.deckSize} cartas</p>

<section class="panel flex flex-col gap-3" aria-labelledby="table-title">
  <h2 id="table-title">Mesa</h2>
  <div class="table-area">
    {#if round.table.length}
      {#each round.table as c (c.id)}
        <CardView card={c} selectable={myTurn} selected={selectedTable.has(c.id)} onselect={toggleTable} />
      {/each}
    {:else}
      <p class="text-white/80">Mesa vazia</p>
    {/if}
  </div>
</section>

<section class="panel flex flex-col gap-3" aria-labelledby="hand-title">
  <h2 id="hand-title">Minhas cartas</h2>
  <div class="hand-area">
    {#if me?.hand}
      {#each me.hand as c (c.id)}
        <CardView card={c} selectable={myTurn} selected={selectedHand === c.id} onselect={pickHand} />
      {/each}
    {/if}
  </div>
</section>

<section class="panel flex flex-wrap items-center gap-3" aria-label="Jogada">
  <output class="sum {sumClass}" aria-label="Soma das cartas selecionadas">Soma: {sum}</output>
  <button type="button" class="btn" disabled={!discardOk} onclick={() => play([])}>Descartar</button>
  <button type="button" class="btn btn-primary" disabled={!captureOk} onclick={() => play([...selectedTable])}>Capturar</button>
  <p class="muted basis-full sm:basis-auto" role="status">
    {#if myTurn}
      Sua vez: escolha uma carta da mão e, se quiser capturar, cartas da mesa que somem 15.
    {:else}
      Aguardando {onTurn?.name ?? ''}
    {/if}
  </p>
</section>

<p class="error" role="alert">{error}</p>
