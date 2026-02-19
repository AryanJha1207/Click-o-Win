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
const mysteryBoxPopup = document.querySelector("#mystery-box-popup");
const videoPopup = document.querySelector("#video-popup");
const mysteryBoxBtn = document.querySelector("#mystery-box");
const rickRollFrame = document.querySelector("#rickroll-frame");

let level = 1;
let score = 0;
const maxLevels = 10;
let baseStayTime = 2000; // Level 1 stay time
const timeDecreasePerLevel = 300; // Decrease by 300ms per level (Smoother curve)
const minStayTime = 500; // Minimum floor

let gameLoopTimeout;
let isPaused = false;
let lastPos = { left: 0, top: 0 }; // Track last position
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
    lastPos = { left: 0, top: 0 }; // Reset
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
    // Stop video if any
    rickRollFrame.src = "";
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

// Mystery Box Click Event
mysteryBoxBtn.addEventListener("click", () => {
    // Hide mystery box popup
    mysteryBoxPopup.classList.add("hidden");
    // Show video popup
    videoPopup.classList.remove("hidden");
    // Start Rick Roll
    rickRollFrame.src = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1";
});

function getRandomPosition(element) {
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const elWidth = element.offsetWidth || 60;
    const elHeight = element.offsetHeight || 60;

    const maxLeft = containerWidth - elWidth;
    const maxTop = containerHeight - elHeight;

    let randomLeft, randomTop;
    let attempts = 0;
    const minDistance = 200; // Force movement of at least 200px

    const currentLeft = lastPos.left;
    const currentTop = lastPos.top;

    do {
        randomLeft = Math.floor(Math.random() * maxLeft);
        randomTop = Math.floor(Math.random() * maxTop);

        const dist = Math.sqrt(Math.pow(randomLeft - currentLeft, 2) + Math.pow(randomTop - currentTop, 2));

        if (dist > minDistance) break;
        attempts++;
    } while (attempts < 50);

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

    // Update tracking
    lastPos = pos;

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
                // Show Mystery Box instead of instant win
                showPopup(mysteryBoxPopup);
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