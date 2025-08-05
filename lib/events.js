export const Events = {
    room: {
        get: 'rooms:get',
        create: 'rooms:create',
        update: 'rooms:update',
        remove: 'rooms:remove',
        join: 'rooms:join',
        full: 'rooms:full'
    },
    lobby: {
        join: 'lobby:join',
        update: 'lobby:update'
    },
    party: {
        swap: 'party:swap'
    },
    player: {
        add: 'player:add',
        set: {
            id: 'player:set:id'
        }
    },
    game: {
        new:   'game:new',
        start: 'game:start',
        prepare: 'game:prepare',
        cards: {
            pick: 'game:cards:pick',
            drop: 'game:cards:drop'
        }
    }
}
