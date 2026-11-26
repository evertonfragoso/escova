<script>
  let { card, selectable = false, selected = false, onselect = null } = $props()

  const label = $derived(`${card.rank} de ${card.suit}`)
</script>

<!--
  A selectable card is a real button: it takes focus, and Space and Enter activate it natively.
  aria-pressed exposes the selected state. Cards you cannot play are plain images with a label.
-->
{#if selectable}
  <button
    type="button"
    class="card selectable"
    class:selected
    aria-pressed={selected}
    aria-label={label}
    data-suit={card.suit}
    data-display-value={card.rank}
    data-card-id={card.id}
    onclick={() => onselect?.(card.id)}
  ></button>
{:else}
  <span
    class="card"
    class:selected
    role="img"
    aria-label={label}
    data-suit={card.suit}
    data-display-value={card.rank}
    data-card-id={card.id}
  ></span>
{/if}
