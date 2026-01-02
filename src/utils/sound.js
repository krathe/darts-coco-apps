// src/utils/sound.js

// Dictionnaire des fichiers MP3
// IMPORTANT : Les fichiers doivent être dans le dossier "public/sounds/" à la racine du projet
const SOUND_FILES = {
  START: '/sounds/gameon.mp3',
  180: '/sounds/180.mp3',
  BUST: '/sounds/bust.mp3',
  WIN_LEG: '/sounds/gameshot.mp3',
  WIN_MATCH: '/sounds/darts-winner.mp3', 
};

let isAppMuted = false;

export const setAppMute = (muted) => {
  isAppMuted = muted;
  if (muted && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

export const playSound = (type, value = null) => {
  if (isAppMuted) return;

  // --- 1. GESTION MP3 ---
  let soundToPlay = null;

  // Cas spécial pour le 180
  if (type === 'SCORE' && value === 180) {
    soundToPlay = SOUND_FILES[180];
  } else if (SOUND_FILES[type]) {
    soundToPlay = SOUND_FILES[type];
  }

  if (soundToPlay) {
    console.log(`🎵 Tentative lecture MP3 : ${soundToPlay}`); // Log de debug
    const audio = new Audio(soundToPlay);
    audio.volume = 1.0;
    
    // On joue le son et on loggue l'erreur si ça échoue (ex: fichier introuvable)
    audio.play().catch(error => {
      console.error("❌ Erreur lecture MP3 (Vérifie le dossier public/sounds) :", error);
    });
    
    return; // On s'arrête là, pas de voix robot si on a un MP3
  }

  // --- 2. GESTION VOIX (TTS) ---
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  let text = "";
  if (type === 'SCORE') text = value.toString();
  else return;

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.name.includes("Google UK English Male")) || 
                         voices.find(v => v.name === "Daniel") ||
                         voices.find(v => v.lang.includes("en-GB"));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
    utterance.pitch = 0.9;
    utterance.rate = 1.1;
  }

  console.log(`🗣️ Voix : ${text}`);
  window.speechSynthesis.speak(utterance);
};