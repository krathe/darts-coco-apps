export const STORAGE_KEY = 'darts_app_matches';

export const storage = {
  getAllMatches: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error reading from local storage", error);
      return [];
    }
  },

  saveMatch: (match) => {
    try {
      const matches = storage.getAllMatches();
      // Generate a simple ID if not present
      const newMatch = {
        ...match,
        id: match.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
        created_at: match.created_at || new Date().toISOString()
      };
      const updatedMatches = [...matches, newMatch];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMatches));
      return newMatch;
    } catch (error) {
      console.error("Error saving match to local storage", error);
      return null;
    }
  },

  saveMatches: (newMatches) => {
      try {
          const matches = storage.getAllMatches();
          const existingIds = new Set(matches.map(m => m.id));
          
          const processedMatches = newMatches.map(m => ({
              ...m,
              id: m.id || Date.now().toString() + Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9),
              created_at: m.created_at || new Date().toISOString()
          }));

          const uniqueNewMatches = processedMatches.filter(m => !existingIds.has(m.id));
          
          const updatedMatches = [...matches, ...uniqueNewMatches];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMatches));
          return true;
      } catch(error) {
          console.error("Error bulk saving matches", error);
          return false;
      }
  },

  deleteMatch: (id) => {
    try {
      const matches = storage.getAllMatches();
      const updatedMatches = matches.filter(m => m.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMatches));
    } catch (error) {
      console.error("Error deleting match", error);
    }
  },

  deleteMatches: (ids) => {
    try {
        const idsSet = new Set(ids);
        const matches = storage.getAllMatches();
        const updatedMatches = matches.filter(m => !idsSet.has(m.id));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMatches));
    } catch (error) {
        console.error("Error deleting matches", error);
    }
  },

  clearAll: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing storage", error);
    }
  }
};
