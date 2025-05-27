const words = [
    ["chien", "狗"], ["chat", "貓"], ["maison", "房子"],
    ["école", "學校"], ["livre", "書"], ["eau", "水"],
    ["pomme", "蘋果"], ["soleil", "太陽"], ["lune", "月亮"],
    ["voiture", "車"]
];

let cards = [];
let flippedCards = [];
let matchedCount = 0;
let startTime, timerInterval;

const board = document.getElementById('game-board');
const startBtn = document.getElementById('start-button');
const timerDisplay = document.getElementById('timer');
const leaderboard = document.getElementById('leaderboard');
const scoreForm = document.getElementById('score-form');
const playerNameInput = document.getElementById('player-name');
const instruction = document.getElementById('instruction');

startBtn.addEventListener('click', startGame);

function startGame() {
    board.innerHTML = "";
    matchedCount = 0;
    flippedCards = [];
    timerDisplay.textContent = "時間：0 秒";
    scoreForm.style.display = "none";
    instruction.style.display = "none";

    const pairedWords = words.flatMap(([fr, zh]) => [
        { text: fr, match: zh },
        { text: zh, match: fr }
    ]);

    cards = shuffle(pairedWords);

    for (let word of cards) {
        const card = createCard(word);
        board.appendChild(card);
    }

    startTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        timerDisplay.textContent = `時間：${elapsed} 秒`;
    }, 1000);
}

function createCard(word) {
    const card = document.createElement("div");
    card.classList.add("card");
    const inner = document.createElement("div");
    inner.classList.add("card-inner");

    const front = document.createElement("div");
    front.classList.add("card-front");

    const back = document.createElement("div");
    back.classList.add("card-back");
    back.textContent = word.text;

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    card.dataset.word = word.text;
    card.dataset.match = word.match;

    card.addEventListener("click", () => {
        if (card.classList.contains("flipped") || flippedCards.length >= 2) return;

        card.classList.add("flipped");
        flippedCards.push(card);

        if (flippedCards.length === 2) {
            checkMatch();
        }
    });

    return card;
}

function checkMatch() {
    const [card1, card2] = flippedCards;
    if (card1.dataset.match === card2.dataset.word) {
        setTimeout(() => {
            card1.style.visibility = "hidden";
            card2.style.visibility = "hidden";
            matchedCount++;
            if (matchedCount === words.length) {
                endGame();
            }
        }, 1000);
    } else {
        setTimeout(() => {
            card1.classList.remove("flipped");
            card2.classList.remove("flipped");
        }, 1000);
    }
    flippedCards = [];
}

function endGame() {
    clearInterval(timerInterval);
    const finalTime = Math.floor((Date.now() - startTime) / 1000);
    alert(`完成遊戲！用時 ${finalTime} 秒`);
    scoreForm.style.display = "block";
    scoreForm.onsubmit = (e) => {
        e.preventDefault();
        const name = playerNameInput.value;
        if (name) {
            const li = document.createElement("li");
            li.textContent = `${name} - ${finalTime} 秒`;
            leaderboard.appendChild(li);
            sortLeaderboard();
            playerNameInput.value = "";
            scoreForm.style.display = "none";
        }
    };
}

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

function sortLeaderboard() {
    const items = Array.from(leaderboard.children);
    items.sort((a, b) => {
        const timeA = parseInt(a.textContent.split(" - ")[1]);
        const timeB = parseInt(b.textContent.split(" - ")[1]);
        return timeA - timeB;
    });
    leaderboard.innerHTML = "";
    items.forEach(item => leaderboard.appendChild(item));
}
