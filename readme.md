# Chessol - Chess Application with Solana Integration

## Project Overview

Chessol is a modern web application that allows users to play chess games, spectate ongoing matches, and integrates with the Solana blockchain for future functionalities.

## Recent UI Enhancements

### Redesigned Flow

The application now follows a more intuitive flow:

1. Landing Page with "Get Started" button
2. Ongoing Games page showing current games with options to:
   - Watch ongoing games (spectator mode)
   - Start a new game

### Visual Improvements

- Modern, polished UI with gradients, shadows, and animations
- Responsive design for mobile and desktop
- Visual hierarchy improvements for better readability
- Enhanced game cards with improved layout and visual cues
- Redesigned modals for game mode selection

### Theme Colors

The application uses a consistent color palette:

- Primary gradients: amber-500 to orange-600
- Secondary accents: purple tones
- Background: Dark gradients with subtle glow effects

To adjust the theme colors, search for gradient classes in the components and modify them as needed.

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the app in development mode.

### `npm run build`

Builds the app for production to the `dist` folder.

### `npm run preview`

Locally preview the production build.

## Design Decisions

### Spectator Mode

Spectator mode allows users to view ongoing games without interfering. The implementation includes:

- Visual indicator showing the user is in spectator mode
- Disabled interaction with the game board
- "Back" button that returns to the ongoing games list

### Difficulty Adjustment

Currently, the difficulty level can only be set before starting a game. For power users, we've added hidden keyboard shortcuts:

- Ctrl+Shift+ArrowUp: Increase difficulty
- Ctrl+Shift+ArrowDown: Decrease difficulty

A future enhancement could include a visible UI for adjusting difficulty during gameplay.

## Future Enhancements

1. Live updates for spectator mode using WebSockets
2. User profiles and statistics
3. Tournament functionality
4. Complete Solana wallet integration
5. NFT rewards for tournament winners
