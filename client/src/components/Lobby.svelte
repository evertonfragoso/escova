<script>
  import { EVENTS } from '../../../shared/events.js'
  import { PLAYER_COUNTS } from '../../../shared/constants.js'
  import { request } from '../lib/connection.js'
  import { session } from '../lib/session.js'

  let { view = null } = $props()

  let name = $state('')
  let code = $state('')
  let error = $state('')

  async function create (capacity) {
    const res = await request(EVENTS.ROOM_CREATE, { capacity })
    if (!res.ok) return (error = res.error)
    code = res.roomId
    await join(res.roomId)
  }

  async function join (roomId) {
    const res = await request(EVENTS.ROOM_JOIN, { roomId: roomId.trim(), name: name.trim() })
    if (!res.ok) return (error = res.error)
    error = ''
    session.save(roomId.trim(), res.playerId)
  }
</script>

{#if view && !view.started}
  <section class="panel">
    <h2>Aguardando jogadores</h2>
    <p>Código da sala: <strong>{view.roomId}</strong></p>
    <p class="muted">{view.players.length} de {view.capacity}. O jogo começa sozinho quando a sala encher.</p>
    <ul class="seats">
      {#each view.players as p (p.id)}
        <li class:turn={p.id === view.you}>{p.name}</li>
      {/each}
    </ul>
  </section>
{:else}
  <section class="panel">
    <h2>Escova online</h2>
    <div class="row">
      {#each PLAYER_COUNTS as n (n)}
        <button type="button" onclick={() => create(n)} disabled={!name.trim()}>
          Nova sala ({n} jogadores)
        </button>
      {/each}
    </div>
    <div class="row" style="margin-top: 1rem">
      <input type="text" placeholder="Seu nome" maxlength="20" bind:value={name} />
      <input type="text" placeholder="Código da sala" bind:value={code} />
      <button type="button" onclick={() => join(code)} disabled={!name.trim() || !code.trim()}>Entrar</button>
    </div>
    <p class="error">{error}</p>
  </section>
{/if}
