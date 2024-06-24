import React, { useState, useEffect, useCallback } from 'react';

const Game = () => {
  const [score, setScore] = useState(0);
  const [cameraPosition, setCameraPosition] = useState(50);
  const [models, setModels] = useState([]);
  const [flash, setFlash] = useState(null);
  const [gameState, setGameState] = useState('notStarted'); // 'notStarted', 'playing', 'gameOver'
  const [modelsSpawned, setModelsSpawned] = useState(0);

  const MAX_MODELS = 100;

  const handleMouseMove = useCallback((e) => {
    if (gameState !== 'playing') return;
    const gameArea = e.currentTarget.getBoundingClientRect();
    const newPosition = ((e.clientX - gameArea.left) / gameArea.width) * 100;
    setCameraPosition(Math.max(0, Math.min(100, newPosition)));
  }, [gameState]);

  const handleClick = () => {
    if (gameState !== 'playing') return;
    if (!flash) {
      setFlash({ position: cameraPosition, height: 0 });
    }
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setModels([]);
    setModelsSpawned(0);
  };

  const restartGame = () => {
    startGame();
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      // Update models
      setModels(prevModels => {
        const updatedModels = prevModels
          .map(model => ({
            ...model,
            position: model.direction === 'right' ? model.position + model.speed : model.position - model.speed
          }))
          .filter(model => model.position >= 0 && model.position <= 100);

        if (Math.random() < 0.05 && updatedModels.length < 15 && modelsSpawned < MAX_MODELS) {
          const direction = Math.random() < 0.5 ? 'left' : 'right';
          const row = Math.floor(Math.random() * 3);
          const modelType = Math.floor(Math.random() * 3) + 1; // Random number between 1 and 3
          updatedModels.push({
            id: Date.now(),
            position: direction === 'left' ? 100 : 0,
            speed: Math.random() * 0.5 + 0.5,
            direction,
            row,
            modelType
          });
          setModelsSpawned(prev => prev + 1);
        }

        return updatedModels;
      });

      // Update flash
      setFlash(prevFlash => {
        if (prevFlash) {
          const newFlash = { ...prevFlash, height: prevFlash.height + 5 };
          
          // Check for collisions
          setModels(prevModels => {
            let pointScored = false;
            const remainingModels = prevModels.filter(model => {
              const modelBottom = 16 + model.row * 20;
              const modelTop = modelBottom + 8;
              const isHit = Math.abs(model.position - prevFlash.position) < 5 && 
                            newFlash.height >= modelBottom && newFlash.height <= modelTop;
              if (isHit && !pointScored) {
                setScore(prev => prev + 1);
                pointScored = true;
              }
              return !isHit;
            });
            return remainingModels;
          });

          return newFlash.height >= 100 ? null : newFlash;
        }
        return prevFlash;
      });

      // Check for game over
      if (modelsSpawned >= MAX_MODELS && models.length === 0) {
        setGameState('gameOver');
      }
    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameState, modelsSpawned, models.length]);

  return (
    <div className="game-container" onMouseMove={handleMouseMove} onClick={handleClick}>
      <div className="score">Score: {score}</div>
      <div className="models-count">Models: {modelsSpawned}/{MAX_MODELS}</div>
      
      {models.map(model => (
        <div 
          key={model.id} 
          className="model"
          style={{ 
            left: `${model.position}%`, 
            bottom: `${16 + model.row * 20}%`,
            backgroundImage: `url(${process.env.PUBLIC_URL}/model${model.modelType}.png)`,
            transform: model.direction === 'left' ? 'scaleX(-1)' : 'none'
          }}
        />
      ))}
      
      {flash && (
        <div 
          className="flash"
          style={{ 
            left: `${flash.position}%`,
            bottom: `${flash.height}%`,
            transform: 'translate(-50%, 50%)'
          }}
        />
      )}
      
      <div 
        className="photographer"
        style={{ 
          left: `calc(${cameraPosition}% - 2rem)`,
          backgroundImage: `url(${process.env.PUBLIC_URL}/photog.png)`
        }}
      />

      {gameState === 'notStarted' && (
        <div className="game-overlay">
          <button 
            className="game-button"
            onClick={startGame}
          >
            Start Game
          </button>
        </div>
      )}

      {gameState === 'gameOver' && (
        <div className="game-overlay">
          <div className="game-over-panel">
            <h2 className="game-over-title">Game Over!</h2>
            <p className="game-over-score">Final Score: {score}</p>
            <button 
              className="game-button"
              onClick={restartGame}
            >
              Restart Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;