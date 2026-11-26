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

  function submit (event) {
    event.preventDefault()
    join(code)
  }
</script>

{#if view && !view.started}
  <section class="panel flex flex-col gap-3" aria-labelledby="waiting-title">
    <h2 id="waiting-title">Aguardando jogadores</h2>
    <p>Código da sala: <strong class="font-mono text-lg">{view.roomId}</strong></p>
    <p class="muted">{view.players.length} de {view.capacity}. O jogo começa sozinho quando a sala encher.</p>
    <ol class="seats" aria-label="Jogadores na sala">
      {#each view.players as p (p.id)}
        <li aria-current={p.id === view.you ? 'true' : undefined}>{p.name}</li>
      {/each}
    </ol>
  </section>
{:else}
  <section class="panel flex flex-col gap-5" aria-labelledby="lobby-title">
    <h2 id="lobby-title">Jogar</h2>

    <fieldset class="flex flex-col gap-2">
      <legend class="muted mb-2">Nova sala</legend>
      <div class="flex flex-wrap gap-2">
        {#each PLAYER_COUNTS as n (n)}
          <button type="button" class="btn btn-primary" onclick={() => create(n)} disabled={!name.trim()}>
            Nova sala ({n} jogadores)
          </button>
        {/each}
      </div>
    </fieldset>

    <form class="flex flex-wrap items-end gap-3" onsubmit={submit}>
      <label class="flex flex-col gap-1 text-sm font-medium">
        Seu nome
        <input
          type="text"
          placeholder="Seu nome"
          maxlength="20"
          autocomplete="nickname"
          class="rounded-xl border border-stone-300 px-3 py-2 text-base focus:border-emerald-600 focus:outline-none"
          bind:value={name}
        />
      </label>
      <label class="flex flex-col gap-1 text-sm font-medium">
        Código da sala
        <input
          type="text"
          placeholder="Código da sala"
          class="rounded-xl border border-stone-300 px-3 py-2 text-base focus:border-emerald-600 focus:outline-none"
          bind:value={code}
        />
      </label>
      <button type="submit" class="btn" disabled={!name.trim() || !code.trim()}>Entrar</button>
    </form>

    <p class="error" role="alert">{error}</p>
  </section>
{/if}
