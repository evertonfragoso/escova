export function GenerateRandomId() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
}

export const Suits = {
    en: {
        clubs: 'clubs',
        diamonds: 'diamonds',
        hearts: 'hearts',
        spades: 'spades'
    },
    pt: {
        clubs: 'paus',
        diamonds: 'ouro',
        hearts: 'corações',
        spades: 'espadas'
    }
}
