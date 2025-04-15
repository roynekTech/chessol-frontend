document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const chessboard = document.getElementById("chessboard");
  const fenDisplay = document.getElementById("fen");
  const currentTurnElement = document.getElementById("current-turn");
  const resetButton = document.getElementById("reset-btn");
  const undoButton = document.getElementById("undo-btn");
  const gameMessage = document.getElementById("game-message");
  const messageContent = gameMessage.querySelector(".message-content");
  const whiteCapturedEl = document.querySelector(".white-captured");
  const blackCapturedEl = document.querySelector(".black-captured");
  const whitePlayerInfo = document.querySelector(".white-player");
  const blackPlayerInfo = document.querySelector(".black-player");

  // Game state
  let board = [];
  let selectedPiece = null;
  let currentPlayer = "white";
  let lastMove = { from: null, to: null };
  let gameHistory = [];
  let capturedPieces = { white: [], black: [] };

  // Piece unicode representations
  const pieces = {
    white: {
      pawn: "♙",
      rook: "♖",
      knight: "♘",
      bishop: "♗",
      queen: "♕",
      king: "♔",
    },
    black: {
      pawn: "♟",
      rook: "♜",
      knight: "♞",
      bishop: "♝",
      queen: "♛",
      king: "♚",
    },
  };

  // Initialize the board
  function initializeBoard() {
    // Clear the board array
    board = Array(8)
      .fill()
      .map(() => Array(8).fill(null));

    // Set up pawns
    for (let i = 0; i < 8; i++) {
      board[1][i] = { type: "pawn", color: "black", hasMoved: false };
      board[6][i] = { type: "pawn", color: "white", hasMoved: false };
    }

    // Set up other pieces
    const backRankPieces = [
      "rook",
      "knight",
      "bishop",
      "queen",
      "king",
      "bishop",
      "knight",
      "rook",
    ];
    for (let i = 0; i < 8; i++) {
      board[0][i] = {
        type: backRankPieces[i],
        color: "black",
        hasMoved: false,
      };
      board[7][i] = {
        type: backRankPieces[i],
        color: "white",
        hasMoved: false,
      };
    }

    // Reset game state
    selectedPiece = null;
    currentPlayer = "white";
    lastMove = { from: null, to: null };
    gameHistory = [];
    capturedPieces = { white: [], black: [] };

    // Update UI
    renderBoard();
    updateFEN();
    updateTurnIndicator();
    updateCapturedPieces();
    hideMessage();
  }

  // Render the chessboard
  function renderBoard() {
    // Clear the board
    chessboard.innerHTML = "";

    // Create squares and pieces
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement("div");
        square.className = `square ${
          (row + col) % 2 === 0 ? "white" : "black"
        }`;
        square.dataset.row = row;
        square.dataset.col = col;

        // Add piece if there is one
        if (board[row][col]) {
          const piece = document.createElement("div");
          piece.className = `piece ${board[row][col].color} ${board[row][col].type}`;
          piece.textContent =
            pieces[board[row][col].color][board[row][col].type];
          piece.dataset.type = board[row][col].type;
          piece.dataset.color = board[row][col].color;
          square.appendChild(piece);
        }

        // Highlight the last move
        if (
          (lastMove.from &&
            lastMove.from.row === row &&
            lastMove.from.col === col) ||
          (lastMove.to && lastMove.to.row === row && lastMove.to.col === col)
        ) {
          square.classList.add("last-move");
        }

        // Add click event
        square.addEventListener("click", handleSquareClick);
        chessboard.appendChild(square);
      }
    }
  }

  // Handle click on a square
  function handleSquareClick(event) {
    const square = event.target.closest(".square");
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);

    // If a piece is already selected
    if (selectedPiece) {
      const fromRow = selectedPiece.row;
      const fromCol = selectedPiece.col;

      // If clicking on the same square, deselect
      if (fromRow === row && fromCol === col) {
        deselectPiece();
        return;
      }

      // If clicking on another piece of the same color, select that piece instead
      if (board[row][col] && board[row][col].color === currentPlayer) {
        deselectPiece();
        selectPiece(row, col);
        return;
      }

      // Try to move the piece
      if (isValidMove(fromRow, fromCol, row, col)) {
        movePiece(fromRow, fromCol, row, col);
        deselectPiece();
      }
    } else if (board[row][col] && board[row][col].color === currentPlayer) {
      // Select a piece if none is selected and the square has a piece of current player's color
      selectPiece(row, col);
    }
  }

  // Select a piece
  function selectPiece(row, col) {
    selectedPiece = { row, col };
    const squares = document.querySelectorAll(".square");

    // Highlight the selected piece
    squares.forEach((square) => {
      if (
        parseInt(square.dataset.row) === row &&
        parseInt(square.dataset.col) === col
      ) {
        square.classList.add("selected");
      }
    });

    // Highlight valid moves
    highlightValidMoves(row, col);
  }

  // Deselect a piece
  function deselectPiece() {
    selectedPiece = null;

    // Remove all highlights
    const squares = document.querySelectorAll(".square");
    squares.forEach((square) => {
      square.classList.remove("selected");
      square.classList.remove("highlighted");
      square.classList.remove("has-piece");
    });
  }

  // Highlight valid moves for a piece
  function highlightValidMoves(row, col) {
    const piece = board[row][col];
    if (!piece) return;

    const squares = document.querySelectorAll(".square");

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (isValidMove(row, col, r, c)) {
          squares.forEach((square) => {
            if (
              parseInt(square.dataset.row) === r &&
              parseInt(square.dataset.col) === c
            ) {
              square.classList.add("highlighted");
              // Add additional class if the target square has a piece (for different highlight style)
              if (board[r][c]) {
                square.classList.add("has-piece");
              }
            }
          });
        }
      }
    }
  }

  // Check if a move is valid
  function isValidMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    if (!piece) return false;

    // Cannot capture own pieces
    if (board[toRow][toCol] && board[toRow][toCol].color === piece.color) {
      return false;
    }

    // Movement logic based on piece type
    switch (piece.type) {
      case "pawn":
        return isValidPawnMove(fromRow, fromCol, toRow, toCol);
      case "rook":
        return isValidRookMove(fromRow, fromCol, toRow, toCol);
      case "knight":
        return isValidKnightMove(fromRow, fromCol, toRow, toCol);
      case "bishop":
        return isValidBishopMove(fromRow, fromCol, toRow, toCol);
      case "queen":
        return isValidQueenMove(fromRow, fromCol, toRow, toCol);
      case "king":
        return isValidKingMove(fromRow, fromCol, toRow, toCol);
      default:
        return false;
    }
  }

  // Check if a pawn move is valid
  function isValidPawnMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const direction = piece.color === "white" ? -1 : 1;
    const startRow = piece.color === "white" ? 6 : 1;

    // Forward move
    if (fromCol === toCol) {
      // One square forward
      if (toRow === fromRow + direction && !board[toRow][toCol]) {
        return true;
      }

      // Two squares forward from start position
      if (
        fromRow === startRow &&
        toRow === fromRow + 2 * direction &&
        !board[fromRow + direction][toCol] &&
        !board[toRow][toCol]
      ) {
        return true;
      }
    }

    // Capture diagonally
    if (
      toRow === fromRow + direction &&
      (toCol === fromCol + 1 || toCol === fromCol - 1)
    ) {
      if (board[toRow][toCol] && board[toRow][toCol].color !== piece.color) {
        return true;
      }
      // En passant logic can be added here
    }

    return false;
  }

  // Check if a rook move is valid
  function isValidRookMove(fromRow, fromCol, toRow, toCol) {
    // Rook moves horizontally or vertically
    if (fromRow !== toRow && fromCol !== toCol) {
      return false;
    }

    // Check if path is clear
    return isPathClear(fromRow, fromCol, toRow, toCol);
  }

  // Check if a knight move is valid
  function isValidKnightMove(fromRow, fromCol, toRow, toCol) {
    // Knight moves in L-shape
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  }

  // Check if a bishop move is valid
  function isValidBishopMove(fromRow, fromCol, toRow, toCol) {
    // Bishop moves diagonally
    if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) {
      return false;
    }

    // Check if path is clear
    return isPathClear(fromRow, fromCol, toRow, toCol);
  }

  // Check if a queen move is valid
  function isValidQueenMove(fromRow, fromCol, toRow, toCol) {
    // Queen moves like rook or bishop
    return (
      isValidRookMove(fromRow, fromCol, toRow, toCol) ||
      isValidBishopMove(fromRow, fromCol, toRow, toCol)
    );
  }

  // Check if a king move is valid
  function isValidKingMove(fromRow, fromCol, toRow, toCol) {
    // King moves one square in any direction
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    return rowDiff <= 1 && colDiff <= 1;
    // Castling logic can be added here
  }

  // Check if the path between two positions is clear
  function isPathClear(fromRow, fromCol, toRow, toCol) {
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    const rowDir = rowDiff === 0 ? 0 : rowDiff > 0 ? 1 : -1;
    const colDir = colDiff === 0 ? 0 : colDiff > 0 ? 1 : -1;

    let row = fromRow + rowDir;
    let col = fromCol + colDir;

    while (row !== toRow || col !== toCol) {
      if (board[row][col]) {
        return false;
      }
      row += rowDir;
      col += colDir;
    }

    return true;
  }

  // Move a piece
  function movePiece(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const targetPiece = board[toRow][toCol];

    // Add captured piece to the array
    if (targetPiece) {
      capturedPieces[piece.color].push({ ...targetPiece });
    }

    // Update move history
    gameHistory.push({
      piece: { ...piece },
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      captured: targetPiece ? { ...targetPiece } : null,
    });

    // Update last move for highlighting
    lastMove = {
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
    };

    // Move the piece
    piece.hasMoved = true;
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = null;

    // Apply animation class to the moved piece after rendering
    setTimeout(() => {
      const movedPiece = document.querySelector(
        `.square[data-row="${toRow}"][data-col="${toCol}"] .piece`
      );
      if (movedPiece) {
        movedPiece.classList.add("piece-moving");
        setTimeout(() => {
          movedPiece.classList.remove("piece-moving");
        }, 300);
      }
    }, 0);

    // Switch players
    currentPlayer = currentPlayer === "white" ? "black" : "white";

    // Update UI
    renderBoard();
    updateFEN();
    updateTurnIndicator();
    updateCapturedPieces();
    checkGameStatus();
  }

  // Update captured pieces display
  function updateCapturedPieces() {
    // Clear existing captured pieces
    whiteCapturedEl.innerHTML = "";
    blackCapturedEl.innerHTML = "";

    // Sort captured pieces by value for better display
    const pieceValue = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9 };

    // Add white's captured pieces
    capturedPieces.white
      .sort((a, b) => pieceValue[b.type] - pieceValue[a.type])
      .forEach((piece) => {
        const capturedPiece = document.createElement("div");
        capturedPiece.className = `captured-piece black ${piece.type}`;
        whiteCapturedEl.appendChild(capturedPiece);
      });

    // Add black's captured pieces
    capturedPieces.black
      .sort((a, b) => pieceValue[b.type] - pieceValue[a.type])
      .forEach((piece) => {
        const capturedPiece = document.createElement("div");
        capturedPiece.className = `captured-piece white ${piece.type}`;
        blackCapturedEl.appendChild(capturedPiece);
      });
  }

  // Update the active player indicator
  function updateTurnIndicator() {
    currentTurnElement.textContent =
      currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1);

    // Update active player styling
    if (currentPlayer === "white") {
      whitePlayerInfo.classList.add("active");
      blackPlayerInfo.classList.remove("active");
    } else {
      blackPlayerInfo.classList.add("active");
      whitePlayerInfo.classList.remove("active");
    }
  }

  // Check if king is in check
  function isKingInCheck(color) {
    // Find the king position
    let kingRow = -1;
    let kingCol = -1;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (
          board[row][col] &&
          board[row][col].type === "king" &&
          board[row][col].color === color
        ) {
          kingRow = row;
          kingCol = col;
          break;
        }
      }
      if (kingRow !== -1) break;
    }

    // If king not found (shouldn't happen in a valid game)
    if (kingRow === -1) return false;

    // Check if any opponent piece can capture the king
    const opponentColor = color === "white" ? "black" : "white";

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] && board[row][col].color === opponentColor) {
          if (isValidMove(row, col, kingRow, kingCol)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  // Check for checkmate or stalemate
  function checkGameStatus() {
    // Check if current player's king is in check
    const inCheck = isKingInCheck(currentPlayer);

    // Check if any legal moves exist
    let hasLegalMoves = false;

    // Try all possible moves for current player's pieces
    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        if (
          board[fromRow][fromCol] &&
          board[fromRow][fromCol].color === currentPlayer
        ) {
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              if (isValidMove(fromRow, fromCol, toRow, toCol)) {
                // Make temporary move to check if it resolves check
                const originalPiece = board[toRow][toCol];
                const movingPiece = board[fromRow][fromCol];

                // Make the move temporarily
                board[toRow][toCol] = movingPiece;
                board[fromRow][fromCol] = null;

                // Check if king is still in check after the move
                const stillInCheck = isKingInCheck(currentPlayer);

                // Undo the move
                board[fromRow][fromCol] = movingPiece;
                board[toRow][toCol] = originalPiece;

                // If this move gets out of check, player has legal moves
                if (!stillInCheck) {
                  hasLegalMoves = true;
                  break;
                }
              }
            }
            if (hasLegalMoves) break;
          }
        }
        if (hasLegalMoves) break;
      }
      if (hasLegalMoves) break;
    }

    // Determine game state
    if (inCheck && !hasLegalMoves) {
      // Checkmate
      const winner = currentPlayer === "white" ? "Black" : "White";
      showMessage(`Checkmate! ${winner} wins the game.`);
    } else if (!inCheck && !hasLegalMoves) {
      // Stalemate
      showMessage("Stalemate! The game is a draw.");
    }
  }

  // Show game message
  function showMessage(text) {
    messageContent.textContent = text;
    gameMessage.classList.add("active");

    // Add a click handler to dismiss the message
    gameMessage.addEventListener("click", hideMessage, { once: true });
  }

  // Hide game message
  function hideMessage() {
    gameMessage.classList.remove("active");
  }

  // Undo last move
  function undoMove() {
    if (gameHistory.length === 0) return;

    // Get last move
    const lastMove = gameHistory.pop();

    // Restore the board state
    const { piece, from, to, captured } = lastMove;

    // Put the moved piece back
    board[from.row][from.col] = piece;

    // Restore captured piece or clear the destination
    board[to.row][to.col] = captured;

    // Remove from captured pieces if needed
    if (captured) {
      const capturerColor = piece.color;
      const capturedIndex = capturedPieces[capturerColor].findIndex(
        (p) => p.type === captured.type && p.color === captured.color
      );

      if (capturedIndex !== -1) {
        capturedPieces[capturerColor].splice(capturedIndex, 1);
      }
    }

    // Switch back to previous player
    currentPlayer = currentPlayer === "white" ? "black" : "white";

    // Update last move highlight
    const prevMove =
      gameHistory.length > 0
        ? gameHistory[gameHistory.length - 1]
        : { from: null, to: null };
    lastMove.from = prevMove.from;
    lastMove.to = prevMove.to;

    // Update UI
    renderBoard();
    updateFEN();
    updateTurnIndicator();
    updateCapturedPieces();
    hideMessage();
  }

  // Update the FEN display
  function updateFEN() {
    const fen = generateFEN();
    fenDisplay.value = fen;
  }

  // Generate FEN string
  function generateFEN() {
    let fen = "";

    // Board position
    for (let row = 0; row < 8; row++) {
      let emptyCount = 0;

      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];

        if (piece) {
          if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
          }

          let pieceChar = "";
          switch (piece.type) {
            case "pawn":
              pieceChar = "p";
              break;
            case "rook":
              pieceChar = "r";
              break;
            case "knight":
              pieceChar = "n";
              break;
            case "bishop":
              pieceChar = "b";
              break;
            case "queen":
              pieceChar = "q";
              break;
            case "king":
              pieceChar = "k";
              break;
          }

          fen += piece.color === "white" ? pieceChar.toUpperCase() : pieceChar;
        } else {
          emptyCount++;
        }
      }

      if (emptyCount > 0) {
        fen += emptyCount;
      }

      if (row < 7) {
        fen += "/";
      }
    }

    // Active color
    fen += " " + (currentPlayer === "white" ? "w" : "b");

    // Castling availability (simplified)
    let castling = "";
    if (board[7][4] && board[7][4].type === "king" && !board[7][4].hasMoved) {
      if (board[7][7] && board[7][7].type === "rook" && !board[7][7].hasMoved)
        castling += "K";
      if (board[7][0] && board[7][0].type === "rook" && !board[7][0].hasMoved)
        castling += "Q";
    }
    if (board[0][4] && board[0][4].type === "king" && !board[0][4].hasMoved) {
      if (board[0][7] && board[0][7].type === "rook" && !board[0][7].hasMoved)
        castling += "k";
      if (board[0][0] && board[0][0].type === "rook" && !board[0][0].hasMoved)
        castling += "q";
    }
    fen += " " + (castling || "-");

    // En passant target square (simplified)
    fen += " -";

    // Halfmove clock (simplified)
    fen += " 0";

    // Fullmove number (simplified)
    fen += " 1";

    return fen;
  }

  // Event listeners
  resetButton.addEventListener("click", initializeBoard);
  undoButton.addEventListener("click", undoMove);

  // Initialize the game
  initializeBoard();
});
