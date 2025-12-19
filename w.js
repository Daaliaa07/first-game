// ==================== المتغيرات الأساسية ====================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width = 860;
const H = canvas.height = 480;

// عناصر DOM
const score1El = document.getElementById('score1');
const score2El = document.getElementById('score2');
const lives1El = document.getElementById('lives1');
const lives2El = document.getElementById('lives2');
const name1El = document.getElementById('name1');
const name2El = document.getElementById('name2');
const stageTitleEl = document.getElementById('stageTitle');

// شاشات اللعبة
const startScreen = document.getElementById('startScreen');
const playBtn = document.getElementById('playBtn');
const playerSelectScreen = document.getElementById('playerSelectScreen');
const charSelectScreen = document.getElementById('charSelectScreen');
const currentPlayerEl = document.getElementById('currentPlayer');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoresEl = document.getElementById('finalScores');
const highScoreMessageEl = document.getElementById('highScoreMessage');

// شاشة السكورات
const scoresScreen = document.getElementById('scoresScreen');
const scoresContainer = document.getElementById('scoresContainer');
const viewScoresBtn = document.getElementById('viewScoresBtn');
const viewScoresFromGameOverBtn = document.getElementById('viewScoresFromGameOver');
const clearScoresBtn = document.getElementById('clearScoresBtn');
const backFromScoresBtn = document.getElementById('backFromScoresBtn');

// أزرار أخرى
const pauseScreen = document.getElementById('pauseScreen');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const restartFromPauseBtn = document.getElementById('restartFromPauseBtn');
const mainMenuBtn = document.getElementById('mainMenuBtn');
const restartGameOverBtn = document.getElementById('restartGameOverBtn');
const backToMenuFromGameOver = document.getElementById('backToMenuFromGameOver');
const restartBtn = document.getElementById('restartBtn');

// متغيرات اللعبة
let numberOfPlayers = 1;
let players = [];
let selectedCharacters = [];
let currentCharSelecting = 0;
let keys = {};
let gameOver = false;
let gamePaused = false;
let currentLevel = 1;
let levelTransitioning = false;
let gameLoopId = null;
const GRAVITY = 0.8;
let particles = [];
let platforms = [],
    coins = [],
    boosts = [],
    enemies = [],
    stars = [];

// ==================== نظام السكورات ====================
class ScoreSystem {
    constructor() {
        this.scores = this.loadScores();
    }

    loadScores() {
        try {
            const saved = localStorage.getItem('gameScores');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('خطأ في تحميل السكورات:', e);
            return [];
        }
    }

    saveScores() {
        try {
            localStorage.setItem('gameScores', JSON.stringify(this.scores));
        } catch (e) {
            console.error('خطأ في حفظ السكورات:', e);
        }
    }

    addScore(playerName, score, level, characters) {
        const newScore = {
            id: Date.now(),
            playerName: playerName,
            score: score,
            level: level,
            characters: characters,
            date: new Date().toLocaleString('ar-SA'),
            timestamp: Date.now()
        };

        this.scores.push(newScore);
        // ترتيب السكورات تنازلياً حسب النقاط
        this.scores.sort((a, b) => b.score - a.score);
        // حفظ أفضل 20 نتيجة فقط
        this.scores = this.scores.slice(0, 5);
        this.saveScores();

        return newScore;
    }

    isHighScore(score) {
        if (this.scores.length < 5) return true;
        return score > Math.min(...this.scores.map(s => s.score));
    }

    getTopScores(limit = 10) {
        return this.scores.slice(0, limit);
    }

    clearScores() {
        this.scores = [];
        this.saveScores();
    }

