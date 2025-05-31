// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyAGzfpL8hhhLXbB5XdW0mco4M2utqsr40Q",
    authDomain: "zero-937da.firebaseapp.com",
    databaseURL: "https://zero-937da-default-rtdb.firebaseio.com",
    projectId: "zero-937da",
    storageBucket: "zero-937da.firebasestorage.app",
    messagingSenderId: "69120635828",
    appId: "1:69120635828:web:8c6f24c6f655cde92638e1",
    measurementId: "G-BRBJ0R0PTR"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const scoresRef = database.ref('scores'); // 參考到 'scores' 路徑

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

// 在頁面載入時讀取並顯示排行榜
document.addEventListener('DOMContentLoaded', loadLeaderboard);

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
        // 防止玩家連續點擊同一張卡牌兩次
        if (flippedCards.length === 1 && flippedCards[0] === card) {
            return;
        }

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
            card1.style.visibility = "hidden"; // 配對成功後隱藏卡牌
            card2.style.visibility = "hidden";
            matchedCount++;
            if (matchedCount === words.length) { // 當所有詞語都配對完畢
                endGame();
            }
        }, 1000);
    } else {
        setTimeout(() => {
            card1.classList.remove("flipped"); // 配對失敗後翻回背面
            card2.classList.remove("flipped");
        }, 1000);
    }
    flippedCards = []; // 清空已翻開的卡牌
}

function endGame() {
    clearInterval(timerInterval); // 停止計時器
    const finalTime = Math.floor((Date.now() - startTime) / 1000);
    alert(`完成遊戲！用時 ${finalTime} 秒`);
    scoreForm.style.display = "block"; // 顯示成績提交表單
    
    scoreForm.onsubmit = (e) => {
        e.preventDefault(); // 阻止表單預設提交行為
        const name = playerNameInput.value.trim(); // 獲取玩家名稱並移除前後空白
        if (name) {
            // 將成績儲存到 Firebase Realtime Database
            scoresRef.push({
                name: name,
                score: finalTime, // 使用遊玩秒數作為分數
                timePlayed: finalTime, // 儲存遊玩秒數
                timestamp: firebase.database.ServerValue.TIMESTAMP // Firebase 自動記錄伺服器時間
            }).then(() => {
                playerNameInput.value = ""; // 清空輸入框
                scoreForm.style.display = "none"; // 隱藏表單
                loadLeaderboard(); // 提交後重新載入排行榜以顯示最新成績
            }).catch(error => {
                console.error("寫入 Firebase 失敗: ", error);
                alert("提交成績失敗，請稍後再試。");
            });
        } else {
            alert("請輸入您的名字！");
        }
    };
}

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

function loadLeaderboard() {
    // 監聽 'scores' 路徑下的資料變化，並按 'timePlayed' 升序排序，取前 10 名
    scoresRef.orderByChild('timePlayed').limitToFirst(10).on('value', (snapshot) => {
        leaderboard.innerHTML = ""; // 清空現有排行榜

        // 遍歷從 Firebase 獲取到的所有成績
        snapshot.forEach((childSnapshot) => {
            const scoreData = childSnapshot.val();
            const li = document.createElement("li");
            // 將 timestamp 轉換為可讀的本地時間格式
            const date = scoreData.timestamp ? new Date(scoreData.timestamp).toLocaleString() : 'N/A';
            li.textContent = `${scoreData.name} - ${scoreData.timePlayed} 秒 (${date})`;
            leaderboard.appendChild(li);
        });
    }, (errorObject) => {
        console.log('讀取排行榜失敗: ' + errorObject.name);
    });
}