/**
 * パーティクルエフェクト管理クラス
 * canvas-confettiを使用した紙吹雪エフェクトとカスタムパーティクル
 */
class ParticleEffects {
    constructor() {
        this.confettiColors = ['#ff6b6b', '#4fc3f7', '#ffd93d', '#6bcf7f', '#ba68c8'];
    }

    /**
     * クリア時の紙吹雪エフェクト
     * @param {number} duration - エフェクトの持続時間（ミリ秒）
     */
    celebrateWin(duration = 3000) {
        if (typeof confetti === 'undefined') {
            console.warn('canvas-confetti ライブラリが読み込まれていません');
            return;
        }

        const animationEnd = Date.now() + duration;
        const defaults = {
            startVelocity: 30,
            spread: 360,
            ticks: 60,
            zIndex: 10000,
            colors: this.confettiColors
        };

        const randomInRange = (min, max) => {
            return Math.random() * (max - min) + min;
        };

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                clearInterval(interval);
                return;
            }

            const particleCount = 50 * (timeLeft / duration);

            // 左側から発射
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });

            // 右側から発射
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);
    }

    /**
     * 新記録達成時の豪華な紙吹雪
     * @param {number} duration - エフェクトの持続時間（ミリ秒）
     */
    celebrateNewRecord(duration = 5000) {
        if (typeof confetti === 'undefined') {
            console.warn('canvas-confetti ライブラリが読み込まれていません');
            return;
        }

        const animationEnd = Date.now() + duration;

        // 花火のような爆発エフェクト
        const fireConfetti = () => {
            confetti({
                particleCount: 100,
                spread: 160,
                origin: { y: 0.6 },
                colors: this.confettiColors,
                shapes: ['circle', 'square'],
                gravity: 1.2,
                scalar: 1.2,
                drift: 0,
                ticks: 100
            });
        };

        // 初回の大爆発
        fireConfetti();

        // 連続的な小爆発
        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                clearInterval(interval);
                return;
            }

            confetti({
                particleCount: 30,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.8 },
                colors: this.confettiColors
            });

            confetti({
                particleCount: 30,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.8 },
                colors: this.confettiColors
            });
        }, 400);

        // 1秒後にもう一度大爆発
        setTimeout(() => {
            if (Date.now() < animationEnd) {
                fireConfetti();
            }
        }, 1000);
    }

    /**
     * 画面フラッシュエフェクト
     */
    screenFlash() {
        const flashOverlay = document.getElementById('flash-overlay');
        if (!flashOverlay) return;

        flashOverlay.classList.add('active');

        setTimeout(() => {
            flashOverlay.classList.remove('active');
        }, 500);
    }

    /**
     * カスタムパーティクル生成（スパークル）
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} count - パーティクル数
     */
    createSparkles(x, y, count = 5) {
        const container = document.body;

        for (let i = 0; i < count; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle-particle';
            sparkle.style.left = `${x}px`;
            sparkle.style.top = `${y}px`;

            // ランダムな方向と速度
            const angle = (Math.PI * 2 * i) / count;
            const velocity = 20 + Math.random() * 20;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            sparkle.style.setProperty('--vx', `${vx}px`);
            sparkle.style.setProperty('--vy', `${vy}px`);

            container.appendChild(sparkle);

            // アニメーション終了後に削除
            setTimeout(() => {
                sparkle.remove();
            }, 1000);
        }
    }

    /**
     * タイル移動時の軽いパーティクル
     * @param {HTMLElement} element - パーティクルを発生させる要素
     */
    tileParticles(element) {
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        // 軽いスパークルエフェクト
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 5,
                spread: 40,
                origin: {
                    x: x / window.innerWidth,
                    y: y / window.innerHeight
                },
                colors: ['#4fc3f7', '#29b6f6'],
                ticks: 30,
                gravity: 0.8,
                scalar: 0.6
            });
        }
    }

    /**
     * 星パーティクルの爆発（クリア時の追加エフェクト）
     * @param {HTMLElement} element - 中心要素
     */
    starBurst(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 50,
                spread: 360,
                origin: {
                    x: centerX / window.innerWidth,
                    y: centerY / window.innerHeight
                },
                colors: ['#ffd700', '#ffed4e', '#ffc107'],
                shapes: ['star'],
                scalar: 1.5,
                gravity: 0.5,
                ticks: 100
            });
        }
    }

    /**
     * 虹色の連続パーティクル
     */
    rainbowConfetti(duration = 2000) {
        if (typeof confetti === 'undefined') {
            console.warn('canvas-confetti ライブラリが読み込まれていません');
            return;
        }

        const animationEnd = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: this.confettiColors
            });

            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: this.confettiColors
            });

            if (Date.now() < animationEnd) {
                requestAnimationFrame(frame);
            }
        };

        frame();
    }

    /**
     * 特定の方向へのconfetti
     * @param {string} direction - 'up', 'down', 'left', 'right'
     */
    directionalConfetti(direction = 'up') {
        if (typeof confetti === 'undefined') return;

        const configs = {
            up: { angle: 90, origin: { y: 1 } },
            down: { angle: 270, origin: { y: 0 } },
            left: { angle: 180, origin: { x: 1 } },
            right: { angle: 0, origin: { x: 0 } }
        };

        const config = configs[direction] || configs.up;

        confetti({
            particleCount: 50,
            spread: 70,
            angle: config.angle,
            origin: config.origin,
            colors: this.confettiColors
        });
    }

    /**
     * パーティクルコンテナを取得または作成
     */
    getParticleContainer() {
        let container = document.getElementById('particle-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'particle-container';
            container.className = 'particle-container';
            document.body.appendChild(container);
        }
        return container;
    }

    /**
     * 紙吹雪パーティクル（カスタム実装）
     * @param {number} count - パーティクル数
     */
    createConfetti(count = 50) {
        const container = this.getParticleContainer();
        const colors = ['#ff6b6b', '#4fc3f7', '#ffd93d', '#6bcf7f', '#ba68c8', '#f06292'];

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle-confetti';

                // ランダムな位置（画面上部）
                particle.style.left = `${Math.random() * 100}%`;
                particle.style.top = '-10px';

                // ランダムな色
                particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

                // ランダムなサイズ
                const size = 5 + Math.random() * 10;
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;

                container.appendChild(particle);

                // アニメーション終了後に削除
                setTimeout(() => {
                    particle.remove();
                }, 3000);
            }, i * 30); // 時差をつけて生成
        }
    }

    /**
     * 星の輝きパーティクル
     * @param {number} x - X座標（中心）
     * @param {number} y - Y座標（中心）
     * @param {number} count - パーティクル数
     */
    createStars(x, y, count = 20) {
        const container = this.getParticleContainer();
        const colors = ['#ffd700', '#ffed4e', '#ffc107', '#4fc3f7'];

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle-star';

                particle.style.left = `${x}px`;
                particle.style.top = `${y}px`;
                particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

                // ランダムな方向
                const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
                const distance = 50 + Math.random() * 100;
                const dx = Math.cos(angle) * distance;
                const dy = Math.sin(angle) * distance;

                particle.style.setProperty('--dx', `${dx}px`);
                particle.style.setProperty('--dy', `${dy}px`);

                container.appendChild(particle);

                // アニメーション終了後に削除
                setTimeout(() => {
                    particle.remove();
                }, 2000);
            }, i * 50);
        }
    }

    /**
     * ハートの舞い散り
     * @param {number} count - パーティクル数
     */
    createHearts(count = 15) {
        const container = this.getParticleContainer();
        const colors = ['#ff6b6b', '#f06292', '#e91e63', '#ff4081'];

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle-heart';

                // ランダムな位置（画面下部）
                particle.style.left = `${Math.random() * 100}%`;
                particle.style.top = `${window.innerHeight}px`;
                particle.style.color = colors[Math.floor(Math.random() * colors.length)];

                // ランダムなサイズ
                const size = 8 + Math.random() * 8;
                particle.style.fontSize = `${size}px`;

                container.appendChild(particle);

                // アニメーション終了後に削除
                setTimeout(() => {
                    particle.remove();
                }, 3000);
            }, i * 100);
        }
    }

    /**
     * 魔法の光のパーティクル
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} count - パーティクル数
     */
    createMagicSparkles(x, y, count = 30) {
        const container = this.getParticleContainer();
        const colors = ['#ba68c8', '#9c27b0', '#7b1fa2', '#4fc3f7', '#00bcd4'];

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle-magic';

                particle.style.left = `${x}px`;
                particle.style.top = `${y}px`;
                particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

                // ランダムな方向（上方向優先）
                const angle = Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
                const distance = 30 + Math.random() * 70;
                const dx = Math.cos(angle) * distance;
                const dy = Math.sin(angle) * distance;

                particle.style.setProperty('--dx', `${dx}px`);
                particle.style.setProperty('--dy', `${dy}px`);

                container.appendChild(particle);

                // アニメーション終了後に削除
                setTimeout(() => {
                    particle.remove();
                }, 1500);
            }, i * 20);
        }
    }

    /**
     * 爆発の火花
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} count - パーティクル数
     */
    createSparks(x, y, count = 40) {
        const container = this.getParticleContainer();
        const colors = ['#ff6b6b', '#ff9800', '#ffd93d', '#ffeb3b'];

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle-spark';

            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

            // 全方向にランダム
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
            const distance = 30 + Math.random() * 80;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;

            particle.style.setProperty('--dx', `${dx}px`);
            particle.style.setProperty('--dy', `${dy}px`);

            container.appendChild(particle);

            // アニメーション終了後に削除
            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }

    /**
     * 治癒の光の粒
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} count - パーティクル数
     */
    createHealParticles(x, y, count = 20) {
        const container = this.getParticleContainer();
        const colors = ['#7ED321', '#6bcf7f', '#4caf50', '#81c784'];

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle-heal';

                // 中心からランダムにずらす
                const offsetX = (Math.random() - 0.5) * 40;
                particle.style.left = `${x + offsetX}px`;
                particle.style.top = `${y}px`;
                particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

                container.appendChild(particle);

                // アニメーション終了後に削除
                setTimeout(() => {
                    particle.remove();
                }, 2000);
            }, i * 80);
        }
    }

    /**
     * 成功時の総合エフェクト
     * @param {HTMLElement} element - 中心となる要素
     */
    celebrationCombo(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // 星の輝き
        this.createStars(centerX, centerY, 25);

        // 紙吹雪
        setTimeout(() => {
            this.createConfetti(40);
        }, 300);

        // ハート
        setTimeout(() => {
            this.createHearts(10);
        }, 600);
    }

    /**
     * コンテナをクリア
     */
    clearParticles() {
        const container = document.getElementById('particle-container');
        if (container) {
            container.innerHTML = '';
        }
    }
}

// グローバルインスタンスを作成
window.particleEffects = new ParticleEffects();