    renderScores() {
        scoresContainer.innerHTML = '';

        if (this.scores.length === 0) {
            scoresContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #aaa; font-size: 20px;">
                    🎮 لا توجد سكورات بعد
                </div>
            `;
            return;
        }

        const topScores = this.getTopScores(5);
        topScores.forEach((score, index) => {
            const scoreElement = document.createElement('div');
            scoreElement.className = 'scoreItem';

            if (index === 0) {
                scoreElement.classList.add('gold', 'best');
            } else if (index === 1) {
                scoreElement.classList.add('silver');
            } else if (index === 2) {
                scoreElement.classList.add('bronze');
            }


            const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#ffffff'];
            const rankColor = index < 3 ? rankColors[index] : '#ffffff';

            scoreElement.innerHTML = `
                <div class="scoreRank" style="color: ${rankColor}">${index + 1}</div>
                <div class="scoreDetails">
                    <div class="scorePlayer">${score.playerName}</div>
                    <div class="scoreDate">${score.date}</div>
                </div>
                <div class="scoreValue">${score.score} نقطة</div>
            `;

            scoresContainer.appendChild(scoreElement);
        });
    }
}

// إنشاء نظام السكورات
const scoreSystem = new ScoreSystem();
const stages = [{
        level: 1,
        name: "الحديقة المائية",
        backgroundImage: "42c436ad43d558974abb349069b2642e.jpg",
        platformColor: "#6dbf6d",
        enemyColor: "#cc4444",
        platforms: [{
            x: 0,
            y: H - 80,
            w: W,
            h: 40
        }, {
            x: 80,
            y: 350,
            w: 120,
            h: 18
        }, {
            x: 240,
            y: 290,
            w: 140,
            h: 18
        }, {
            x: 420,
            y: 250,
            w: 120,
            h: 18
        }, {
            x: 580,
            y: 210,
            w: 140,
            h: 18
        }, {
            x: 760,
            y: 170,
            w: 80,
            h: 18
        }, {
            x: 320,
            y: 150,
            w: 120,
            h: 18
        }],
        coins: [{
            x: 120,
            y: 320,
            type: "gold"
        }, {
            x: 300,
            y: 260,
            type: "silver"
        }, {
            x: 460,
            y: 220,
            type: "gold"
        }, {
            x: 620,
            y: 180,
            type: "silver"
        }, {
            x: 350,
            y: 120,
            type: "gold"
        }],
        enemies: [{
            x: 180,
            y: 325,
            w: 30,
            h: 30,
            range: 60,
            speed: 0.8
        }, {
            x: 500,
            y: 195,
            w: 30,
            h: 30,
            range: 60,
            speed: 0.8
        }],
        boosts: [{
            x: 760,
            y: 150
        }]
    },

    {
        level: 2,
        name: "الغابة السحرية",
        backgroundImage: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1950&q=80",
        platformColor: "#8b5a2b",
        enemyColor: "#9932CC",
        platforms: [{
            x: 0,
            y: H - 80,
            w: W,
            h: 40
        }, {
            x: 50,
            y: 310,
            w: 100,
            h: 18
        }, {
            x: 220,
            y: 260,
            w: 140,
            h: 18
        }, {
            x: 400,
            y: 210,
            w: 120,
            h: 18
        }, {
            x: 600,
            y: 170,
            w: 140,
            h: 18
        }, {
            x: 750,
            y: 130,
            w: 80,
            h: 18
        }],
        coins: [{
            x: 100,
            y: 280,
            type: "gold"
        }, {
            x: 280,
            y: 230,
            type: "silver"
        }, {
            x: 420,
            y: 180,
            type: "gold"
        }, {
            x: 620,
            y: 140,
            type: "silver"
        }],
        enemies: [{
            x: 180,
            y: 285,
            w: 30,
            h: 30,
            range: 70,
            speed: 1.0
        }, {
            x: 500,
            y: 180,
            w: 30,
            h: 30,
            range: 70,
            speed: 1.0
        }],
        boosts: [{
            x: 750,
            y: 110
        }]
    },

    {
        level: 3,
        name: "عالم الكتب",
        backgroundImage: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=1950&q=80",
        platformColor: "#708090",
        enemyColor: "#FF4500",
        platforms: [{
            x: 0,
            y: H - 80,
            w: W,
            h: 40
        }, {
            x: 100,
            y: 310,
            w: 120,
            h: 18
        }, {
            x: 250,
            y: 260,
            w: 140,
            h: 18
        }, {
            x: 420,
            y: 210,
            w: 120,
            h: 18
        }, {
            x: 600,
            y: 170,
            w: 140,
            h: 18
        }, {
            x: 750,
            y: 130,
            w: 80,
            h: 18
        }],
        coins: [{
            x: 130,
            y: 280,
            type: "gold"
        }, {
            x: 300,
            y: 230,
            type: "gold"
        }, {
            x: 450,
            y: 180,
            type: "silver"
        }, {
            x: 620,
            y: 140,
            type: "gold"
        }, {
            x: 760,
            y: 100,
            type: "silver"
        }],
        enemies: [{
            x: 150,
            y: 285,
            w: 30,
            h: 30,
            range: 60,
            speed: 1.2
        }, {
            x: 400,
            y: 205,
            w: 30,
            h: 30,
            range: 80,
            speed: 1.3
        }, {
            x: 650,
            y: 145,
            w: 30,
            h: 30,
            range: 60,
            speed: 1.3
        }],
        boosts: [{
            x: 750,
            y: 110
        }]
    },

    /* ===================== مراحل 4–8 ===================== */

    {
        level: 4,
        name: "الثلوج القطبية",
        backgroundImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1950&q=80",
        platformColor: "#cce7ff",
        enemyColor: "#003366",
        platforms: [{
            x: 0,
            y: H - 80,
            w: W,
            h: 40
        }, {
            x: 70,
            y: 320,
            w: 130,
            h: 18
        }, {
            x: 240,
            y: 270,
            w: 150,
            h: 18
        }, {
            x: 430,
            y: 220,
            w: 130,
            h: 18
        }, {
            x: 620,
            y: 180,
            w: 150,
            h: 18
        }, {
            x: 770,
            y: 140,
            w: 90,
            h: 18
        }],
        coins: [{
            x: 120,
            y: 290,
            type: "gold"
        }, {
            x: 290,
            y: 240,
            type: "silver"
        }, {
            x: 450,
            y: 190,
            type: "gold"
        }, {
            x: 630,
            y: 150,
            type: "silver"
        }, {
            x: 780,
            y: 110,
            type: "gold"
        }],
        enemies: [{
            x: 160,
            y: 300,
            w: 30,
            h: 30,
            range: 70,
            speed: 0.9
        }, {
            x: 500,
            y: 200,
            w: 30,
            h: 30,
            range: 80,
            speed: 1.0
        }],
        boosts: [{
            x: 770,
            y: 120
        }]
    },

    {
        level: 5,
        name: "القلعة المهجورة",
        backgroundImage: "65aa7642be0fa6d968ce08655ea9d49f.jpg",
        platformColor: "#555555",
        enemyColor: "#880000",
        platforms: [{
            x: 0,
            y: H - 80,
            w: W,
            h: 40
        }, {
            x: 90,
            y: 330,
            w: 120,
            h: 18
        }, {
            x: 260,
            y: 280,
            w: 150,
            h: 18
        }, {
            x: 420,
            y: 230,
            w: 130,
            h: 18
        }, {
            x: 600,
            y: 190,
            w: 150,
            h: 18
        }, {
            x: 760,
            y: 150,
            w: 90,
            h: 18
        }],
        coins: [{
            x: 110,
            y: 300,
            type: "gold"
        }, {
            x: 280,
            y: 250,
            type: "gold"
        }, {
            x: 450,
            y: 200,
            type: "silver"
        }, {
            x: 620,
            y: 160,
            type: "gold"
        }],
        enemies: [{
            x: 150,
            y: 305,
            w: 30,
            h: 30,
            range: 80,
            speed: 1.1
        }, {
            x: 480,
            y: 215,
            w: 30,
            h: 30,
            range: 90,
            speed: 1.2
        }],
        boosts: [{
            x: 760,
            y: 130
        }]
    },

    {
        level: 6,
        name: "المدينة المستقبلية",
        backgroundImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1950&q=80",
        platformColor: "#00bcd4",
        enemyColor: "#ff0099",
        platforms: [{
            x: 0,
            y: H - 80,
            w: W,
            h: 40
        }, {
            x: 60,
            y: 325,
            w: 140,
            h: 18
        }, {
            x: 220,
            y: 275,
            w: 150,
            h: 18
        }, {
            x: 400,
            y: 230,
            w: 130,
            h: 18
        }, {
            x: 580,
            y: 190,
            w: 150,
            h: 18
        }, {
            x: 750,
            y: 150,
            w: 90,
            h: 18
        }],
        coins: [{
            x: 90,
            y: 295,
            type: "silver"
        }, {
            x: 260,
            y: 245,
            type: "gold"
        }, {
            x: 410,
            y: 200,
            type: "gold"
        }, {
            x: 600,
            y: 160,
            type: "silver"
        }, {
            x: 760,
            y: 120,
            type: "gold"
        }],
        enemies: [{
            x: 180,
            y: 300,
            w: 30,
            h: 30,
            range: 70,
            speed: 1.3
        }, {
            x: 460,
            y: 215,
            w: 30,
            h: 30,
            range: 90,
            speed: 1.4
        }, {
            x: 680,
            y: 160,
            w: 30,
            h: 30,
            range: 70,
            speed: 1.5
        }],
        boosts: [{
            x: 750,
            y: 130
        }]
    },

    {
        level: 7,
        name: "منظر صيفي",
        backgroundImage: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1950&q=80",
        platformColor: "#2e2e2e",
        enemyColor: "#ff9900",
        platforms: [{
            x: 0,
            y: H - 80,
            w: W,
            h: 40
        }, {
            x: 80,
            y: 340,
            w: 120,
            h: 18
        }, {
            x: 240,
            y: 290,
            w: 140,
            h: 18
        }, {
            x: 420,
            y: 240,
            w: 120,
            h: 18
        }, {
            x: 590,
            y: 200,
            w: 150,
            h: 18
        }, {
            x: 760,
            y: 160,
            w: 90,
            h: 18
        }],
        coins: [{
            x: 120,
            y: 310,
            type: "gold"
        }, {
            x: 300,
            y: 260,
            type: "silver"
        }, {
            x: 450,
            y: 210,
            type: "gold"
        }, {
            x: 620,
            y: 170,
            type: "gold"
        }],
        enemies: [{
            x: 180,
            y: 315,
            w: 30,
            h: 30,
            range: 85,
            speed: 1.4
        }, {
            x: 500,
            y: 225,
            w: 30,
            h: 30,
            range: 90,
            speed: 1.5
        }],
        boosts: [{
            x: 760,
            y: 140
        }]
    },

    {
        level: 8,
        name: "بركان الهلاك",
        backgroundImage: "https://images.unsplash.com/photo-1502786129293-79981df4e689?auto=format&fit=crop&w=1950&q=80",
        platformColor: "#ff5722",
        enemyColor: "#000000",
        platforms: [{
            x: 0,
            y: H - 80,
            w: W,
            h: 40
        }, {
            x: 70,
            y: 330,
            w: 130,
            h: 18
        }, {
            x: 240,
            y: 280,
            w: 150,
            h: 18
        }, {
            x: 420,
            y: 230,
            w: 130,
            h: 18
        }, {
            x: 590,
            y: 180,
            w: 150,
            h: 18
        }, {
            x: 750,
            y: 140,
            w: 90,
            h: 18
        }],
        coins: [{
            x: 110,
            y: 300,
            type: "gold"
        }, {
            x: 290,
            y: 250,
            type: "gold"
        }, {
            x: 430,
            y: 200,
            type: "silver"
        }, {
            x: 600,
            y: 160,
            type: "gold"
        }, {
            x: 760,
            y: 120,
            type: "gold"
        }],
        enemies: [{
            x: 150,
            y: 305,
            w: 30,
            h: 30,
            range: 100,
            speed: 1.6
        }, {
            x: 480,
            y: 215,
            w: 30,
            h: 30,
            range: 120,
            speed: 1.7
        }, {
            x: 700,
            y: 160,
            w: 30,
            h: 30,
            range: 100,
            speed: 1.8
        }],
        boosts: [{
            x: 750,
            y: 120
        }]
    }
];

// ==================== الكائنات الأساسية ====================
class Player {
    constructor(x, y, character, controls) {
        this.x = x;
        this.y = y;
        this.w = 70;
        this.h = 70;
        this.vx = 0;
        this.vy = 0;
        this.speed = 5;
        this.jumpForce = -19;
        this.onGround = false;
        this.score = 0;
        this.lives = 10;
        this.character = character;
        this.controls = controls;
        this.shield = 0;

        this.img = new Image();
        const imageFiles = {
            'gumball': 'gumball.png',
            'darwin': 'darwin.png',
            'anais': 'anais.png',
            'nicole': 'nicole.png'
        };
        const fileName = imageFiles[character] || 'gumball.png';
        this.img.src = fileName;
        this.img.onerror = () => {
            this.useFallback = true;
        };
        this.color = this.getCharacterColor(character);
        this.useFallback = false;
    }

    getCharacterColor(char) {
        const colors = {
            'gumball': '#0099ff',
            'darwin': '#ff7b00',
            'anais': '#ff00d4',
            'nicole': '#0066ff'
        };
        return colors[char] || '#ff0000';
    }

    update() {
        if (keys[this.controls.left]) this.vx = -this.speed;
        else if (keys[this.controls.right]) this.vx = this.speed;
        else this.vx = 0;

        if (keys[this.controls.jump] && this.onGround) {
            this.vy = this.jumpForce;
            this.onGround = false;
        }

        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = 0;
        if (this.x + this.w > W) this.x = W - this.w;

        this.onGround = false;
        for (let p of platforms) {
            if (this.x < p.x + p.w &&
                this.x + this.w > p.x &&
                this.y < p.y + p.h &&
                this.y + this.h > p.y) {

                const bottomDiff = Math.abs((this.y + this.h) - p.y);
                const topDiff = Math.abs(this.y - (p.y + p.h));
                const rightDiff = Math.abs((this.x + this.w) - p.x);
                const leftDiff = Math.abs(this.x - (p.x + p.w));
                const minDiff = Math.min(bottomDiff, topDiff, rightDiff, leftDiff);

                if (minDiff === bottomDiff) {
                    this.y = p.y - this.h;
                    this.vy = 0;
                    this.onGround = true;
                } else if (minDiff === topDiff) {
                    this.y = p.y + p.h;
                    this.vy = 0;
                } else if (minDiff === rightDiff) {
                    this.x = p.x - this.w;
                    this.vx = 0;
                } else if (minDiff === leftDiff) {
                    this.x = p.x + p.w;
                    this.vx = 0;
                }
            }
        }

        if (this.y > H) {
            this.lives--;
            this.respawn();
            checkGameOver();
        }

        if (this.shield > 0) this.shield--;
    }

    respawn() {
        // تغيير: من 350 إلى 200
        this.x = 50;
        this.y = 200;
        this.vx = this.vy = 0;
    }

    draw(ctx) {
        if (!this.useFallback && this.img.complete && this.img.naturalWidth > 0) {
            ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.x + this.w / 3, this.y + this.h / 3, 4, 0, Math.PI * 2);
            ctx.arc(this.x + 2 * this.w / 3, this.y + this.h / 3, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.shield > 0) {
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.w / 2, this.y + this.h / 2, this.w / 2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

class Platform {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    draw(ctx) {
        const stage = stages.find(s => s.level === currentLevel);
        ctx.fillStyle = stage ? stage.platformColor : '#6dbf6d';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(this.x, this.y, this.w, 3);
        ctx.fillRect(this.x, this.y, 3, this.h);
    }
}

class Coin {
    constructor(x, y, type = 'gold') {
        this.x = x;
        this.y = y;
        this.r = 8;
        this.collected = false;
        this.type = type;
        this.angle = Math.random() * Math.PI * 2;
    }

    update() {
        this.angle += 0.05;
    }

    draw(ctx) {
        if (this.collected) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.type === 'gold' ? '#ffd700' : '#c0c0c0';
        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.type === 'gold' ? '#ffed4e' : '#e8e8e8';
        ctx.beginPath();
        ctx.arc(0, 0, this.r - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Boost {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = 10;
        this.collected = false;
        this.pulse = 0;
    }

    update() {
        this.pulse = (this.pulse + 0.1) % (Math.PI * 2);
    }

    draw(ctx) {
        if (this.collected) return;
        const size = this.r + Math.sin(this.pulse) * 2;
        ctx.fillStyle = 'cyan';
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Enemy {
    constructor(x, y, w, h, range = 80, speed = 1.2) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.startX = x;
        this.range = range;
        this.vx = speed;
        this.dir = 1;
    }

    update() {
        this.x += this.vx * this.dir;
        if (this.x > this.startX + this.range || this.x < this.startX - this.range) {
            this.dir *= -1;
        }
    }

    draw(ctx) {
        const stage = stages.find(s => s.level === currentLevel);
        ctx.fillStyle = stage ? stage.enemyColor : '#cc4444';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 8, this.y + 8, 5, 5);
        ctx.fillRect(this.x + this.w - 13, this.y + 8, 5, 5);
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(this.x + 8, this.y + this.h - 12, this.w - 16, 4);
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 1.5) * 4;
        this.color = color;
        this.life = 30;
        this.size = Math.random() * 2 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life / 30;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// ==================== إدارة المراحل ====================
function initLevel(levelNum = 1) {
    levelTransitioning = false;
    const stage = stages.find(s => s.level === levelNum);
    if (!stage) {
        endGameWithVictory();
        return;
    }

    currentLevel = levelNum;
    canvas.style.background =
        `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${stage.backgroundImage}') center/cover`;
    stageTitleEl.textContent = `🎮 المرحلة ${stage.level}: ${stage.name}`;

    platforms = [];
    coins = [];
    boosts = [];
    enemies = [];
    particles = [];

    stage.platforms.forEach(p => {
        platforms.push(new Platform(p.x, p.y, p.w, p.h));
    });
    stage.coins.forEach(c => {
        coins.push(new Coin(c.x, c.y, c.type));
    });
    stage.enemies.forEach(e => {
        enemies.push(new Enemy(e.x, e.y, e.w, e.h, e.range, e.speed));
    });
    stage.boosts.forEach(b => {
        boosts.push(new Boost(b.x, b.y));
    });

    players.forEach(p => {
        // تغيير: من 350 إلى 200
        p.x = 50;
        p.y = 200;
        p.vx = 0;
        p.vy = 0;
        p.shield = 0;
    });
}

function endGameWithVictory() {
    gameOver = true;
    finalScoresEl.innerHTML = '<h2>🎊 تهانينا! أكملت جميع المراحل! 🎊</h2>';

    // حفظ النتيجة النهائية
    const totalScore = players.reduce((sum, player) => sum + player.score, 0);
    const playerName = numberOfPlayers === 1 ?
        `اللاعب: ${selectedCharacters.map(c => getCharacterName(c)).join('')}` :
        `لاعبان: ${selectedCharacters.map(c => getCharacterName(c)).join(' و ')}`;

    const newScore = scoreSystem.addScore(
        playerName,
        totalScore,
        currentLevel - 1,
        selectedCharacters
    );

    // التحقق إذا كانت هذه أعلى نتيجة
    const isHighScore = scoreSystem.isHighScore(totalScore);
    if (isHighScore) {
        highScoreMessageEl.innerHTML = `
            <div style="font-size: 28px; color: #ffcc00; margin: 20px 0;">
                🏆 سجلت أعلى نتيجة جديدة! 🏆
            </div>
            <div style="font-size: 32px; color: #00ffcc;">
                ${totalScore} نقطة
            </div>
        `;
    } else {
        highScoreMessageEl.innerHTML = `
            <div style="font-size: 24px; color: #00ffcc;">
                النتيجة النهائية: ${totalScore} نقطة
            </div>
        `;
    }

    // عرض نتائج اللاعبين
    players.forEach((p, i) => {
        const div = document.createElement('div');
        div.style.fontSize = '20px';
        div.style.margin = '10px';
        div.style.padding = '10px';
        div.style.background = 'rgba(255,255,255,0.1)';
        div.style.borderRadius = '10px';
        div.textContent = `👤 اللاعب ${i + 1}: ${p.score} نقطة`;
        finalScoresEl.appendChild(div);
    });

    gameOverScreen.classList.add('show');
}

function getCharacterName(char) {
    const names = {
        'gumball': 'غامبول',
        'darwin': 'داروين',
        'anais': 'أنايس',
        'nicole': 'نيكول'
    };
    return names[char] || char;
}

// ==================== نظام الإيقاف والاستئناف ====================
function pauseGame() {
    if (!gameOver && !levelTransitioning) {
        gamePaused = true;
        pauseScreen.style.display = 'flex';
    }
}

function resumeGame() {
    gamePaused = false;
    pauseScreen.style.display = 'none';
}

function backToMainMenu() {
    if (!gameOver && !confirm('هل تريد العودة للقائمة الرئيسية؟ سيتم فقدان التقدم الحالي.')) {
        return;
    }

    gamePaused = false;
    gameOver = false;
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }

    // إخفاء جميع الشاشات
    pauseScreen.style.display = 'none';
    gameOverScreen.classList.remove('show');
    charSelectScreen.style.display = 'none';
    scoresScreen.style.display = 'none';

    // إظهار شاشة البداية
    startScreen.style.display = 'flex';

    // إعادة تعيين اللعبة
    resetGame();
}

function resetGame() {
    players = [];
    selectedCharacters = [];
    currentCharSelecting = 0;
    currentLevel = 1;
    particles = [];
    platforms = [];
    coins = [];
    boosts = [];
    enemies = [];
    keys = {};

    score1El.textContent = '0';
    lives1El.textContent = '5';
    score2El.textContent = '0';
    lives2El.textContent = '3';
    name1El.textContent = '---';
    name2El.textContent = '---';
    stageTitleEl.textContent = 'المرحلة 1: الحديقة المائية';
    document.getElementById('player2Stats').style.display = 'none';
}

// ==================== نهاية اللعبة ====================
function checkGameOver() {
    if (players.some(p => p.lives <= 0)) {
        gameOver = true;
        finalScoresEl.innerHTML = '<h2>💀 انتهت اللعبة</h2>';

        // حساب النقاط الكلية
        const totalScore = players.reduce((sum, player) => sum + player.score, 0);
        const playerName = numberOfPlayers === 1 ?
            `اللاعب: ${selectedCharacters.map(c => getCharacterName(c)).join('')}` :
            `لاعبان: ${selectedCharacters.map(c => getCharacterName(c)).join(' و ')}`;

        // حفظ النتيجة
        const newScore = scoreSystem.addScore(
            playerName,
            totalScore,
            currentLevel,
            selectedCharacters
        );

        // التحقق إذا كانت هذه أعلى نتيجة
        const isHighScore = scoreSystem.isHighScore(totalScore);
        if (isHighScore) {
            highScoreMessageEl.innerHTML = `
                <div style="font-size: 28px; color: #ffcc00; margin: 20px 0;">
                    🏆 سجلت أعلى نتيجة جديدة! 🏆
                </div>
                <div style="font-size: 32px; color: #00ffcc;">
                    ${totalScore} نقطة
                </div>
            `;
        } else {
            highScoreMessageEl.innerHTML = `
                <div style="font-size: 24px; color: #00ffcc;">
                    النتيجة النهائية: ${totalScore} نقطة
                </div>
            `;
        }

        // عرض نتائج اللاعبين
        players.forEach((p, i) => {
            const div = document.createElement('div');
            div.style.fontSize = '18px';
            div.style.margin = '8px';
            div.style.padding = '8px';
            div.style.background = 'rgba(255,255,255,0.1)';
            div.style.borderRadius = '8px';
            div.textContent = `اللاعب ${i + 1}: ${p.score} نقطة`;
            finalScoresEl.appendChild(div);
        });

        gameOverScreen.classList.add('show');
    }
}

function restartGame() {
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }

