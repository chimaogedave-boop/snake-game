# Classic Snake Game

This is a small snake game built with plain HTML, CSS, and JavaScript so the logic stays easy to follow.

## Files

- `index.html` creates the page structure, score display, buttons, and canvas.
- `style.css` handles the layout and visual design.
- `script.js` contains the game rules and drawing code.

## Core Idea

The snake is stored as an array of positions like this:

```js
[
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 }
]
```

On every game tick:

1. We calculate a new head from the current direction.
2. We add that new head to the front of the array.
3. If the snake did not eat food, we remove the last segment.
4. If the snake did eat food, we leave the tail in place so the snake grows.

## Functions To Study

- `resetGame()` sets the starting state.
- `startGame()` begins the repeating game loop.
- `gameLoop()` moves the snake and checks for win-or-lose events.
- `spawnFood()` picks a random empty cell.
- `drawGame()` redraws the board every frame.
- `setDirection()` prevents the snake from reversing into itself.

## Run It

Open `index.html` in your browser.

## Easy Practice Ideas

- Make the snake faster every time the score increases.
- Add a pause button.
- Show a start screen and a game-over overlay.
- Replace the square snake with rounded segments.
