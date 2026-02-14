let box1 = document.querySelector(".box1");
let container = document.querySelector(".box");
let audio = document.getElementById("song");
let playBtn = document.getElementById("playBtn");

let audioContext = new AudioContext();
let analyser = audioContext.createAnalyser();
let source = audioContext.createMediaElementSource(audio);

source.connect(analyser);
analyser.connect(audioContext.destination);

analyser.fftSize = 256;

let bufferLength = analyser.frequencyBinCount;
let dataArray = new Uint8Array(bufferLength);

playBtn.addEventListener("click", () => {
    audioContext.resume();
    audio.play();
    detectBeat();
});

function detectBeat() {
    requestAnimationFrame(detectBeat);

    analyser.getByteFrequencyData(dataArray);

    let average = dataArray.reduce((a, b) => a + b) / bufferLength;

    // If sound is loud enough → treat as beat
    if (average > 160) {
        moveBoxRandom();
    }
}

function moveBoxRandom() {
    let boxWidth = container.clientWidth;
    let boxHeight = container.clientHeight;

    let box1Width = box1.clientWidth;
    let box1Height = box1.clientHeight;

    let randomLeft = Math.random() * (boxWidth - box1Width);
    let randomTop = Math.random() * (boxHeight - box1Height);

    box1.style.left = randomLeft + "px";
    box1.style.top = randomTop + "px";
}