    gameOver = false;
    gamePaused = false;
    currentLevel = 1;
    particles = [];
    keys = {};
    levelTransitioning = false;
    platforms = [];
    coins = [];
    boosts = [];
    enemies = [];

    if (players && players.length > 0) {
        players.forEach((p, index) => {
            p.score = 0;
            p.lives = 10;
            p.x = 50 + (index * 100);
            p.y = 200; // تغيير: من 350 إلى 200
            p.vx = 0;
            p.vy = 0;
            p.shield = 0;
        });
    }

    pauseScreen.style.display = 'none';
    gameOverScreen.classList.remove('show');

    score1El.textContent = '0';
    lives1El.textContent = '10';
    score2El.textContent = '0';
    lives2El.textContent = '10';

    initLevel(1);

    gameLoopId = requestAnimationFrame(gameLoop);
}

// ==================== تحديث اللعبة ====================
function update() {
    if (gameOver || gamePaused || levelTransitioning) return;

    players.forEach(p => p.update());
    enemies.forEach(e => e.update());
    coins.forEach(c => c.update());
    boosts.forEach(b => b.update());

    particles.forEach((p, i) => {
        p.update();
        if (p.life <= 0) particles.splice(i, 1);
    });

    players.forEach(p => {
        coins.forEach(c => {
            if (!c.collected &&
                Math.abs(p.x + p.w / 2 - c.x) < 20 &&
                Math.abs(p.y + p.h / 2 - c.y) < 20) {

                c.collected = true;
                p.score += c.type === 'gold' ? 2 : 1;

                for (let i = 0; i < 8; i++) {
                    particles.push(new Particle(c.x, c.y, c.type === 'gold' ? '#ffd700' : '#c0c0c0'));
                }
            }
        });

        boosts.forEach(b => {
            if (!b.collected &&
                Math.abs(p.x + p.w / 2 - b.x) < 20 &&
                Math.abs(p.y + p.h / 2 - b.y) < 20) {

                b.collected = true;
                p.shield = 180;

                for (let i = 0; i < 10; i++) {
                    particles.push(new Particle(b.x, b.y, 'cyan'));
                }
            }
        });

        enemies.forEach(e => {
            if (Math.abs(p.x + p.w / 2 - (e.x + e.w / 2)) < 30 &&
                Math.abs(p.y + p.h / 2 - (e.y + e.h / 2)) < 30 &&
                p.shield <= 0) {

                p.lives--;
                p.respawn();

                for (let i = 0; i < 15; i++) {
                    particles.push(new Particle(
                        p.x + p.w / 2,
                        p.y + p.h / 2,
                        '#ff0000'
                    ));
                }

                checkGameOver();
            }
        });
    });

    score1El.textContent = players[0].score;
    lives1El.textContent = players[0].lives;

    if (numberOfPlayers === 2) {
        score2El.textContent = players[1].score;
        lives2El.textContent = players[1].lives;
    }

    const allCoinsCollected = coins.every(c => c.collected);
    if (allCoinsCollected && !levelTransitioning) {
        levelTransitioning = true;

        particles.push(new Particle(W / 2, H / 2, '#00ff00'));

        setTimeout(() => {
            currentLevel++;
            if (currentLevel > stages.length) {
                endGameWithVictory();
            } else {
                initLevel(currentLevel);
            }
        }, 1500);
    }
}

