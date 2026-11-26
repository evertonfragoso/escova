<script>
  let { card, selectable = false, selected = false, onselect = null } = $props()
</script>

<div
  class="card"
  class:selectable
  class:selected
  data-suit={card.suit}
  data-display-value={card.rank}
  data-card-id={card.id}
  aria-label="{card.rank} de {card.suit}"
  role="button"
  tabindex="0"
  onclick={() => onselect?.(card.id)}
  onkeydown={(event) => {
    if (event.key === ' ') {
      event.preventDefault();
      onselect?.(card.id);
    }
  }}
></div>
