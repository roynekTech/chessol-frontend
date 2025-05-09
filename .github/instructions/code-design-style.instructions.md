---
applyTo: "**"
---

# ChessSol - Chess Game Application Coding Standards

## Project Architecture Overview

ChessSol is a React-based chess application built with TypeScript, utilizing a modern stack including Vite, TanStack Query, Zustand, and WebSockets for real-time gameplay.

## State Management

### Zustand Store
- The application uses Zustand for global state management
- Primary store: `chessGameStore.ts` maintains game state
- Follow the existing pattern of creating stores with typed interfaces
- Use the `create` function from Zustand to define stores
- Include actions for updating state within the store definition

Example pattern:
```typescript
interface IMyStore {
  // State properties
  someState: string;
  // Actions
  updateSomeState: (newValue: string) => void;
}

export const useMyStore = create<IMyStore>((set) => ({
  someState: "initial value",
  updateSomeState: (newValue) => set({ someState: newValue }),
}));
```

### Local Storage Integration
- Use the `localStorageHelper` for persisting state
- Follow the existing pattern in `chessGameStore.ts` for saving/retrieving state
- Use the `LocalStorageKeysEnum` for consistent key naming

## WebSocket Communication

### WebSocket Context
- Real-time communication is managed via WebSocket context (`WebSocketContext.tsx`)
- Use the `useWebSocket` hook for WebSocket functionality
- The WebSocket hook handles: 
  - Connection establishment
  - Automatic reconnection
  - Message sending/receiving
  - Connection state management

### WebSocket Message Types
- All WebSocket message types are defined in `type.ts` as TypeScript enums and interfaces
- Use the existing `WebSocketMessageTypeEnum` for message types
- Follow the naming convention: `IWS[Action]Message` for outgoing messages and `IWS[Action]Response` for incoming messages
- Always use typed messages for WebSocket communication

## API Data Fetching

### TanStack Query Integration
- Use the custom hooks in `use-query-hooks.ts` for all API operations:
  - `useGetData` for GET requests
  - `usePostData` for POST requests
  - `useUpdateData` for PUT requests
  - `usePatchData` for PATCH requests
  - `useDeleteData` for DELETE requests
- Follow the pattern of providing endpoint and queryKey parameters
- Leverage TanStack Query's built-in caching and request deduplication

Example usage:
```typescript
const { data, isLoading, error } = useGetData<ResponseType>(
  '/api/endpoint',
  ['queryKey', 'dependencies'],
  { refetchInterval: 5000 } // Optional TanStack Query options
);
```

## Components & UI Structure

### Component Structure
- UI components are organized in the `components/` directory
- Game-specific components are in `components/game/`
- UI primitives are in `components/ui/` following shadcn/ui patterns
- Pages are in the `pages/` directory

### Chess Board Rendering
- Chess board is implemented in `ChessBoard.tsx`
- Uses chess.js for game logic
- Renders pieces based on FEN notation
- Uses motion components from framer-motion for animations

### Component Props
- Define explicit interfaces for component props
- Use the naming convention `I[ComponentName]Props`
- Leverage TypeScript types from chess.js where appropriate

### UI Styling
- The project uses Tailwind CSS for styling
- Follow the existing color scheme (amber, yellows for chess board)
- Use shadcn/ui components when adding new UI elements
- Maintain accessibility attributes (aria-* labels, roles)

## TypeScript Standards

### Type Definitions
- All types are centralized in `utils/type.ts`
- Use TypeScript enums for constants (e.g., `SideEnum`, `GameStateEnum`)
- Define interfaces with 'I' prefix (e.g., `IGameState`)
- Define type unions for related types (e.g., `TWebSocketIncoming`)

### Chess-Specific Types
- Leverage the chess.js library types (Square, Piece, Color)
- Extend chess.js types when necessary
- Use strict typing for all chess-related operations

## UI Design Guide

### Color Palette
- **Primary**: Amber (`amber-800`, `amber-900`) for main chess board dark squares
- **Secondary**: Light amber (`amber-200`) for chess board light squares
- **Accent**: Yellow (`yellow-400`) for highlights and selections
- **Background**: Use gradient backgrounds for pages with dark overlays
- **Text**: White for dark backgrounds, dark gray/black for light backgrounds

### Component Design
- Use glassmorphism effects for modals and overlays
- Apply subtle shadows to elevate components (`shadow-lg`, `shadow-xl`)
- Maintain rounded corners consistently (`rounded-lg` or `rounded-xl`)
- Use animations sparingly and purposefully (transitions, hover effects)

### Layout and Spacing
- Use responsive grid layouts with Tailwind's grid system
- Maintain consistent spacing using Tailwind's spacing scale
- Ensure all components are fully responsive for mobile and desktop
- Use flexbox for alignment within components

### Typography
- Use a consistent type scale throughout the application
- Headlines: Larger, possibly with subtle gradients for emphasis
- Body text: Clean, legible fonts with appropriate line height
- Game information: Compact but readable

### Interactive Elements
- Buttons should have hover and active states
- Use consistent focus states for accessibility
- Interactive chess pieces should have subtle hover effects
- Provide visual feedback for all user interactions

### Animations
- Use Framer Motion for piece movements and transitions
- Keep animations short (200-300ms) to maintain responsiveness
- Apply subtle entrance/exit animations for modals and notifications
- Use transition effects for state changes

### Game-Specific UI
- Chess board should be the focal point of the game UI
- Player information panels should be compact but informative
- Game controls should be easily accessible but not intrusive
- Use clear visual indicators for game state (check, checkmate, etc.)

### Accessibility
- Maintain contrast ratios that meet WCAG standards
- Include proper aria attributes on all interactive elements
- Ensure keyboard navigation works throughout the application
- Provide visual indicators that don't rely solely on color

## Game Logic

### Chess.js Integration
- The project uses chess.js for core chess rules and validation
- FEN notation is used to represent board state
- Game moves are validated through chess.js

### Game State
- Game state is tracked in the `IGameState` interface
- Contains board state (FEN), player colors, timers, move history, etc.
- Update game state through the Zustand store actions

## Naming Conventions

- **Interfaces**: Prefix with 'I' (e.g., `IGameState`)
- **Enums**: Use descriptive names with 'Enum' suffix (e.g., `SideEnum`)
- **Type Aliases**: Prefix with 'T' for complex types (e.g., `TWebSocketIncoming`)
- **Components**: Use PascalCase (e.g., `ChessBoard.tsx`)
- **Hooks**: Use camelCase with 'use' prefix (e.g., `useWebSocket`)
- **Files**: Use PascalCase for components, camelCase for utilities

## Best Practices to Follow

1. Keep components focused on a single responsibility
2. Use TypeScript types consistently throughout the codebase
3. Leverage existing hooks and utilities rather than creating new ones
4. Maintain WebSocket message type consistency
5. Follow the established UI patterns and color schemes
6. Use Zustand for global state, local state for component-specific concerns
7. Separate business logic from UI components
8. Utilize the WebSocket context for all real-time communications
9. Use TanStack Query for all data fetching operations