// ==================== الرسم ====================
function draw() {
    ctx.clearRect(0, 0, W, H);

    // النجوم
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 20; i++) {
        if (!stars[i]) {
            stars.push({
                x: Math.random() * W,
                y: Math.random() * H,
                r: Math.random() * 1.5 + 0.5,
                speed: Math.random() * 0.3 + 0.1
            });
        }

        const star = stars[i];
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();

        star.y += star.speed;
        if (star.y > H) {
            star.y = 0;
            star.x = Math.random() * W;
        }
    }
    ctx.globalAlpha = 1;

    platforms.forEach(p => p.draw(ctx));
    coins.forEach(c => c.draw(ctx));
    boosts.forEach(b => b.draw(ctx));
    enemies.forEach(e => e.draw(ctx));
    particles.forEach(p => p.draw(ctx));
    players.forEach(p => p.draw(ctx));

    if (levelTransitioning) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 مرحلة مكتملة!', W / 2, H / 2 - 30);
        ctx.font = 'bold 24px Arial';
        ctx.fillText('الانتقال للمرحلة التالية...', W / 2, H / 2 + 30);
    }
}

// ==================== حلقة اللعبة الرئيسية ====================
function gameLoop() {
     if (movingLeft) player.x -= 5;
    if (movingRight) player.x += 5;
    if (!gamePaused && !gameOver) {
        update();
        draw();
    }
    gameLoopId = requestAnimationFrame(gameLoop);
}

