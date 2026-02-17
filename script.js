const target = document.querySelector("#target");
const container = document.querySelector(".box");
const scoreDisplay = document.querySelector(".count");
const targetScoreDisplay = document.querySelector("#target-score");
const levelDisplay = document.querySelector("#level-count");
const progressBar = document.querySelector("#score-bar");

// Popups
const overlay = document.querySelector("#popup-overlay");
const gameOverPopup = document.querySelector("#game-over-popup");
const levelUpPopup = document.querySelector("#level-up-popup");
const winPopup = document.querySelector("#win-popup");
const nextLevelDisplay = document.querySelector("#next-level-display");

let level = 1;
let score = 0;
const maxLevels = 10;
let baseStayTime = 2000; // Level 1 stay time
const timeDecreasePerLevel = 300; // Decrease by 300ms per level (Smoother curve)
const minStayTime = 500; // Minimum floor

let gameLoopTimeout;
let isPaused = false;
let isBomb = false;

function getPointsNeeded() {
    return level * 5;
}

function getCurrentSpeed() {
    return Math.max(minStayTime, baseStayTime - ((level - 1) * timeDecreasePerLevel));
}

// Initialize
function initGame() {
    level = 1;
    score = 0;
    isPaused = false;
    updateDisplay();
    startLevel();
}

function updateDisplay() {
    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;

    const pointsNeeded = getPointsNeeded();
    targetScoreDisplay.textContent = pointsNeeded;

    // Progress Bar Logic
    const progress = (score / pointsNeeded) * 100;
    progressBar.style.width = `${progress}%`;
}

function showPopup(popupElement) {
    isPaused = true;
    clearTimeout(gameLoopTimeout);
    overlay.classList.remove("hidden");
    // Hide all first
    document.querySelectorAll(".popup").forEach(p => p.classList.add("hidden"));
    // Show specific
    popupElement.classList.remove("hidden");
}

function hidePopups() {
    isPaused = false;
    overlay.classList.add("hidden");
    document.querySelectorAll(".popup").forEach(p => p.classList.add("hidden"));
}

window.restartGame = function () {
    hidePopups();
    initGame();
}

window.nextLevel = function () {
    hidePopups();
    level++;
    score = 0;
    updateDisplay();
    startLevel();
}

function getRandomPosition(element) {
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const elWidth = element.offsetWidth || 60;
    const elHeight = element.offsetHeight || 60;

    const maxLeft = containerWidth - elWidth;
    const maxTop = containerHeight - elHeight;

    const randomLeft = Math.floor(Math.random() * maxLeft);
    const randomTop = Math.floor(Math.random() * maxTop);

    return { left: randomLeft, top: randomTop };
}

function setSpawnState() {
    isBomb = Math.random() < 0.3;

    if (isBomb) {
        target.classList.add("is-bomb");
        target.title = "Don't click!";
    } else {
        target.classList.remove("is-bomb");
        target.title = "Click me!";
    }
}

// Core Logic: Spawn a new target at a random spot
function spawnNewTarget() {
    if (isPaused) return;

    // 1. Move to new spot
    const pos = getRandomPosition(target);
    target.style.left = pos.left + "px";
    target.style.top = pos.top + "px";

    // 2. Set State (Bomb or Box)
    setSpawnState();

    // 3. Reappear
    target.classList.remove("vanished");

    // 4. Schedule next auto-move (standard teleport cycle)
    scheduleNextMove();
}

// Core Logic: Vanish cycle (Auto-move)
function teleport() {
    if (isPaused) return;

    // 1. Vanish
    target.classList.add("vanished");

    // 2. Wait tiny bit (vanish animation), then spawn
    setTimeout(() => {
        spawnNewTarget();
    }, 200);
}

function scheduleNextMove() {
    clearTimeout(gameLoopTimeout);
    let stayDuration = getCurrentSpeed();
    gameLoopTimeout = setTimeout(teleport, stayDuration);
}

function startLevel() {
    console.log(`Starting Level ${level}`);
    spawnNewTarget(); // Start immediately
}

// Event Listener
target.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isPaused) return;

    if (isBomb) {
        showPopup(gameOverPopup);
    } else {
        score++;
        updateDisplay();

        // --- CHANGED LOGIC START ---
        // Instead of immediate teleport/spawn, we wait for the full level duration
        clearTimeout(gameLoopTimeout); // Cancel auto-move
        target.classList.add("vanished"); // Hide immediately

        // Wait for level duration, THEN spawn new target
        let respawnDelay = getCurrentSpeed();
        gameLoopTimeout = setTimeout(() => {
            spawnNewTarget();
        }, respawnDelay);
        // --- CHANGED LOGIC END ---

        if (score >= getPointsNeeded()) {
            if (level >= maxLevels) {
                showPopup(winPopup);
            } else {
                nextLevelDisplay.textContent = level + 1;
                showPopup(levelUpPopup);
            }
        }
    }
});

// Start the game
hidePopups();
initGame();
