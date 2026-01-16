import { useState, useEffect, useRef } from 'react';
import { getCheckoutGuide } from '../utils/checkouts';
import { storage } from '../utils/storage';
import { playSound } from '../utils/sound';
import { calculateAvg, calculateCheckoutRate } from '../utils/stats';

const BOBS27_TARGETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25];

export const useGameLogic = () => {
  const [gameState, setGameState] = useState('SETUP'); 
  const [players, setPlayers] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [legStarterIndex, setLegStarterIndex] = useState(0);
  const [winner, setWinner] = useState(null);
  const [legWinner, setLegWinner] = useState(null);
  const [currentTurnDarts, setCurrentTurnDarts] = useState([]); 
  const [checkoutHint, setCheckoutHint] = useState(null);
  const [matchConfig, setMatchConfig] = useState({ setsToWin: 1, legsToWin: 1, mode: 501 });
  const [matchScore, setMatchScore] = useState({ p1Sets: 0, p1Legs: 0, p2Sets: 0, p2Legs: 0 });
  const [processingWin, setProcessingWin] = useState(false);
  
  // Bob's 27 State
  const [bobs27RoundIndex, setBobs27RoundIndex] = useState(0);
  
  // NOUVEAU : Pour stocker la config et pouvoir rejouer
  const [lastConfig, setLastConfig] = useState(null);

  const [historyStack, setHistoryStack] = useState([]);
  const saveLock = useRef(false);

  // --- SAVE/UNDO ---
  const saveSnapshot = () => {
    if (!players.length) return;
    const snapshot = {
      players: JSON.parse(JSON.stringify(players)),
      currentPlayerIndex, legStarterIndex, matchScore: { ...matchScore },
      winner, legWinner, processingWin, bobs27RoundIndex
    };
    setHistoryStack((prev) => [...prev, snapshot]);
  };

  const undoTurn = () => {
    if (historyStack.length === 0 || processingWin) return;
    const lastSnapshot = historyStack[historyStack.length - 1];
    const newStack = historyStack.slice(0, -1);
    setPlayers(lastSnapshot.players);
    setCurrentPlayerIndex(lastSnapshot.currentPlayerIndex);
    setLegStarterIndex(lastSnapshot.legStarterIndex);
    setMatchScore(lastSnapshot.matchScore);
    setWinner(lastSnapshot.winner);
    setLegWinner(lastSnapshot.legWinner);
    setBobs27RoundIndex(lastSnapshot.bobs27RoundIndex || 0);
    setHistoryStack(newStack);
    setCurrentTurnDarts([]);
    setProcessingWin(false);
  };

  useEffect(() => {
    let timer;
    if (currentTurnDarts.length === 3 && !winner && !legWinner && !processingWin) {
      const isLastDartBust = currentTurnDarts[2]?.isBust;
      // Pour Bob's 27, on switch toujours après 3 fléchettes
      if (!isLastDartBust || matchConfig.mode === 'BOBS27') {
        timer = setTimeout(() => performSwitch(false), 1000);
      }
    }
    return () => clearTimeout(timer);
  }, [currentTurnDarts, winner, legWinner, processingWin, matchConfig.mode]);

  const isCheckoutAttempt = (score) => (score <= 40 && score % 2 === 0 && score > 0) || score === 50;

  const calculateStats = (player) => {
    if (!player) return { avg: "0.0", checkout: "0%" };
    // Bob's 27 Stats: Just return Score
    if (matchConfig.mode === 'BOBS27') {
         return { avg: player.score.toString(), checkout: "-" };
    }
    return {
      avg: calculateAvg(player.stats.totalPointsScored, player.stats.totalDarts),
      checkout: calculateCheckoutRate(player.stats.checkoutSuccesses, player.stats.doublesAttempted)
    };
  };

  // --- SAUVEGARDE DB ---
  const saveToHistory = async (winnerPlayer, allPlayers, mode, gameType) => {
    if (saveLock.current) return;
    saveLock.current = true;

    const matchesToInsert = allPlayers.map(player => {
        const stats = calculateStats(player);
        const isWinner = player.id === winnerPlayer.id;
        
        return {
            mode: mode === 'BOBS27' ? -27 : mode, // Convention pour Bob's 27 dans la DB ? Ou juste utiliser 27 ?
            game_type: gameType,
            winner_name: player.name,
            result: isWinner ? 'WIN' : 'LOSS',
            avg: mode === 'BOBS27' ? player.score : parseFloat(stats.avg), // Pour Bob's 27, avg = Score Final
            darts: player.stats.totalDarts,
            checkout: stats.checkout,
            highest_checkout: player.stats.highestCheckout || 0,
            scores_60plus: player.stats.scores60,
            scores_100plus: player.stats.scores100,
            scores_140plus: player.stats.scores140,
            scores_180s: player.stats.scores180,
            match_details: player.history,
            created_at: new Date().toISOString()
        };
    });
    
    // Hack pour stocker 27 dans la colonne mode (qui est numeric)
    matchesToInsert.forEach(m => {
        if (m.mode === 'BOBS27') m.mode = 27;
    });

    storage.saveMatches(matchesToInsert);
  };

  // --- SETUP & ACTIONS ---
  const startGame = (config) => {
    setLastConfig(config); // SAUVEGARDE DE LA CONFIG POUR LE REPLAY
    
    setMatchConfig({ setsToWin: config.setsToWin || 1, legsToWin: config.legsToWin || 1, mode: config.mode });
    setMatchScore({ p1Sets: 0, p1Legs: 0, p2Sets: 0, p2Legs: 0 });
    
    const startScore = config.mode === 'BOBS27' ? 27 : config.mode;
    
    const createPlayer = (id, name) => ({
      id, name, score: startScore, initialScore: startScore, history: [],
      stats: { totalDarts: 0, doublesAttempted: 0, totalPointsScored: 0, checkoutSuccesses: 0, scores60: 0, scores100: 0, scores140: 0, scores180: 0, highestCheckout: 0 },
      isEliminated: false // Pour Bob's 27
    });
    const newPlayers = [createPlayer(1, config.p1Name)];
    if (config.gameType === 'DUEL') newPlayers.push(createPlayer(2, config.p2Name));
    setPlayers(newPlayers);
    setGameState('PLAYING');
    setCurrentPlayerIndex(0);
    setLegStarterIndex(0);
    setCurrentTurnDarts([]);
    setWinner(null);
    setLegWinner(null);
    setProcessingWin(false);
    setBobs27RoundIndex(0);
    setHistoryStack([]);
    saveLock.current = false;
    playSound('START'); 
  };

  // NOUVELLE FONCTION RESTART
  const restartGame = () => {
    if (lastConfig) {
        startGame(lastConfig);
    }
  };

  const addDart = (baseScore, multiplier) => {
    if (winner || legWinner || processingWin || currentTurnDarts.length >= 3) return;
    
    const currentPlayer = players[currentPlayerIndex];
    if (currentPlayer.isEliminated) return; // Should not happen if logic is correct

    // Logic Bob's 27
    if (matchConfig.mode === 'BOBS27') {
        const target = BOBS27_TARGETS[bobs27RoundIndex];
        let isHit = false;
        let points = 0;
        let text = `${baseScore}`;
        
        if (multiplier === 2) text = `D${baseScore}`;
        if (multiplier === 3) text = `T${baseScore}`;
        if (baseScore === 25) text = "25"; if (baseScore === 50) text = "BULL"; if (baseScore === 0) text = "MISS";

        // Check Valid Hit (Double of Target)
        if (target === 25) {
            // Bullseye (Double 25) is represented as 50 in app usually, or 25 with mult 2
            if (baseScore === 50 || (baseScore === 25 && multiplier === 2)) {
                isHit = true;
                points = 50; 
            }
        } else {
            if (baseScore === target && multiplier === 2) {
                isHit = true;
                points = target * 2;
            }
        }
        
        setCurrentTurnDarts(prev => [...prev, { points, text, multiplier, baseScore, isBobs27Hit: isHit }]);
        return;
    }

    // Logic Classique X01
    const points = baseScore * multiplier;
    let text = `${baseScore}`;
    if (multiplier === 2) text = `D${baseScore}`;
    if (multiplier === 3) text = `T${baseScore}`;
    if (baseScore === 25) text = "25"; if (baseScore === 50) text = "BULL"; if (baseScore === 0) text = "MISS";

    const currentTurnPoints = currentTurnDarts.reduce((acc, d) => acc + d.points, 0);
    const remaining = currentPlayer.score - currentTurnPoints - points;

    if (remaining < 0 || remaining === 1) {
      const bustDart = { ...{ points, text, multiplier, baseScore }, isBust: true };
      const finalDarts = [...currentTurnDarts, bustDart];
      setCurrentTurnDarts(finalDarts);
      setTimeout(() => performSwitch(true, finalDarts), 1500);
      return;
    }
    if (remaining === 0) {
      if (multiplier === 2 || baseScore === 50) {
        const winningDarts = [...currentTurnDarts, { points, text, multiplier, baseScore, isDoubleTry: true }];
        setCurrentTurnDarts(winningDarts);
        handleLegWin(winningDarts);
        return;
      } else {
        const bustDart = { ...{ points, text, multiplier, baseScore }, isBust: true };
        const finalDarts = [...currentTurnDarts, bustDart];
        setCurrentTurnDarts(finalDarts);
        setTimeout(() => performSwitch(true, finalDarts), 1500);
        return;
      }
    }
    const isCheckout = isCheckoutAttempt(currentPlayer.score - currentTurnPoints);
    setCurrentTurnDarts(prev => [...prev, { points, text, multiplier, baseScore, isDoubleTry: isCheckout }]);
  };

  const undoLastDart = () => { if (!processingWin) setCurrentTurnDarts(prev => prev.slice(0, -1)); };

  const performSwitch = (isBustTurn = false, forcedDarts = null) => {
    saveSnapshot();
    const dartsToProcess = forcedDarts || currentTurnDarts;
    
    if (matchConfig.mode === 'BOBS27') {
        processBobs27Turn(dartsToProcess);
        return;
    }

    const pointsScored = isBustTurn ? 0 : dartsToProcess.reduce((acc, d) => acc + d.points, 0);
    if (isBustTurn) playSound('BUST'); else playSound('SCORE', pointsScored);
    
    let doublesTries = 0;
    dartsToProcess.forEach(d => { if (d.isDoubleTry) doublesTries++; });
    
    updatePlayerStats(pointsScored, dartsToProcess, doublesTries, isBustTurn);
  };

  const processBobs27Turn = (darts) => {
    const target = BOBS27_TARGETS[bobs27RoundIndex];
    const targetValue = target === 25 ? 50 : target * 2;
    
    const hits = darts.filter(d => d.isBobs27Hit).length;
    let scoreChange = 0;
    let isBust = false;

    if (hits > 0) {
        scoreChange = hits * targetValue;
        playSound('SCORE', scoreChange); // Sound for points
    } else {
        scoreChange = -targetValue;
        isBust = true; // Visual effect for "Missed"
        playSound('BUST'); 
    }

    setPlayers(prev => {
        const newPlayers = [...prev];
        const p = { ...newPlayers[currentPlayerIndex] };
        p.score += scoreChange;
        
        // Game Over Condition (Elimination)
        if (p.score < 0) {
            p.isEliminated = true;
        }

        const turnDetail = {
            total: scoreChange,
            is_bust: isBust,
            darts: darts.map(d => ({
                val: d.baseScore,
                mult: d.multiplier,
                txt: d.text,
                pts: d.isBobs27Hit ? d.points : 0 
            }))
        };
        p.history = [...p.history, turnDetail];
        
        p.stats.totalDarts += darts.length;
        if (hits > 0) p.stats.totalPointsScored += scoreChange;

        newPlayers[currentPlayerIndex] = p;
        return newPlayers;
    });

    setCurrentTurnDarts([]);

    // Check Global Game Over or Next Round
    setTimeout(() => {
        checkBobs27GameState();
    }, 500);
  };

  const checkBobs27GameState = () => {
    setPlayers(currentPlayers => {
        const activePlayers = currentPlayers.filter(p => !p.isEliminated);
        
        // 1. All players eliminated
        if (activePlayers.length === 0) {
            const sorted = [...currentPlayers].sort((a,b) => b.score - a.score);
            setWinner(sorted[0]);
            playSound('WIN_MATCH');
            saveToHistory(sorted[0], currentPlayers, 'BOBS27', currentPlayers.length > 1 ? 'DUEL' : 'SOLO');
            return currentPlayers;
        }

        const nextPlayerIndex = (currentPlayerIndex + 1) % currentPlayers.length;
        let foundNext = false;
        let testIndex = nextPlayerIndex;
        let loopCount = 0;
        
        while (!foundNext && loopCount < currentPlayers.length) {
             if (!currentPlayers[testIndex].isEliminated) {
                 foundNext = true;
             } else {
                 testIndex = (testIndex + 1) % currentPlayers.length;
                 loopCount++;
             }
        }

        if (testIndex <= currentPlayerIndex) {
            const nextRound = bobs27RoundIndex + 1;
            if (nextRound >= BOBS27_TARGETS.length) {
                // Game Finished (Completed 25)
                const sorted = [...activePlayers].sort((a,b) => b.score - a.score);
                setWinner(sorted[0]);
                playSound('WIN_MATCH');
                saveToHistory(sorted[0], currentPlayers, 'BOBS27', currentPlayers.length > 1 ? 'DUEL' : 'SOLO');
                return currentPlayers;
            }
            setBobs27RoundIndex(nextRound);
        }
        
        setCurrentPlayerIndex(testIndex);
        return currentPlayers;
    });
  };

  const updatePlayerStats = (points, darts, doublesTries, isBust) => {
    const dartsCount = darts.length;
    
    setPlayers(prev => {
        const newPlayers = [...prev];
        const p = { ...newPlayers[currentPlayerIndex] };
        p.score -= points;

        const turnDetail = {
            total: points,
            is_bust: isBust,
            darts: darts.map(d => ({
                val: d.baseScore,
                mult: d.multiplier,
                txt: d.text,
                pts: d.points
            }))
        };
        p.history = [...p.history, turnDetail];

        p.stats = {
            ...p.stats,
            totalDarts: p.stats.totalDarts + dartsCount,
            doublesAttempted: p.stats.doublesAttempted + doublesTries,
            totalPointsScored: p.stats.totalPointsScored + points,
            scores180: points === 180 ? p.stats.scores180 + 1 : p.stats.scores180,
            scores140: (points >= 140 && points < 180) ? p.stats.scores140 + 1 : p.stats.scores140,
            scores100: (points >= 100 && points < 140) ? p.stats.scores100 + 1 : p.stats.scores100,
            scores60: (points >= 60 && points < 100) ? p.stats.scores60 + 1 : p.stats.scores60,
        };
        newPlayers[currentPlayerIndex] = p;
        return newPlayers;
    });
    setCurrentTurnDarts([]);
    if (players.length > 1) setCurrentPlayerIndex(prev => (prev === 0 ? 1 : 0));
  };

  const handleLegWin = (winningDarts) => {
    saveSnapshot();
    setProcessingWin(true);
    const totalPoints = winningDarts.reduce((acc, d) => acc + d.points, 0);
    const dartsCount = winningDarts.length;
    let doublesTries = 0;
    winningDarts.forEach(d => { if (d.isDoubleTry) doublesTries++; });

    const newPlayers = [...players];
    const player = { ...newPlayers[currentPlayerIndex] };
    player.score -= totalPoints;
    
    const turnDetail = {
        total: totalPoints,
        is_bust: false,
        darts: winningDarts.map(d => ({ val: d.baseScore, mult: d.multiplier, txt: d.text, pts: d.points }))
    };
    player.history = [...player.history, turnDetail];

    player.stats.totalDarts += dartsCount;
    player.stats.doublesAttempted += doublesTries;
    player.stats.totalPointsScored += totalPoints;
    player.stats.checkoutSuccesses += 1;
    if (totalPoints > player.stats.highestCheckout) player.stats.highestCheckout = totalPoints;
    if (totalPoints === 180) player.stats.scores180++;
    else if (totalPoints >= 140) player.stats.scores140++;
    else if (totalPoints >= 100) player.stats.scores100++;
    else if (totalPoints >= 60) player.stats.scores60++;
    newPlayers[currentPlayerIndex] = player;
    setPlayers(newPlayers);

    const winnerId = player.id;
    let newScore = { ...matchScore };
    if (winnerId === 1) newScore.p1Legs += 1; else newScore.p2Legs += 1;
    let setWon = false; let matchWon = false;

    if (newScore.p1Legs >= matchConfig.legsToWin) {
        newScore.p1Sets += 1; newScore.p1Legs = 0; newScore.p2Legs = 0; setWon = true;
    } else if (newScore.p2Legs >= matchConfig.legsToWin) {
        newScore.p2Sets += 1; newScore.p1Legs = 0; newScore.p2Legs = 0; setWon = true;
    }
    if (newScore.p1Sets >= matchConfig.setsToWin || newScore.p2Sets >= matchConfig.setsToWin) matchWon = true;
    setMatchScore(newScore);

    if (matchWon) {
        playSound('WIN_MATCH');
        setTimeout(() => {
            setWinner(player);
            saveToHistory(player, newPlayers, player.initialScore, newPlayers.length > 1 ? 'DUEL' : 'SOLO');
            setProcessingWin(false);
        }, 1500);
    } else {
        playSound('WIN_LEG');
        setLegWinner({ player: player, setWon: setWon });
        setProcessingWin(false);
    }
  };

  const startNextLeg = () => {
    saveSnapshot();
    const newPlayers = players.map(p => ({ ...p, score: p.initialScore, history: [] }));
    setPlayers(newPlayers);
    setLegWinner(null);
    setCurrentTurnDarts([]);
    const nextStarter = legStarterIndex === 0 ? 1 : 0;
    setLegStarterIndex(nextStarter);
    setCurrentPlayerIndex(nextStarter);
  };

  useEffect(() => {
    if (!players.length || winner || legWinner) { setCheckoutHint(null); return; }
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;
    const pointsInTurn = currentTurnDarts.reduce((acc, d) => acc + d.points, 0);
    const remainingScore = currentPlayer.score - pointsInTurn;
    if (remainingScore <= 170 && remainingScore >= 2 && currentTurnDarts.length < 3) {
      setCheckoutHint(getCheckoutGuide(remainingScore));
    } else setCheckoutHint(null);
  }, [players, currentPlayerIndex, currentTurnDarts, winner, legWinner]);

  const backToMenu = () => { setGameState('SETUP'); setWinner(null); setLegWinner(null); };

  const currentBobs27Target = matchConfig.mode === 'BOBS27' ? BOBS27_TARGETS[bobs27RoundIndex] : null;

  return {
    gameState, setGameState, players, currentPlayer: players[currentPlayerIndex],
    currentTurnDarts, addDart, undoLastDart, validateTurn: () => performSwitch(false),
    winner, legWinner, startNextLeg, matchScore, matchConfig,
    startGame, backToMenu, checkoutHint, calculateStats, undoTurn, canUndo: historyStack.length > 0,
    restartGame, currentBobs27Target
  };
};