// ==================== إدارة الشاشات ====================
function showScoresScreen() {
    scoreSystem.renderScores();
    scoresScreen.style.display = 'flex';
}

// ==================== أحداث التحكم ====================
window.addEventListener('keydown', e => {
    keys[e.key] = true;

    if (e.key === 'p' || e.key === 'P' || e.key === ' ') {
        e.preventDefault();
        if (gamePaused) {
            resumeGame();
        } else if (!gameOver) {
            pauseGame();
        }
    }

    if (e.key === 'Escape') {
        e.preventDefault();
        if (!gameOver && !gamePaused) {
            pauseGame();
        }
    }
});

window.addEventListener('keyup', e => {
    keys[e.key] = false;
});

// ==================== شاشات اللعبة ====================
playBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    playerSelectScreen.style.display = 'flex';
});

document.querySelectorAll('.buttonChoice').forEach(btn => {
    btn.addEventListener('click', () => {
        numberOfPlayers = parseInt(btn.dataset.players);
        playerSelectScreen.style.display = 'none';
        charSelectScreen.style.display = 'flex';
        currentCharSelecting = 0;
        selectedCharacters = [];
        currentPlayerEl.textContent = '1';
    });
});

document.querySelectorAll('.charOption').forEach(opt => {
    opt.addEventListener('click', () => {
        document.querySelectorAll('.charOption').forEach(o => {
            o.classList.remove('selected');
        });

        opt.classList.add('selected');

        selectedCharacters.push(opt.dataset.char);
        currentCharSelecting++;

        if (currentCharSelecting < numberOfPlayers) {
            currentPlayerEl.textContent = (currentCharSelecting + 1).toString();
        } else {
            setTimeout(() => {
                charSelectScreen.style.display = 'none';
                startGame();
            }, 500);
        }
    });
});

