1. Add sound for opponent move, capture , checkmate , so user know when to move
2. for betting game , user have 5 seconds to move else we'd deduct points from user and use the point at game end for winner detection and points reduction
3. Issue when build is done. it says "Buffer is not defined"
4. Add the timer increment after each move e.g 5 + 2 (meaning : 2 seconds added to the timer after each move) , consider making this configurable when game owner creates game
5. consider using the gameStore for (create/join) game also. then clear store if create / join game fail and when game ends . also consider spectator
6. Add an actual avatar icon for users , add the url for it or assign it when they create / join the game so even if they reload it persists (find an avatar api)
7. Show USD equivalent of the bet sol amount on create / join game
8. When creating a game , show advanced section dropdown where they can add more game configs

# Remaining Tasks

## Implementation for human vs human v2

## Medium Priority

- [ ] Game Controls
  - [ ] Implement resign functionality in V2
  - [ ] Add draw offer functionality
  - [ ] Add move sound effects

## Low Priority

- [ ] UI Polish
  - [ ] Add loading states
  - [ ] Improve piece movement transitions
  - [ ] Add tooltips for controls
  - [ ] Enhance mobile responsiveness



The data below may help you in creating the meta details:

1. Page Title & Meta Description (For Google/SEO)
Title:
ChessSol | Play, Bet & Earn Crypto on Solana’s Fastest Chess Platform

Meta Description:
ChessSol merges competitive chess with Web3. Play P2E matches, bet with friends, and host tournaments on Solana—low fees, real rewards. Join now!

Keywords:
play-to-earn chess, Solana chess game, crypto betting, Web3 chess, earn crypto playing chess, blockchain tournaments, ChessSol, SPL token chess


<!-- Primary Meta Tags -->
<meta property="og:title" content="ChessSol | Bet & Earn Crypto on Solana Chess">
<meta property="og:description" content="Play chess, bet with $CHESS tokens, and win real rewards. Fast, secure, and decentralized on Solana.">
<meta property="og:image" content="https://chesssol.com/og-image.png">
<meta property="og:url" content="https://chesssol.com">
<meta property="og:type" content="website">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="ChessSol: Win Crypto Playing Chess">
<meta name="twitter:description" content="The first play-to-earn chess platform on Solana. Compete, bet, and host tournaments with $CHESS tokens.">
<meta name="twitter:image" content="https://chesssol.com/twitter-card.png">






<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Game",
  "name": "ChessSol",
  "description": "Play-to-earn chess platform on Solana.",
  "url": "https://chesssol.com",
  "operatingSystem": "Web, iOS, Android",
  "gamePlatform": "Solana Blockchain"
}
</script>
