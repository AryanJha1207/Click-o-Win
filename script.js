let box1 = document.querySelector(".box1");
let container = document.querySelector(".box");
let count = document.querySelector(".count");
const audio = new Audio("maro-jump-sound.mp3")


box1.addEventListener("click", function() {
    audio.play();
    let current = Number(count.textContent);
    let boxWidth = container.clientWidth;
    let boxHeight = container.clientHeight;

    let box1Width = box1.clientWidth;
    let box1Height = box1.clientHeight;

    let randomLeft = Math.random() * (boxWidth - box1Width);
    let randomTop = Math.random() * (boxHeight - box1Height);

    box1.style.left = randomLeft + "px";
    box1.style.top = randomTop + "px";
    count.textContent = current+1;
})