// ==================== بدء اللعبة ====================
function startGame() {
    players = [];

    const controls = [{
        left: 'ArrowLeft',
        right: 'ArrowRight',
        jump: 'ArrowUp'
    }, {
        left: 'q',
        right: 'd',
        jump: 'z'
    }];

    for (let i = 0; i < numberOfPlayers; i++) {
        // تغيير: من 350 إلى 200
        players.push(new Player(
            50 + (i * 100),
            200,
            selectedCharacters[i],
            controls[i]
        ));
    }

    const charNames = {
        'gumball': 'غامبول',
        'darwin': 'داروين',
        'anais': 'أنايس',
        'nicole': 'نيكول'
    };

    name1El.textContent = charNames[selectedCharacters[0]] || '---';

    if (numberOfPlayers === 2) {
        document.getElementById('player2Stats').style.display = 'inline-block';
        name2El.textContent = charNames[selectedCharacters[1]] || '---';
    } else {
        document.getElementById('player2Stats').style.display = 'none';
    }

    initLevel(1);

    gameOver = false;
    gamePaused = false;
    gameLoopId = requestAnimationFrame(gameLoop);
}

// ==================== ربط الأزرار ====================
viewScoresBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    showScoresScreen();
});

backFromScoresBtn.addEventListener('click', () => {
    scoresScreen.style.display = 'none';
    startScreen.style.display = 'flex';
});

