# ChessSol API Documentation

Base URLs:

- Local: `http://localhost:3000/chesssol/backend`
- Production: `https://chesssol.com/api/chesssol/backend`
- WebSocket: `ws://localhost:8080/chesssol/backend/ws`

## Game Endpoints

### Create Game - Create a new chess game

```bash
curl -X POST http://localhost:3000/chesssol/backend/games \
-H "Content-Type: application/json" \
-d '{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "side": "random",                    // "w", "b", or "random"
  "isBetting": true,                   // optional - for betting games
  "transactionId": "tx_789012",        // required for betting games
  "playerAmount": 0.5                  // required for betting games
}'
```

Response:

```json
{
  "game_id": 42,
  "message": "Game created successfully",
  "player_position": "player1 (white)",
  "game_hash": "28jd0-2945..."
}
```

### Join Game - Join an existing game

```bash
curl -X POST http://localhost:3000/chesssol/backend/games/42/join \
-H "Content-Type: application/json" \
-d '{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44f",
  "side": "b",
  "transactionId": "tx_789013"         // required for betting games
}'
```

Response:

```json
{
  "message": "Successfully joined the game",
  "game_id": 42,
  "player_position": "player2",
  "game_state": "running"
}
```

### Submit Move - Submit a chess move

```bash
curl -X POST http://localhost:3000/chesssol/backend/games/42/data \
-H "Content-Type: application/json" \
-d '{
  "fen": "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
  "client": "player1"
}'
```

Response:

```json
{
  "message": "Game state updated successfully",
  "current_fen": "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
  "moves": ["c5c4", "b8a6", "g8f6"]
}
```

### Get Best Move - Get AI move suggestion

```bash
curl -X POST http://localhost:3000/chesssol/backend/get_best_move \
-H "Content-Type: application/json" \
-d '{
  "fen": "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
  "game_id": "42",
  "level": 18                          // AI difficulty level (1-20)
}'
```

Response:

```json
{
  "game_id": "42",
  "fen": "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
  "best_move": "g8f6"
}
```

### List Games - Get list of active games

```bash
curl "http://localhost:3000/chesssol/backend/listGames"         # All games
curl "http://localhost:3000/chesssol/backend/listGames?mode=checkmate"  # Checkmate games only
```

Response:

```json
{
  "status": true,
  "msg": "Games listed successfully",
  "data": [
    {
      "bet_status": 1,
      "player_amount": "1.00000000",
      "duration": 600000,
      "current_fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "time_difference": null,
      "game_state": "active"
    }
  ]
}
```

## Tournament Endpoints

### Create Tournament - Create a new chess tournament

```bash
curl -X POST http://localhost:3000/chesssol/backend/create-tournament \
-H "Content-Type: application/json" \
-d '{
  "name": "My First Cup",
  "description": "A high-stakes chess event.",
  "link": "https://chess-tournament.com",
  "walletAddress": "0x123...",
  "configuration": {                    // optional tournament settings
    "mode": "rapid",
    "max_rounds": 4,
    "randomStart": true,
    "moveTimeout": 30000,
    "numberOfGames": 1,
    "resignationTime": null,
    "abortTimeout": null
  },
  "isBet": true,                       // optional - for betting tournaments
  "paymentAmount": 100,                // required if isBet is true
  "starterScore": 100                  // optional - default starting score
}'
```

Response:

```json
{
  "status": "success",
  "error": false,
  "msg": "Tournament created successfully",
  "insertId": 2,
  "insertHash": "65b44a56-2b72-41a2-9299-908c97385f59"
}
```

### Join Tournament - Join an existing tournament

```bash
curl -X POST http://localhost:3000/chesssol/backend/join-tournament \
-H "Content-Type: application/json" \
-d '{
  "unique_hash": "xyz789unique",
  "walletAddress": "wallet88",
  "email": "bettor@example.com",       // optional
  "contact": "08098765432",            // optional
  "nickname": "QueenCrusher",          // optional
  "transactionSignature": "abc123",    // required for betting tournaments
  "paymentAmount": 200                 // required for betting tournaments
}'
```

Response:

```json
{
  "status": "success",
  "error": false,
  "msg": "Successfully joined tournament",
  "insertHash": "402c3137-bec4-40b3-9b68-3a937faeeebf"
}
```

### Update Tournament Score - Update player's tournament score

```bash
curl -X POST http://localhost:3000/chesssol/backend/update-score \
-H "Content-Type: application/json" \
-d '{
  "unique_hash": "7d05ee6b-f555-47d0-b444-046b0c1965be",
  "walletAddress": "wallet1",
  "creatorWalletAddress": "walletCreatx9485",  // optional - for verification
  "changeValue": 6
}'
```

Response:

```json
{
  "status": "success",
  "error": false,
  "msg": "Score updated for wallet1",
  "insertHash": "7d05ee6b-f555-47d0-b444-046b0c1965be"
}
```

### List Tournaments - Get list of tournaments

```bash
curl "http://localhost:3000/chesssol/backend/tournaments"          # All tournaments
curl "http://localhost:3000/chesssol/backend/tournaments?status=active"  # Active tournaments only
```

Response:

```json
{
  "status": true,
  "error": null,
  "msg": "Tournaments retrieved successfully",
  "tournaments": [
    {
      "tournmt_id": 2,
      "name": "MyFirstCup",
      "type": "tournament",
      "level": 1,
      "unique_hash": "65b44a56-2b72-41a2-9299-908c97385f59",
      "date": "2025-05-04T16:28:14.000Z",
      "description": "A high-stakes chess event.",
      "status": "upcoming"
    }
  ]
}
```

## Error Response Format

All endpoints return errors in this format:

```json
{
  "status": "fail",
  "error": true,
  "msg": "Error description"
}
```
