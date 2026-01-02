import { useState, useEffect, useRef } from 'react';
import { getCheckoutGuide } from '../utils/checkouts';
import { supabase } from '../supabaseClient';
import { playSound } from '../utils/sound';
import { calculateAvg, calculateCheckoutRate } from '../utils/stats';

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

  const [historyStack, setHistoryStack] = useState([]);
  const saveLock = useRef(false);

  // --- SAVE/UNDO ---
  const saveSnapshot = () => {
    if (!players.length) return;
    const snapshot = {
      players: JSON.parse(JSON.stringify(players)),
      currentPlayerIndex, legStarterIndex, matchScore: { ...matchScore },
      winner, legWinner, processingWin
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
    setHistoryStack(newStack);
    setCurrentTurnDarts([]);
    setProcessingWin(false);
  };

  useEffect(() => {
    let timer;
    if (currentTurnDarts.length === 3 && !winner && !legWinner && !processingWin) {
      const isLastDartBust = currentTurnDarts[2]?.isBust;
      if (!isLastDartBust) {
        timer = setTimeout(() => performSwitch(false), 1000);
      }
    }
    return () => clearTimeout(timer);
  }, [currentTurnDarts, winner, legWinner, processingWin]);

  const isCheckoutAttempt = (score) => (score <= 40 && score % 2 === 0 && score > 0) || score === 50;

  const calculateStats = (player) => {
    if (!player) return { avg: "0.0", checkout: "0%" };
    return {
      avg: calculateAvg(player.stats.totalPointsScored, player.stats.totalDarts),
      checkout: calculateCheckoutRate(player.stats.checkoutSuccesses, player.stats.doublesAttempted)
    };
  };

  // --- SAUVEGARDE MULTI-JOUEURS ---
  const saveToHistory = async (winnerPlayer, allPlayers, mode, gameType) => {
    if (saveLock.current) return;
    saveLock.current = true;

    // On boucle sur TOUS les joueurs (Gagnant ET Perdant)
    const matchesToInsert = allPlayers.map(player => {
        const stats = calculateStats(player);
        const isWinner = player.id === winnerPlayer.id;
        
        return {
            mode: mode,
            game_type: gameType,
            // Astuce : On utilise la colonne 'winner_name' pour stocker le nom du joueur de cette ligne
            // C'est ce qui permettra de le retrouver dans le filtre "Joueur" des stats
            winner_name: player.name, 
            result: isWinner ? 'WIN' : 'LOSS',
            avg: parseFloat(stats.avg),
            darts: player.stats.totalDarts,
            checkout: stats.checkout,
            highest_checkout: player.stats.highestCheckout || 0,
            scores_60plus: player.stats.scores60,
            scores_100plus: player.stats.scores100,
            scores_140plus: player.stats.scores140,
            scores_180s: player.stats.scores180,
            created_at: new Date().toISOString()
        };
    });
    
    const saveLocal = () => {
        try {
            const q = JSON.parse(localStorage.getItem('unsynced_matches') || '[]');
            localStorage.setItem('unsynced_matches', JSON.stringify([...q, ...matchesToInsert]));
        } catch (e) { console.error("Erreur save local", e); }
    };

    if (!navigator.onLine) { 
        saveLocal(); 
    } else {
      try {
        const { error } = await supabase.from('matches').insert(matchesToInsert);
        if (error) throw error;
      } catch (err) { 
          console.error("Erreur Supabase:", err); 
          saveLocal(); 
      }
    }
  };

  // --- SETUP & ACTIONS ---
  const startGame = (config) => {
    setMatchConfig({ setsToWin: config.setsToWin || 1, legsToWin: config.legsToWin || 1, mode: config.mode });
    setMatchScore({ p1Sets: 0, p1Legs: 0, p2Sets: 0, p2Legs: 0 });
    const startScore = config.mode;
    const createPlayer = (id, name) => ({
      id, name, score: startScore, initialScore: startScore, history: [],
      stats: { totalDarts: 0, doublesAttempted: 0, totalPointsScored: 0, checkoutSuccesses: 0, scores60: 0, scores100: 0, scores140: 0, scores180: 0, highestCheckout: 0 }
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
    setHistoryStack([]);
    saveLock.current = false;
    playSound('START'); 
  };

  const addDart = (baseScore, multiplier) => {
    if (winner || legWinner || processingWin || currentTurnDarts.length >= 3) return;
    const points = baseScore * multiplier;
    let text = `${baseScore}`;
    if (multiplier === 2) text = `D${baseScore}`;
    if (multiplier === 3) text = `T${baseScore}`;
    if (baseScore === 25) text = "25"; if (baseScore === 50) text = "BULL"; if (baseScore === 0) text = "MISS";

    const currentPlayer = players[currentPlayerIndex];
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
    const pointsScored = isBustTurn ? 0 : dartsToProcess.reduce((acc, d) => acc + d.points, 0);
    if (isBustTurn) playSound('BUST'); else playSound('SCORE', pointsScored);
    let doublesTries = 0;
    dartsToProcess.forEach(d => { if (d.isDoubleTry) doublesTries++; });
    updatePlayerStats(pointsScored, dartsToProcess.length, doublesTries);
  };

  const updatePlayerStats = (points, dartsCount, doublesTries) => {
    setPlayers(prev => {
        const newPlayers = [...prev];
        const p = { ...newPlayers[currentPlayerIndex] };
        p.score -= points;
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
            // ICI: On passe bien 'newPlayers' qui contient les stats des 2 joueurs
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

  return {
    gameState, setGameState, players, currentPlayer: players[currentPlayerIndex],
    currentTurnDarts, addDart, undoLastDart, validateTurn: () => performSwitch(false),
    winner, legWinner, startNextLeg, matchScore, matchConfig,
    startGame, backToMenu, checkoutHint, calculateStats, undoTurn, canUndo: historyStack.length > 0
  };
};