clearScoresBtn.addEventListener('click', () => {
    if (confirm('هل أنت متأكد من مسح جميع السكورات؟')) {
        scoreSystem.clearScores();
        scoreSystem.renderScores();
    }
});

pauseBtn.addEventListener('click', pauseGame);
resumeBtn.addEventListener('click', resumeGame);
backToMenuBtn.addEventListener('click', backToMainMenu);
restartFromPauseBtn.addEventListener('click', restartGame);
mainMenuBtn.addEventListener('click', backToMainMenu);
restartBtn.addEventListener('click', restartGame);
restartGameOverBtn.addEventListener('click', restartGame);
backToMenuFromGameOver.addEventListener('click', backToMainMenu);

if (viewScoresFromGameOverBtn) {
    viewScoresFromGameOverBtn.addEventListener('click', () => {
        gameOverScreen.classList.remove('show');
        showScoresScreen();
    });
}

// ==================== التهيئة الأولية ====================
for (let i = 0; i < 20; i++) {
    stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.3 + 0.1
    });
}

startScreen.style.display = 'flex';

console.log('🎮 اللعبة جاهزة للتشغيل مع نظام السكورات!');


const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const jumpBtn = document.getElementById('jumpBtn');

let movingLeft = false;
let movingRight = false;

leftBtn.addEventListener('touchstart', () => movingLeft = true);
leftBtn.addEventListener('touchend', () => movingLeft = false);

rightBtn.addEventListener('touchstart', () => movingRight = true);
rightBtn.addEventListener('touchend', () => movingRight = false);

jumpBtn.addEventListener('touchstart', () => player.jump());
