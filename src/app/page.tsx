'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type Position = {
  x: number;
  y: number;
};

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150; // milliseconds
const MIN_SPEED = 50; // minimum speed (higher number = slower)

export default function SnakeGame() {
  const [snake, setSnake] = useState<Position[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const directionRef = useRef(direction);
  const gameOverRef = useRef(gameOver);
  const isPausedRef = useRef(isPaused);

  // Generate random food position
  const generateFood = useCallback((): Position => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };

    // Make sure food doesn't appear on snake
    const isOnSnake = snake.some(segment => 
      segment.x === newFood.x && segment.y === newFood.y
    );

    if (isOnSnake) {
      return generateFood();
    }

    return newFood;
  }, [snake]);

  // Initialize game
  const initGame = useCallback(() => {
    setSnake([
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ]);
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setGameOver(false);
    gameOverRef.current = false;
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setFood(generateFood());
    setIsPaused(false);
    isPausedRef.current = false;
    setIsPlaying(true);
  }, [generateFood]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) {
        if (e.key === ' ' || e.key === 'Enter') {
          initGame();
        }
        return;
      }

      // Pause/unpause with space or enter
      if (e.key === ' ' || e.key === 'Enter') {
        setIsPaused(prev => !prev);
        isPausedRef.current = !isPausedRef.current;
        return;
      }

      // Prevent 180-degree turns
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          if (directionRef.current !== 'DOWN') {
            setDirection('UP');
            directionRef.current = 'UP';
          }
          break;
        case 'arrowdown':
        case 's':
          if (directionRef.current !== 'UP') {
            setDirection('DOWN');
            directionRef.current = 'DOWN';
          }
          break;
        case 'arrowleft':
        case 'a':
          if (directionRef.current !== 'RIGHT') {
            setDirection('LEFT');
            directionRef.current = 'LEFT';
          }
          break;
        case 'arrowright':
        case 'd':
          if (directionRef.current !== 'LEFT') {
            setDirection('RIGHT');
            directionRef.current = 'RIGHT';
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, initGame]);

  // Update direction refs when direction changes
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Game loop
  useEffect(() => {
    if (!isPlaying || gameOverRef.current) return;

    const moveSnake = () => {
      if (isPausedRef.current) return; // Early return if paused
      
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };
        
        switch (directionRef.current) {
          case 'UP':
            head.y -= 1;
            break;
          case 'DOWN':
            head.y += 1;
            break;
          case 'LEFT':
            head.x -= 1;
            break;
          case 'RIGHT':
            head.x += 1;
            break;
        }

        // Check wall collision
        if (
          head.x < 0 || 
          head.x >= GRID_SIZE || 
          head.y < 0 || 
          head.y >= GRID_SIZE
        ) {
          setGameOver(true);
          gameOverRef.current = true;
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          setGameOver(true);
          gameOverRef.current = true;
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];
        
        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          setScore(prev => prev + 10);
          setFood(generateFood());
          
          // Increase speed as score increases (up to a limit)
          if (speed > MIN_SPEED) {
            setSpeed(prev => Math.max(MIN_SPEED, prev - 2));
          }
        } else {
          // Remove tail if no food was eaten
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const gameInterval = setInterval(moveSnake, speed);
    return () => clearInterval(gameInterval);
  }, [isPlaying, gameOverRef, speed, food, generateFood]); // Remove isPausedRef to prevent interval reset



  // Render game cell
  const renderCell = (x: number, y: number) => {
    const isSnakeHead = snake[0].x === x && snake[0].y === y;
    const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y);
    const isFood = food.x === x && food.y === y;

    let cellClass = 'border border-gray-700 ';
    
    if (isSnakeHead) {
      cellClass += 'bg-green-500 rounded-full ';
    } else if (isSnakeBody) {
      cellClass += 'bg-green-400 ';
    } else if (isFood) {
      cellClass += 'bg-red-500 rounded-full animate-pulse ';
    } else {
      cellClass += 'bg-gray-800 ';
    }

    return (
      <div
        key={`${x}-${y}`}
        className={cellClass}
        style={{ width: CELL_SIZE, height: CELL_SIZE }}
      />
    );
  };

  // Render game grid
  const renderGrid = () => {
    const grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        row.push(renderCell(x, y));
      }
      grid.push(
        <div key={y} className="flex">
          {row}
        </div>
      );
    }
    return grid;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
          Snake Game
        </h1>
        <p className="mb-6 text-gray-300">Use arrow keys or WASD to control the snake</p>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <div className="text-xl font-semibold">
                Score: <span className="text-green-400">{score}</span>
              </div>
              <div className="text-lg">
                Speed: <span className="text-blue-400">{Math.round((INITIAL_SPEED - speed + MIN_SPEED) / (INITIAL_SPEED - MIN_SPEED) * 100)}%</span>
              </div>
            </div>
            
            <div 
              className="relative border-4 border-gray-700 rounded-lg overflow-hidden"
              style={{ 
                width: GRID_SIZE * CELL_SIZE, 
                height: GRID_SIZE * CELL_SIZE,
                margin: '0 auto'
              }}
            >
              {renderGrid()}
              
              {gameOver && (
                <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center p-4">
                  <h2 className="text-2xl font-bold text-red-500 mb-2">Game Over!</h2>
                  <p className="text-xl mb-4">Final Score: <span className="text-green-400">{score}</span></p>
                  <button
                    onClick={initGame}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-full hover:from-green-600 hover:to-blue-600 transition-all transform hover:scale-105"
                  >
                    Play Again
                  </button>
                </div>
              )}
              
              {!isPlaying && !gameOver && (
                <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center p-4">
                  <h2 className="text-3xl font-bold text-green-400 mb-4">Snake Game</h2>
                  <p className="text-lg mb-2">Eat the red food to grow and earn points!</p>
                  <p className="text-lg mb-6">Avoid walls and yourself!</p>
                  <button
                    onClick={initGame}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-full hover:from-green-600 hover:to-blue-600 transition-all transform hover:scale-105"
                  >
                    Start Game
                  </button>
                </div>
              )}
              
              {isPaused && isPlaying && !gameOver && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                  <div className="text-2xl font-bold bg-gray-900 bg-opacity-90 px-6 py-3 rounded-lg">
                    PAUSED
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setIsPaused(prev => !prev)}
                disabled={!isPlaying || gameOver}
                className={`px-4 py-2 rounded-lg font-medium ${
                  !isPlaying || gameOver 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={initGame}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                Restart
              </button>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-700 max-w-md">
            <h3 className="text-xl font-bold mb-4 text-green-400">How to Play</h3>
            <ul className="text-left space-y-2 text-gray-300">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">→</span>
                <span>Use <span className="font-bold">Arrow Keys</span> or <span className="font-bold">WASD</span> to control the snake</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">→</span>
                <span>Eat the <span className="text-red-500">red food</span> to grow and earn points</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">→</span>
                <span>Avoid hitting walls or yourself</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">→</span>
                <span>Press <span className="font-bold">Space</span> or <span className="font-bold">Enter</span> to pause/resume</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">→</span>
                <span>Game speeds up as your score increases</span>
              </li>
            </ul>
            
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-2 text-blue-400">Controls</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-700 p-3 rounded-lg text-center">
                  <div className="font-bold">Arrow Keys</div>
                  <div className="text-sm text-gray-400">Move Snake</div>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg text-center">
                  <div className="font-bold">WASD</div>
                  <div className="text-sm text-gray-400">Move Snake</div>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg text-center">
                  <div className="font-bold">Space/Enter</div>
                  <div className="text-sm text-gray-400">Pause/Resume</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-gray-400 text-sm">
          <p>Tip: The game gets faster as you score more points!</p>
        </div>
      </div>
    </div>
  );
}