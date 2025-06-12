1. Add sound for opponent move, capture , checkmate , so user know when to move
2. for betting game , user have 5 seconds to move else we'd deduct points from user and use the point at game end for winner detection and points reduction
3. Issue when build is done. it says "Buffer is not defined"
4. Add the timer increment after each move e.g 5 + 2 (meaning : 2 seconds added to the timer after each move) , consider making this configurable when game owner creates game
5. consider using the gameStore for (create/join) game also. then clear store if create / join game fail and when game ends . also consider spectator
6. Add an actual avatar icon for users , add the url for it or assign it when they create / join the game so even if they reload it persists (find an avatar api)
7. When creating a game , show advanced section dropdown where they can add more game configs

// timing value

1. bullet - 1 min
2. blitz - 3 min
3. blitz - 5 min
4. rapid - 10 min
5. fast - 15 min
6. classical - 30 min
