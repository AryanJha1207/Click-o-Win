const target = document.querySelector("#target");
const container = document.querySelector(".box");
const scoreDisplay = document.querySelector(".count");
const targetScoreDisplay = document.querySelector("#target-score"); // New Element
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
// const pointsPerLevel = 5; // Removed constant
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

// Global functions for buttons
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

    // Dynamic size calculation (was hardcoded 60)
    const elWidth = element.offsetWidth || 60;
    const elHeight = element.offsetHeight || 60;

    const maxLeft = containerWidth - elWidth;
    const maxTop = containerHeight - elHeight;

    const randomLeft = Math.floor(Math.random() * maxLeft);
    const randomTop = Math.floor(Math.random() * maxTop);

    return { left: randomLeft, top: randomTop };
}

function setSpawnState() {
    // 30% chance to be a bomb
    // But ONLY if we haven't just started (give a freebie? nah)
    isBomb = Math.random() < 0.3;

    if (isBomb) {
        target.classList.add("is-bomb");
        target.title = "Don't click!";
    } else {
        target.classList.remove("is-bomb");
        target.title = "Click me!";
    }
}

function teleport() {
    if (isPaused) return;

    // 1. Vanish
    target.classList.add("vanished");

    // 2. Wait a tiny bit (simulating vanish time)
    setTimeout(() => {
        if (isPaused) return;

        // 3. Move to new spot
        const pos = getRandomPosition(target);
        target.style.left = pos.left + "px";
        target.style.top = pos.top + "px";

        // 4. Set State (Bomb or Box)
        setSpawnState();

        // 5. Reappear
        target.classList.remove("vanished");

        // 6. Schedule next teleport
        scheduleNextMove();

    }, 200); // 200ms vanish time
}

function scheduleNextMove() {
    clearTimeout(gameLoopTimeout);

    // Calculate speed
    // L1: 2000, L2: 1700, L3: 1400... Floor 500
    let stayDuration = Math.max(minStayTime, baseStayTime - ((level - 1) * timeDecreasePerLevel));

    gameLoopTimeout = setTimeout(teleport, stayDuration);
}

function startLevel() {
    console.log(`Starting Level ${level}`);
    teleport();
}

// Event Listener
target.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isPaused) return;

    if (isBomb) {
        // BAM!
        showPopup(gameOverPopup);
    } else {
        score++;
        updateDisplay();

        // Immediate teleport on success
        clearTimeout(gameLoopTimeout);
        teleport();

        if (score >= getPointsNeeded()) {
            // Level Complete
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
hidePopups(); // Ensure hidden on load
initGame();
