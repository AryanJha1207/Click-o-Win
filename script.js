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

// --- AUDIO SYSTEM ---
// REPLACE THESE URLS WITH YOUR ACTUAL AUDIO FILES
const bgMusic = new Audio('public/media/Retro-Game.mp3'); // Stick your background music URL here
bgMusic.loop = true;
bgMusic.volume = 0.4; // 40% volume

const clickSound = new Audio('public/media/coin-mario.mp3'); // Sound when clicking a valid box
const bombSound = new Audio('public/media/bomb.mp3'); // Sound when hitting a bomb
const levelUpSound = new Audio('public/media/WinSoundRoblox.mp3'); // Sound when leveling up
const startSound = new Audio('public/media/XPerror.mp3'); // Sound when clicking Play Now

// Start Screen Elements
const startScreen = document.querySelector("#start-screen");
const playBtn = document.querySelector("#play-btn");
const gridBg = document.querySelector("#grid-background");

let level = 1;
let score = 0;
const maxLevels = 10;
let baseStayTime = 2000; // Level 1 stay time
const timeDecreasePerLevel = 300; // Decrease by 300ms per level (Smoother curve)
const minStayTime = 500; // Minimum floor

let gameLoopTimeout;
let isPaused = true; // Started as paused for start screen
let lastPos = { left: 0, top: 0 }; // Track last position
let isBomb = false;
let bgAnimationInterval;

function getPointsNeeded() {
    return level * 5;
}

function getCurrentSpeed() {
    return Math.max(minStayTime, baseStayTime - ((level - 1) * timeDecreasePerLevel));
}

// Background Animation for Start Screen
let activeParticles = []; // Track active grid positions

function animateBackground() {
    const GRID_SIZE = 50; // Matches CSS background-size

    bgAnimationInterval = setInterval(() => {
        const cols = Math.ceil(window.innerWidth / GRID_SIZE);
        const rows = Math.ceil(window.innerHeight / GRID_SIZE);

        // Try up to 5 times to find a valid spot
        let rCol, rRow, isValid = false;

        for (let i = 0; i < 5; i++) {
            rCol = Math.floor(Math.random() * cols);
            rRow = Math.floor(Math.random() * rows);

            // Check distance against all active particles
            // Ensure no active particle is within 4 blocks
            const tooClose = activeParticles.some(p => {
                const dx = p.c - rCol;
                const dy = p.r - rRow;
                return Math.sqrt(dx * dx + dy * dy) < 4;
            });

            if (!tooClose) {
                isValid = true;
                break;
            }
        }

        if (!isValid) return; // Skip this tick if crowded

        // Add to active list
        const particleId = Date.now() + Math.random();
        activeParticles.push({ c: rCol, r: rRow, id: particleId });

        const el = document.createElement("div");
        el.classList.add("grid-item");

        // 20% Bomb, 80% Green Target Box
        if (Math.random() < 0.2) {
            el.classList.add("bomb");
            // Match Game Bomb Style
            el.style.background = "radial-gradient(circle, #ff0000 40%, #000 90%)";
            el.style.border = "2px solid #ff4444";
            el.style.boxShadow = "0 0 15px #ff0000";
            el.style.borderRadius = "50%";
        } else {
            el.classList.add("block");
            // Match Game Target Style
            el.style.background = "rgba(0, 255, 136, 0.1)";
            el.style.border = "2px solid #00ff88";
            el.style.boxShadow = "0 0 8px #00ff88";
        }

        // Center alignment: Grid is 50px, Item is 40px -> Offset by 5px
        el.style.left = (rCol * GRID_SIZE + 5) + "px";
        el.style.top = (rRow * GRID_SIZE + 5) + "px";

        gridBg.appendChild(el);

        // Cleanup after animation (2s)
        setTimeout(() => {
            el.remove();
            activeParticles = activeParticles.filter(p => p.id !== particleId);
        }, 2000);

    }, 400); // Slower spawn rate for cleaner look
}

// Try to play BGM immediately (handle autoplay policy)
function tryPlayBGM() {
    bgMusic.play().catch(() => {
        // If blocked, wait for first interaction
        const startBGM = () => {
            bgMusic.play();
            document.removeEventListener('click', startBGM);
            document.removeEventListener('keydown', startBGM);
        };
        document.addEventListener('click', startBGM);
        document.addEventListener('keydown', startBGM);
    });
}
tryPlayBGM();

// Play Button Logic
playBtn.addEventListener("click", () => {
    // Play Start Sound
    startSound.currentTime = 0;
    startSound.play().catch(e => { });

    // Ensure BGM is playing
    bgMusic.play().catch(e => { });

    const content = document.querySelector(".start-content");

    // Step 1: Fade out Title
    content.style.opacity = "0";

    setTimeout(() => {
        // Step 2: Show Welcome & Rules
        content.innerHTML = `
            <div class="intro-text">
                <span style="color: cyan; font-size: 1.5rem;">HOW TO PLAY:</span><br><br>
                Click on <span class="highlight">GREEN</span> Box to Score.<br><br>
                Avoid <span class="danger">RED</span> Boxes<br>
                 (Resets to Level 1)
            </div>
        `;
        content.style.opacity = "1";

        // Wait for user to read
        setTimeout(() => {
            // Step 3: Fade out Rules
            content.style.opacity = "0";

            setTimeout(() => {
                // Step 4: Show Prize Teaser
                content.innerHTML = `
                    <div class="intro-text">
                        Beat <span class="highlight">LEVEL 10</span><br>
                        to unlock a<br>
                        <span class="legendary">LEGENDARY PRIZE</span>
                    </div>
                `;
                content.style.opacity = "1";

                // Wait for impact
                setTimeout(() => {
                    // Step 5: Warp Shutdown
                    // Stop BG animation now
                    clearInterval(bgAnimationInterval);
                    gridBg.innerHTML = '';

                    // Trigger Warp Transition
                    startScreen.classList.add("warp-out");

                    setTimeout(() => {
                        startScreen.classList.add("hidden");
                        initGame();
                    }, 800); // 0.8s Warp animation

                }, 3500); // Read time for prize

            }, 500); // Fade transition

        }, 5500); // Increased read time for rules (more text)

    }, 500); // Fade transition
});

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
    progressBar.style.setProperty('--progress', `${progress}%`);
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
    // Restart Music
    bgMusic.currentTime = 0;
    bgMusic.play().catch(e => { });
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
    // Stop Game Music
    bgMusic.pause();

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
        bombSound.play().catch(e => { });
        bgMusic.pause(); // Stop music on death
        bgMusic.currentTime = 0;
        showPopup(gameOverPopup);
    } else {
        // Success Click
        clickSound.currentTime = 0; // Rewind to start for rapid clicks
        clickSound.play().catch(e => { });

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
                bgMusic.pause(); // Stop music on win
                // Show Mystery Box instead of instant win
                showPopup(mysteryBoxPopup);
            } else {
                levelUpSound.play().catch(e => { });
                nextLevelDisplay.textContent = level + 1;
                showPopup(levelUpPopup);
            }
        }
    }
});

// Start Animation immediately
animateBackground();
tryPlayBGM(); // Start music (or wait for click)