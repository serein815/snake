// Firebase 配置
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 遊戲元素獲取
const cardGrid = document.getElementById('cardGrid');
const timeDisplay = document.getElementById('time');
const startButton = document.getElementById('startButton');
const gameOverModal = document.getElementById('gameOverModal');
const finalTimeDisplay = document.getElementById('finalTime');
const restartButton = document.getElementById('restartButton');
const leaderboardList = document.getElementById('leaderboardList');

// 單詞列表 (請替換成你的單詞)
const words = [
    { en: 'apple', zh: '蘋果' },
    { en: 'banana', zh: '香蕉' },
    { en: 'cat', zh: '貓' },
    { en: 'dog', zh: '狗' },
    { en: 'house', zh: '房子' },
    { en: 'tree', zh: '樹' },
    { en: 'book', zh: '書' },
    { en: 'car', zh: '汽車' },
    { en: 'water', zh: '水' },
    { en: 'sun', zh: '太陽' }
];

let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let timer;
let startTime;
let gameStarted = false;

// 遊戲初始化函數
function initializeGame() {
    matchedPairs = 0;
    cardGrid.innerHTML = ''; // 清空卡牌
    clearInterval(timer);
    timeDisplay.textContent = '00:00';
    gameStarted = false;
    startButton.disabled = false;
    gameOverModal.classList.remove('show');
    generateCards();
}

// 生成卡牌
function generateCards() {
    // 複製單詞列表，並為每個單詞創建英文和中文兩張卡牌
    let gameWords = [...words, ...words]; // 總共 20 張卡牌

    // 洗牌
    gameWords.sort(() => 0.5 - Math.random());

    cards = [];
    gameWords.forEach((word, index) => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('card');
        cardElement.dataset.word = word.en; // 用英文作為配對依據
        cardElement.dataset.type = index < words.length ? 'en' : 'zh'; // 判斷是英文還是中文卡牌

        const cardInner = document.createElement('div');
        cardInner.classList.add('card-inner');

        const cardFront = document.createElement('div');
        cardFront.classList.add('card-front');
        cardFront.textContent = '?'; // 預設背面顯示問號

        const cardBack = document.createElement('div');
        cardBack.classList.add('card-back');
        cardBack.textContent = (cardElement.dataset.type === 'en') ? word.en : word.zh; // 根據類型顯示英文或中文

        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        cardElement.appendChild(cardInner);

        cardElement.addEventListener('click', flipCard);
        cardGrid.appendChild(cardElement);
        cards.push(cardElement);
    });
}

// 翻轉卡牌
function flipCard() {
    if (!gameStarted || flippedCards.length === 2 || this.classList.contains('flipped') || this.classList.contains('matched')) {
        return;
    }

    this.classList.add('flipped');
    flippedCards.push(this);

    if (flippedCards.length === 2) {
        checkForMatch();
    }
}

// 檢查是否配對成功
function checkForMatch() {
    const [card1, card2] = flippedCards;
    const word1 = card1.dataset.word;
    const word2 = card2.dataset.word;
    const type1 = card1.dataset.type;
    const type2 = card2.dataset.type;

    // 檢查是否為同一個單詞的不同類型 (英文對中文)
    if (word1 === word2 && type1 !== type2) {
        // 配對成功
        setTimeout(() => {
            card1.classList.add('matched');
            card2.classList.add('matched');
            matchedPairs++;
            flippedCards = [];

            if (matchedPairs === words.length) {
                // 所有卡牌都配對成功
                endGame();
            }
        }, 800); // 延遲讓玩家看到翻開的卡牌
    } else {
        // 配對失敗
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
        }, 1200); // 延遲後翻回去
    }
}

// 開始遊戲
function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    startButton.disabled = true;
    startTime = Date.now();
    timer = setInterval(updateTimer, 1000);
}

// 更新計時器
function updateTimer() {
    const elapsedTime = Date.now() - startTime;
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    timeDisplay.textContent =
        `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// 遊戲結束
async function endGame() {
    clearInterval(timer);
    gameStarted = false;

    const finalTime = timeDisplay.textContent;
    finalTimeDisplay.textContent = finalTime;
    gameOverModal.classList.add('show');

    // 儲存成績到 Firebase
    const playerName = prompt("恭喜完成！請輸入你的名字：") || "匿名玩家";
    await saveScore(playerName, finalTime, Date.now() - startTime);

    // 更新排行榜
    fetchLeaderboard();
}

// 儲存成績到 Firebase
async function saveScore(name, timeString, timeInMilliseconds) {
    try {
        await db.collection("scores").add({
            name: name,
            time: timeString,
            time_ms: timeInMilliseconds,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("成績已儲存！");
    } catch (e) {
        console.error("儲存成績失敗：", e);
    }
}

// 獲取並顯示排行榜
async function fetchLeaderboard() {
    leaderboardList.innerHTML = '';
    try {
        const snapshot = await db.collection("scores")
                                 .orderBy("time_ms", "asc") // 根據時間 (毫秒) 升序排序
                                 .limit(10) // 只顯示前 10 名
                                 .get();

        if (snapshot.empty) {
            leaderboardList.innerHTML = '<li>目前沒有排行榜資料。</li>';
            return;
        }

        snapshot.forEach((doc, index) => {
            const data = doc.data();
            const listItem = document.createElement('li');
            listItem.innerHTML = `<strong>${index + 1}. ${data.name}</strong> - ${data.time}`;
            leaderboardList.appendChild(listItem);
        });
    } catch (e) {
        console.error("獲取排行榜失敗：", e);
    }
}

// 事件監聽器
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', initializeGame);

// 頁面載入時初始化遊戲並載入排行榜
document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
    fetchLeaderboard();
});
