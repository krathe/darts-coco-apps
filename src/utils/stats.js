// src/utils/stats.js

export const calculateAvg = (totalPoints, totalDarts) => {
  if (!totalDarts || totalDarts === 0) return "0.0";
  return ((totalPoints / totalDarts) * 3).toFixed(1);
};

export const calculateCheckoutRate = (successes, attempts) => {
  if (!attempts || attempts === 0) return "0%";
  return Math.round((successes / attempts) * 100) + "%";
};