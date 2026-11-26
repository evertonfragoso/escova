// Single source of truth for game rules and limits.
// Import values from here. Do not redefine them in other modules.

// Players and teams
export const PLAYER_COUNTS = Object.freeze([2, 4])
export const TEAMS = Object.freeze(['A', 'B'])

// Scoring
export const TARGET_SCORE = 11

// Round
export const HAND_SIZE = 3
export const START_TABLE_SIZE = 4
export const TAKE_SUM = 15

// Deck
export const SUIT = Object.freeze({
  CLUBS: 'clubs',
  DIAMONDS: 'diamonds',
  HEARTS: 'hearts',
  SPADES: 'spades'
})
export const SUITS = Object.freeze(Object.values(SUIT))
export const RANKS = Object.freeze(['A', '2', '3', '4', '5', '6', '7', 'Q', 'J', 'K'])
export const DECK_SIZE = SUITS.length * RANKS.length
export const SETE_BELO = Object.freeze({ rank: '7', suit: SUIT.DIAMONDS })

// Capture value of each rank (captures must sum to TAKE_SUM)
export const RANK_VALUE = Object.freeze({ A: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, Q: 8, J: 9, K: 10 })

// Primeira ("highest seven") value of each rank, used for the highest-seven point
export const PRIMEIRA_VALUE = Object.freeze({ 7: 21, 6: 18, A: 16, 5: 15, 4: 14, 3: 13, 2: 12, Q: 10, J: 10, K: 10 })
