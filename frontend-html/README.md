# Chess Game

A fully functional chess game implemented in HTML, CSS, and JavaScript that allows two players to play on the same computer.

## Features

- Complete chess board with all pieces
- Highlights valid moves for selected pieces
- Shows the current player's turn
- Displays the current FEN (Forsyth-Edwards Notation) of the game
- Move validation for all chess pieces
- Visual highlighting of the last move
- Reset button to start a new game

## How to Play

1. Open `index.html` in your web browser
2. White player moves first
3. Click on a piece to select it
4. Valid moves will be highlighted in green
5. Click on a highlighted square to move your piece
6. Players take turns until checkmate or stalemate

## Implementation Details

The game is implemented using:

- HTML for structure
- CSS for styling and layout
- JavaScript for game logic and interactivity

The FEN notation at the top of the page shows the current board state in standard chess notation.

## Future Enhancements

- Add castling moves
- Add en passant captures
- Add pawn promotion
- Implement checkmate and stalemate detection
- Add game timer
- Add move history/notation

## Project Structure

```
frontend/
├── index.html      # Main HTML file
├── css/
│   └── style.css   # Styling for the chess game
└── js/
    └── chess.js    # Game logic
```
