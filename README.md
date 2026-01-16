# 🎯 Darts Master - Application de Scoring & Stats

Une application web moderne (PWA) pour compter les points aux fléchettes (501/301), suivre ses statistiques d'entraînement et analyser sa progression. Conçue pour être installée sur mobile comme une application native.

## ✨ Fonctionnalités Principales

### 🎮 Gameplay
* **Modes de Jeu :** X01 (301, 501) en **Solo** (Entraînement) ou **Duel** (1v1).
* **Interface Intuitive :** Clavier numérique optimisé pour le tactile.
* **Aides de Jeu :** Calculateur automatique de finish (Checkout Hints).
* **Gestion des Sets/Legs :** Configuration flexible du match.
* **Sons & Ambiance :** Effets sonores et synthèse vocale pour les scores.

### 📊 Training Room (Statistiques)
* **Dashboard Pro :** Analyse détaillée des performances en mode Solo.
* **Indicateurs Clés :**
    * Moyenne (Average).
    * Taux de réussite aux doubles (Checkout %).
    * Meilleur Finish (Highest Checkout).
    * Meilleur Leg (Best Leg).
* **Visualisations :**
    * Graphique de progression (Tendance néon).
    * Donut Chart pour la répartition des scores (60+, 100+, 140+, 180).
* **Gamification :** Système de grades (Rookie -> World Class) basé sur la moyenne.

### 📱 Technique & PWA
* **Installable :** Progressive Web App (PWA) installable sur iOS et Android.
* **Offline Ready :** Fonctionne 100% hors ligne.
* **Stockage :** LocalStorage (Données privées sur l'appareil).

---

## 🛠️ Stack Technique

* **Frontend :** React.js + Vite
* **Styling :** Tailwind CSS (Design Glassmorphism / Dark Mode)
* **Stockage :** LocalStorage
* **Graphiques :** Recharts
* **PWA :** Vite-Plugin-PWA

---

## 🚀 Installation Locale

1.  **Cloner le projet :**
    ```bash
    git clone [https://github.com/krathe/darts-coco-apps.git](https://github.com/krathe/darts-coco-apps.git)
    cd darts-master
    ```
2.  **Installer les dépendances :**
    ```bash
    npm install
    ```

3.  **Lancer le serveur de développement :**
    ```bash
    npm run dev
    ```

### App "vibe-codé" avec Google Gemini.