class SlidePuzzleGame {
    constructor() {
        this.gridSize = 3;
        this.totalTiles = 9;
        this.emptyIndex = 8;
        this.puzzleState = [];
        this.correctOrder = [];
        this.startTime = 0;
        this.timerInterval = null;
        this.gameRunning = false;
        this.currentProblem = 1;
        this.isForcedClear = false;
        this.currentGallerySize = 3;
        this.currentPage = 1;
        this.problemsPerPage = 10;
        this.totalPages = 5;


        // 画像パスを動的に生成
        this.problemImages = {
            3: {},
            4: {},
            5: {}
        };

        // 各サイズごとに50問分の画像パスを生成
        for (let size of [3, 4, 5]) {
            for (let i = 1; i <= 50; i++) {
                // ゼロパディング（01, 02, ... 50）
                const paddedNum = i.toString().padStart(2, '0');
                this.problemImages[size][i] = `assets/img/${size}x${size}/problem${paddedNum}`;
            }
        }

        // 画像の実際のファイル形式を検出するためのフラグ
        this.imageExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        this.loadedImagePaths = {};

        // クリッカーゲームのインスタンス
        this.clickerGame = null;

        // 複数CG解放用
        this.unlockQueue = [];
        this.currentUnlockIndex = 0;

        this.init();
    }

    saveBestTime(size, problemNum, timeInMs) {
        const key = `puzzle_${size}x${size}_problem${problemNum}`;
        const existingTime = window.saveManager.getItem(key);

        if (!existingTime || timeInMs < parseInt(existingTime)) {
            window.saveManager.setItem(key, timeInMs.toString());
            return true; // 新記録
        }
        return false; // 記録更新なし
    }

    getBestTime(size, problemNum) {
        const key = `puzzle_${size}x${size}_problem${problemNum}`;
        const time = window.saveManager.getItem(key);
        return time ? parseInt(time) : null;
    }

    markProblemAsCleared(size, problemNum) {
        const key = `puzzle_${size}x${size}_problem${problemNum}_cleared`;
        window.saveManager.setItem(key, 'true');
    }

    isProblemCleared(size, problemNum) {
        const key = `puzzle_${size}x${size}_problem${problemNum}_cleared`;
        return window.saveManager.getItem(key) === 'true';
    }

    clearProblemFlags(size, problemNum) {
        const timeKey = `puzzle_${size}x${size}_problem${problemNum}`;
        const clearedKey = `puzzle_${size}x${size}_problem${problemNum}_cleared`;
        window.saveManager.removeItem(timeKey);
        window.saveManager.removeItem(clearedKey);
    }

    formatTime(timeInMs) {
        const seconds = Math.floor(timeInMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    resetAllTimes() {
        const sizeText = this.gridSize + "×" + this.gridSize;
        const confirmMessage = `${sizeText}の全ての記録をリセットしますか？\nこの操作は取り消せません。`;

        if (confirm(confirmMessage)) {
            this.clearTimesForSize(this.gridSize);
            this.updateBestTimesDisplay();
            alert(`${sizeText}の記録をリセットしました。`);
        }
    }

    resetBonusCGs() {
        const confirmMessage = `おまけCGの解放率をリセットしますか？\nこの操作は取り消せません。`;

        if (confirm(confirmMessage)) {
            // おまけCG解放情報をクリア
            window.saveManager.setItem('unlockedBonusCGs', JSON.stringify([]));

            // ギャラリー表示を更新
            this.updateBonusGalleryDisplay();

            // 解放率表示を更新
            this.updateBonusUnlockRate();

            alert('おまけCGの解放率をリセットしました。');
        }
    }

    clearTimesForSize(size) {
        for (let problemNum = 1; problemNum <= 50; problemNum++) {
            this.clearProblemFlags(size, problemNum);
        }
    }

    showGallery() {
        this.currentGallerySize = 3;
        this.updateGalleryDisplay();
        this.showScreen('gallery-screen');
    }

    switchGalleryTab(size) {
        this.currentGallerySize = size;

        // タブボタンの状態を更新
        document.querySelectorAll('.gallery-tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.size === String(size)) {
                btn.classList.add('active');
            }
        });

        // ギャラリーグリッドの表示を切り替え
        document.querySelectorAll('.gallery-grid').forEach(grid => {
            grid.classList.add('hidden');
        });

        // 解放率表示の表示/非表示を切り替え
        const bonusRateDisplay = document.getElementById('bonus-unlock-rate-display');
        if (bonusRateDisplay) {
            if (size === 'bonus') {
                bonusRateDisplay.classList.remove('hidden');
                document.getElementById('gallery-bonus').classList.remove('hidden');
            } else {
                bonusRateDisplay.classList.add('hidden');
                document.getElementById(`gallery-${size}x${size}`).classList.remove('hidden');
            }
        }

        this.updateGalleryDisplay();
    }

    updateGalleryDisplay() {
        if (this.currentGallerySize === 'bonus') {
            this.updateBonusGalleryDisplay();
            return;
        }

        console.time(`⏱️ 通常CGギャラリー表示 (${this.currentGallerySize}x${this.currentGallerySize})`);
        const galleryGrid = document.getElementById(`gallery-${this.currentGallerySize}x${this.currentGallerySize}`);
        galleryGrid.innerHTML = '';

        const clearedProblems = this.getClearedProblems(this.currentGallerySize);
        console.log(`📊 クリア済み問題数: ${clearedProblems.length}問`);

        if (clearedProblems.length === 0) {
            galleryGrid.innerHTML = '<div class="gallery-empty">まだクリアした問題がありません</div>';
            console.timeEnd(`⏱️ 通常CGギャラリー表示 (${this.currentGallerySize}x${this.currentGallerySize})`);
            return;
        }

        console.time('⏱️ ギャラリーアイテム作成（通常CG）');
        const fragment = document.createDocumentFragment();
        clearedProblems.forEach((problem, index) => {
            const galleryItem = this.createGalleryItem(problem);
            fragment.appendChild(galleryItem);

            // ギャラリーアイテムのアニメーションは無効化
        });
        console.timeEnd('⏱️ ギャラリーアイテム作成（通常CG）');

        console.time('⏱️ DOM追加（通常CG）');
        galleryGrid.appendChild(fragment);
        console.timeEnd('⏱️ DOM追加（通常CG）');

        console.timeEnd(`⏱️ 通常CGギャラリー表示 (${this.currentGallerySize}x${this.currentGallerySize})`);
    }

    updateBonusGalleryDisplay() {
        console.time('⏱️ おまけCGギャラリー表示');
        const galleryGrid = document.getElementById('gallery-bonus');
        galleryGrid.innerHTML = '';

        // 解放済みボーナスCGを取得
        console.time('⏱️ 解放済みCG取得');
        const unlockedBonuses = this.getUnlockedBonusCGs();
        console.timeEnd('⏱️ 解放済みCG取得');
        console.log(`📊 解放済みCG数: ${unlockedBonuses.length}枚`);

        // 解放率を画面上部に表示
        const unlockRate = Math.floor((unlockedBonuses.length / 100) * 100);
        const rateBar = document.getElementById('unlock-rate-bar');
        const rateText = document.getElementById('unlock-rate-text');

        if (rateBar) {
            rateBar.style.width = `${unlockRate}%`;
        }

        if (rateText) {
            rateText.textContent = `${unlockedBonuses.length}/100 (${unlockRate}%)`;
        }

        if (unlockedBonuses.length === 0) {
            galleryGrid.innerHTML = '';
            console.timeEnd('⏱️ おまけCGギャラリー表示');
            return;
        }

        // ボーナスIDを番号順にソート（bonus001, bonus002, ...）
        console.time('⏱️ ソート処理');
        const sortedBonuses = [...unlockedBonuses].sort();
        console.timeEnd('⏱️ ソート処理');

        // DocumentFragmentを使って一括追加（DOM操作を最適化）
        console.time('⏱️ ギャラリーアイテム作成');
        const fragment = document.createDocumentFragment();
        sortedBonuses.forEach((bonusId) => {
            const galleryItem = this.createBonusGalleryItem(bonusId);
            fragment.appendChild(galleryItem);
        });
        console.timeEnd('⏱️ ギャラリーアイテム作成');

        console.time('⏱️ DOM追加');
        galleryGrid.appendChild(fragment);
        console.timeEnd('⏱️ DOM追加');

        console.timeEnd('⏱️ おまけCGギャラリー表示');
    }

    createBonusGalleryItem(bonusId) {
        const item = document.createElement('div');
        item.className = 'gallery-item';

        // bonusIdから番号を抽出（bonus001 → 1）
        const bonusNum = parseInt(bonusId.replace('bonus', ''));

        const imagePath = `assets/img/bonus/${bonusId}.jpg`;

        const img = document.createElement('img');
        img.src = imagePath;
        img.alt = `おまけCG No.${bonusNum}`;
        img.loading = 'lazy';  // 遅延読み込みを有効化

        const info = document.createElement('div');
        info.className = 'gallery-item-info';

        const title = document.createElement('div');
        title.className = 'gallery-item-title';
        title.textContent = `おまけCG No.${bonusNum}`;

        info.appendChild(title);
        item.appendChild(img);
        item.appendChild(info);

        // クリックで拡大（通常のCGと同じshowModalを使用）
        item.addEventListener('click', () => {
            // おまけCG用のproblemオブジェクトを作成
            const bonusProblem = {
                imagePath: imagePath,
                size: 'おまけCG',
                problemNum: bonusNum,
                bestTime: null,
                isBonusCG: true  // おまけCGであることを示すフラグ
            };
            this.showModal(bonusProblem);
        });

        return item;
    }

    getUnlockedBonusCGs() {
        const saved = window.saveManager.getItem('unlockedBonusCGs');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('解放済みボーナスCGの読み込みに失敗:', e);
                return [];
            }
        }
        return [];
    }

    getClearedProblems(size) {
        const clearedProblems = [];
        for (let problemNum = 1; problemNum <= 50; problemNum++) {
            const isCleared = this.isProblemCleared(size, problemNum);
            if (isCleared) {
                const bestTime = this.getBestTime(size, problemNum);
                clearedProblems.push({
                    size: size,
                    problemNum: problemNum,
                    bestTime: bestTime, // nullの場合もある（すぐクリアのみの場合）
                    imagePath: this.problemImages[size][problemNum],
                    isForcedOnly: !bestTime // ベストタイムがない場合はすぐクリアのみ
                });
            }
        }
        return clearedProblems;
    }

    createGalleryItem(problem) {
        const item = document.createElement('div');
        item.className = 'gallery-item';

        // すぐクリアのみの場合は特別なスタイルを追加
        if (problem.isForcedOnly) {
            item.classList.add('forced-clear-only');
        }

        const img = document.createElement('img');
        img.loading = 'lazy';  // 遅延読み込みを有効化

        // 画像パスを非同期で解決
        this.detectImageExtension(problem.imagePath).then(fullPath => {
            img.src = fullPath;
        });

        img.alt = `${problem.size}×${problem.size} 第${problem.problemNum}問`;

        const info = document.createElement('div');
        info.className = 'gallery-item-info';

        const title = document.createElement('div');
        title.className = 'gallery-item-title';
        title.textContent = `${problem.size}×${problem.size} 第${problem.problemNum}問`;

        const time = document.createElement('div');
        time.className = 'gallery-item-time';

        if (problem.bestTime) {
            time.textContent = `ベスト: ${this.formatTime(problem.bestTime)}`;
        } else {
            time.textContent = '即堕ちのみ';
            time.classList.add('forced-clear-text');
        }

        info.appendChild(title);
        info.appendChild(time);
        item.appendChild(img);
        item.appendChild(info);

        // クリックで拡大表示
        item.addEventListener('click', () => {
            this.showModal(problem);
        });

        return item;
    }

    showModal(problem) {
        const modal = document.getElementById('image-modal');
        const modalImage = document.getElementById('modal-image');
        const modalTitle = document.getElementById('modal-title');
        const modalTime = document.getElementById('modal-time');

        // おまけCGの場合は画像パスを直接設定（.jpg固定）
        if (problem.isBonusCG) {
            modalImage.src = problem.imagePath;
            modalTitle.textContent = `おまけCG No.${problem.problemNum}`;
            modalTime.textContent = '';
        } else {
            // 通常のCGの場合は画像パスを非同期で解決
            this.detectImageExtension(problem.imagePath).then(fullPath => {
                modalImage.src = fullPath;
            });

            modalTitle.textContent = `${problem.size}×${problem.size} 第${problem.problemNum}問`;

            if (problem.bestTime) {
                modalTime.textContent = `ベストタイム: ${this.formatTime(problem.bestTime)}`;
            } else {
                modalTime.textContent = '即堕ちのみ（正式なクリア記録なし）';
            }
        }

        modal.classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('image-modal').classList.add('hidden');
    }

    async detectImageExtension(basePath) {
        // キャッシュをチェック
        if (this.loadedImagePaths[basePath]) {
            return this.loadedImagePaths[basePath];
        }

        // 各拡張子を試して、存在する画像を見つける
        for (let ext of this.imageExtensions) {
            const fullPath = `${basePath}.${ext}`;
            try {
                const exists = await this.imageExists(fullPath);
                if (exists) {
                    this.loadedImagePaths[basePath] = fullPath;
                    return fullPath;
                }
            } catch (e) {
                // 次の拡張子を試す
                continue;
            }
        }

        // デフォルトは.jpg
        const defaultPath = `${basePath}.jpg`;
        this.loadedImagePaths[basePath] = defaultPath;
        return defaultPath;
    }

    imageExists(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }

    init() {
        // ブラウザの自動スクロール復元を無効化（モバイル対応）
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        this.setGridSize(3); // デフォルトは3x3
        this.bindEvents();
        this.showScreen('title-screen');

        // モーダルを確実に非表示にする
        document.getElementById('image-modal').classList.add('hidden');

        // BGM初期化フラグ
        this.bgmInitialized = false;

        // ゲーム起動時にBGMを開始
        this.initBGM();

        // デバッグ用: タッチイベントのログ
        console.log('Game initialized. Touch events bound.');

        // クリッカーゲームのインスタンスを作成
        if (window.ClickerGame) {
            this.clickerGame = new window.ClickerGame();
        }
    }

    initBGM() {
        if (!window.soundManager) {
            return;
        }

        // BGMを即座に開始試行
        window.soundManager.switchToTitleBGM();
        this.bgmInitialized = true;

        // ユーザーインタラクション時の再試行用ハンドラ
        const startBGMOnInteraction = () => {
            if (!this.bgmInitialized) {
                window.soundManager.switchToTitleBGM();
                this.bgmInitialized = true;
            }
            // 一度成功したらリスナーを削除
            document.removeEventListener('click', startBGMOnInteraction);
            document.removeEventListener('touchstart', startBGMOnInteraction);
            document.removeEventListener('keydown', startBGMOnInteraction);
        };

        // 複数のイベントでBGM開始を試みる
        document.addEventListener('click', startBGMOnInteraction, { once: true });
        document.addEventListener('touchstart', startBGMOnInteraction, { once: true });
        document.addEventListener('keydown', startBGMOnInteraction, { once: true });
    }

    bindEvents() {
        // 全てのボタンにクリック音を追加
        document.querySelectorAll('.btn, .size-btn, .problem-btn, .gallery-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // 初回クリック時にBGMを初期化
                if (!this.bgmInitialized && window.soundManager) {
                    window.soundManager.switchToTitleBGM();
                    this.bgmInitialized = true;
                }

                if (window.soundManager) {
                    window.soundManager.playButtonClick();
                }
            });
        });

        // スタートボタン: タッチイベントとクリックイベントの両方に対応
        const startBtn = document.getElementById('start-btn');

        if (!startBtn) {
            console.error('Start button not found!');
            return;
        }

        const startBtnHandler = () => {
            console.log('Start button handler called');
            this.showScreen('select-screen');
        };

        // タッチイベントを優先的に処理
        let touchHandled = false;

        // touchstart でタッチ開始を記録
        startBtn.addEventListener('touchstart', (e) => {
            console.log('Start button touchstart');
            // タッチフィードバック用
            startBtn.style.transform = 'scale(0.95)';
        }, { passive: true });

        startBtn.addEventListener('touchend', (e) => {
            console.log('Start button touchend');
            e.preventDefault(); // デフォルトのタッチ動作を防止
            e.stopPropagation(); // イベントの伝播を停止
            touchHandled = true;
            startBtn.style.transform = ''; // スタイルをリセット
            startBtnHandler();
            // タッチイベント処理後、フラグをリセット
            setTimeout(() => { touchHandled = false; }, 500);
        }, { passive: false });

        // クリックイベント（デスクトップ用、またはタッチイベントが処理されなかった場合）
        startBtn.addEventListener('click', (e) => {
            console.log('Start button click, touchHandled:', touchHandled);
            if (!touchHandled) {
                e.preventDefault();
                startBtnHandler();
            }
        });

        console.log('Start button events bound');

        // サイズ選択ボタン
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const size = parseInt(btn.dataset.size);
                this.setGridSize(size);
                this.showProblemSelectScreen();
            });
        });

        // 戻るボタン
        document.getElementById('back-to-title').addEventListener('click', () => {
            this.showScreen('title-screen');
        });

        document.getElementById('back-to-size-select').addEventListener('click', () => {
            this.showScreen('select-screen');
        });

        document.getElementById('back-to-select').addEventListener('click', () => {
            this.stopTimer();
            this.showProblemSelectScreen();
        });

        document.getElementById('back-to-select-clear').addEventListener('click', () => {
            this.showProblemSelectScreen();
        });

        document.getElementById('retry-btn').addEventListener('click', () => {
            this.startGameWithProblem(this.currentProblem);
        });

        // ボーナスステージボタン
        document.getElementById('start-clicker-bonus').addEventListener('click', () => {
            this.startClickerBonus();
        });

        document.getElementById('force-clear').addEventListener('click', () => {
            this.forceClear();
        });

        // デバッグ用：ボーナスステージ直行ボタン
        document.getElementById('debug-bonus').addEventListener('click', () => {
            this.startClickerBonus();
        });

        // リセットボタン
        document.getElementById('reset-times-btn').addEventListener('click', () => {
            this.resetAllTimes();
        });

        // おまけCG解放率リセットボタン
        document.getElementById('reset-bonus-cg-btn').addEventListener('click', () => {
            this.resetBonusCGs();
        });

        // ギャラリーボタン: タッチイベントとクリックイベントの両方に対応
        const galleryBtn = document.getElementById('gallery-btn');
        const galleryBtnHandler = () => {
            this.showGallery();
        };

        let galleryTouchHandled = false;

        galleryBtn.addEventListener('touchstart', (e) => {
            galleryBtn.style.transform = 'scale(0.95)';
        }, { passive: true });

        galleryBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            galleryTouchHandled = true;
            galleryBtn.style.transform = '';
            galleryBtnHandler();
            setTimeout(() => { galleryTouchHandled = false; }, 500);
        }, { passive: false });

        galleryBtn.addEventListener('click', (e) => {
            if (!galleryTouchHandled) {
                e.preventDefault();
                galleryBtnHandler();
            }
        });

        document.getElementById('back-to-title-gallery').addEventListener('click', () => {
            this.showScreen('title-screen');
        });

        document.getElementById('back-to-title-gallery-bottom').addEventListener('click', () => {
            this.showScreen('title-screen');
        });

        // ギャラリータブボタン
        document.querySelectorAll('.gallery-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const size = btn.dataset.size === 'bonus' ? 'bonus' : parseInt(btn.dataset.size);
                this.switchGalleryTab(size);
            });
        });

        // モーダル関連
        const modal = document.getElementById('image-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'image-modal') {
                    this.closeModal();
                }
            });
        }

        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // ページネーションボタン
        document.getElementById('prev-page-btn').addEventListener('click', () => {
            this.goToPreviousPage();
        });

        document.getElementById('next-page-btn').addEventListener('click', () => {
            this.goToNextPage();
        });

        // 解放CG画面のボタン
        document.getElementById('next-unlocked-cg').addEventListener('click', () => {
            this.showNextUnlockedCG();
        });

        document.getElementById('back-to-title-unlocked').addEventListener('click', () => {
            this.showScreen('title-screen');
        });
    }

    showScreen(screenId) {
        // スクロールを即座にリセット（画面切り替え前）
        this.resetScroll();

        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.add('hidden'));

        const targetScreen = document.getElementById(screenId);
        targetScreen.classList.remove('hidden');

        // 画面出現アニメーション（特定の画面のみ）
        // アニメーションなし: title-screen, select-screen, problem-select-screen, game-screen, gallery-screen
        const noAnimationScreens = ['title-screen', 'select-screen', 'problem-select-screen', 'game-screen', 'gallery-screen'];

        if (window.animationController && !noAnimationScreens.includes(screenId)) {
            window.animationController.fadeInUp(targetScreen);
        }

        // 画面切り替え後にもスクロールリセット（複数のタイミングで実行）
        setTimeout(() => {
            this.resetScroll();
        }, 0);

        setTimeout(() => {
            this.resetScroll();
        }, 50);

        setTimeout(() => {
            this.resetScroll();
        }, 100);

        // BGM管理: 画面ごとに適切なBGMを再生
        if (window.soundManager) {
            // タイトル画面に遷移する際はボイスを停止
            if (screenId === 'title-screen') {
                window.soundManager.stopVoice();
                window.soundManager.switchToTitleBGM();
            } else if (screenId === 'select-screen' || screenId === 'problem-select-screen') {
                window.soundManager.switchToTitleBGM();
            } else if (screenId === 'gallery-screen') {
                window.soundManager.switchToGalleryBGM();
                // ギャラリー表示を最新の状態に更新
                this.updateBonusGalleryDisplay();
                this.updateBonusUnlockRate();
            } else if (screenId === 'clear-screen') {
                window.soundManager.switchToClearBGM();
            } else if (screenId === 'unlocked-cg-screen') {
                window.soundManager.switchToOmakeBGM(); // おまけCG解放画面でおまけBGMを使用
            }
        }
    }

    showUnlockedCGScreen(cgDataArray) {
        // 音声を停止
        if (window.soundManager) {
            window.soundManager.stopVoice();
        }

        // cgDataArrayが配列でない場合は配列に変換（後方互換性のため）
        if (!Array.isArray(cgDataArray)) {
            // 旧形式: showUnlockedCGScreen(imagePath, cgName)
            const imagePath = arguments[0];
            const cgName = arguments[1];
            cgDataArray = [{ imagePath, cgName }];
        }

        // CGキューを設定
        this.unlockQueue = cgDataArray;
        this.currentUnlockIndex = 0;

        // 最初のCGを表示
        this.displayCurrentUnlockedCG();

        // 画面遷移
        this.showScreen('unlocked-cg-screen');

        // 紙吹雪エフェクト
        if (window.confetti) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 }
                });
            }, 250);

            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 }
                });
            }, 400);
        }
    }

    /**
     * 現在のCGを表示
     */
    displayCurrentUnlockedCG() {
        if (this.unlockQueue.length === 0) return;

        const currentCG = this.unlockQueue[this.currentUnlockIndex];
        const cgImage = document.getElementById('unlocked-cg-image');
        const cgNameElement = document.getElementById('unlocked-cg-name');
        const cgProgressElement = document.getElementById('unlocked-cg-progress');
        const nextButton = document.getElementById('next-unlocked-cg');
        const backToTitleButton = document.getElementById('back-to-title-unlocked');

        // CG画像を設定
        if (cgImage) {
            cgImage.src = currentCG.imagePath;
        }

        // CG名を設定
        if (cgNameElement) {
            cgNameElement.textContent = currentCG.cgName;
        }

        // 進捗を表示
        if (cgProgressElement) {
            if (this.unlockQueue.length > 1) {
                cgProgressElement.textContent = `${this.currentUnlockIndex + 1} / ${this.unlockQueue.length}枚目`;
                cgProgressElement.classList.remove('hidden');
            } else {
                cgProgressElement.classList.add('hidden');
            }
        }

        // 次へボタンの表示制御
        if (nextButton) {
            if (this.currentUnlockIndex < this.unlockQueue.length - 1) {
                nextButton.classList.remove('hidden');
            } else {
                nextButton.classList.add('hidden');
            }
        }

        // トップへ戻るボタンの表示制御（最後の1枚のみ表示）
        if (backToTitleButton) {
            if (this.currentUnlockIndex === this.unlockQueue.length - 1) {
                backToTitleButton.classList.remove('hidden');
            } else {
                backToTitleButton.classList.add('hidden');
            }
        }
    }

    /**
     * 次のCGを表示
     */
    showNextUnlockedCG() {
        if (this.currentUnlockIndex < this.unlockQueue.length - 1) {
            this.currentUnlockIndex++;
            this.displayCurrentUnlockedCG();

            // 軽い紙吹雪エフェクト
            if (window.confetti) {
                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.6 }
                });
            }
        }
    }

    resetScroll() {
        // 複数の方法でスクロールを確実にリセット
        try {
            // 方法1: window.scrollTo (即座にスクロール)
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: 'instant' // アニメーションなしで即座に
            });

            // 方法2: body と documentElement の scrollTop を直接設定
            if (document.body) {
                document.body.scrollTop = 0;
                document.body.scrollLeft = 0;
            }
            if (document.documentElement) {
                document.documentElement.scrollTop = 0;
                document.documentElement.scrollLeft = 0;
            }

            // 方法3: すべての .screen 要素の scrollTop をリセット
            document.querySelectorAll('.screen').forEach(screen => {
                if (screen.scrollTop !== undefined) {
                    screen.scrollTop = 0;
                }
                if (screen.scrollLeft !== undefined) {
                    screen.scrollLeft = 0;
                }
            });

            // 方法4: レイアウトを強制的に再計算させる（モバイル向け）
            document.body.offsetHeight;

        } catch (e) {
            console.error('Scroll reset error:', e);
        }
    }

    showProblemSelectScreen() {
        const title = document.querySelector('#problem-select-screen h2');
        title.textContent = `${this.gridSize}×${this.gridSize} 問題を選択`;
        this.currentPage = 1; // ページをリセット
        this.generateProblemButtons();
        this.generatePageNumbers();
        this.updateBestTimesDisplay();
        this.updatePaginationControls();
        this.showScreen('problem-select-screen');
    }

    generateProblemButtons() {
        const container = document.getElementById('problem-buttons-container');
        container.innerHTML = '';

        // 現在のページに表示する問題の範囲を計算
        const startProblem = (this.currentPage - 1) * this.problemsPerPage + 1;
        const endProblem = Math.min(startProblem + this.problemsPerPage - 1, 50);

        for (let i = startProblem; i <= endProblem; i++) {
            const btn = document.createElement('button');
            btn.className = 'problem-btn';
            btn.dataset.problem = i;
            btn.dataset.size = this.gridSize; // サイズ情報を追加

            const title = document.createElement('div');
            title.className = 'problem-title';
            title.textContent = `第${i}問`;

            const bestTimeDiv = document.createElement('div');
            bestTimeDiv.className = 'problem-best-time';

            btn.appendChild(title);
            btn.appendChild(bestTimeDiv);

            btn.addEventListener('click', () => {
                const problemNum = parseInt(btn.dataset.problem);
                this.currentProblem = problemNum;

                // フィードバック
                if (window.feedbackManager) {
                    window.feedbackManager.showClick(btn);
                }

                this.startGameWithProblem(problemNum);
            });

            // ARIA属性を設定
            const bestTime = this.getBestTime(this.gridSize, i);
            const isCleared = this.isProblemCleared(this.gridSize, i);

            let ariaLabel = `第${i}問`;

            if (bestTime) {
                const timeStr = this.formatTime(bestTime);
                ariaLabel += ` ベストタイム ${timeStr}`;
                btn.dataset.cleared = 'true';
                btn.dataset.hasTime = 'true';
            } else if (isCleared) {
                ariaLabel += ' 即堕ちのみ';
                btn.dataset.cleared = 'true';
                btn.dataset.forcedOnly = 'true';
            } else {
                ariaLabel += ' 未クリア';
                btn.dataset.cleared = 'false';
            }

            btn.setAttribute('aria-label', ariaLabel);

            container.appendChild(btn);
        }
    }

    updateBestTimesDisplay() {
        const problemBtns = document.querySelectorAll('.problem-btn');
        problemBtns.forEach(btn => {
            const problemNum = parseInt(btn.dataset.problem);
            const bestTimeElement = btn.querySelector('.problem-best-time');
            const bestTime = this.getBestTime(this.gridSize, problemNum);
            const isCleared = this.isProblemCleared(this.gridSize, problemNum);

            if (bestTime) {
                // 正式なベストタイムがある場合
                const bestTimeString = this.formatTime(bestTime);
                bestTimeElement.textContent = `ベスト: ${bestTimeString}`;
                bestTimeElement.className = 'problem-best-time';
            } else if (isCleared) {
                // 即堕ちのみの場合
                bestTimeElement.textContent = '即堕ちのみ';
                bestTimeElement.className = 'problem-best-time forced-clear-text';
            } else {
                // 未クリアの場合
                bestTimeElement.textContent = '未クリア';
                bestTimeElement.className = 'problem-best-time';
            }
        });
    }

    setGridSize(size) {
        this.gridSize = size;
        this.totalTiles = size * size;
        this.emptyIndex = this.totalTiles - 1;

        // パズル状態と正解状態を初期化
        this.puzzleState = [];
        this.correctOrder = [];
        for (let i = 1; i < this.totalTiles; i++) {
            this.puzzleState.push(i);
            this.correctOrder.push(i);
        }
        // 最後に空のタイル（0）を追加
        this.puzzleState.push(0);
        this.correctOrder.push(0);

        // ゲームタイトルを更新
        document.getElementById('game-title').innerHTML = `${size}×${size}スライドパズル<br>第${this.currentProblem}問`;
    }

    startGame() {
        this.stopTimer();
        this.startTimer();
        this.isForcedClear = false; // ゲーム開始時にフラグをリセット
        this.shufflePuzzle();
        this.renderPuzzle();
        this.showScreen('game-screen');
        this.gameRunning = true;
    }

    startGameWithProblem(problemNum) {
        this.stopTimer();
        this.startTimer();
        this.isForcedClear = false; // ゲーム開始時にフラグをリセット
        this.currentProblem = problemNum;
        this.shufflePuzzle(); // 問題番号に関係なくシャッフルを行う
        this.renderPuzzle();
        document.getElementById('game-title').innerHTML = `${this.gridSize}×${this.gridSize}スライドパズル<br>第${problemNum}問`;
        this.showScreen('game-screen');
        this.gameRunning = true;

        // パズルBGMに切り替え
        if (window.soundManager) {
            window.soundManager.switchToPuzzleBGM();
        }

        // ゲーム開始時のフィードバック
        if (window.feedbackManager) {
            window.feedbackManager.setAmbient('active');
        }

        // アクセシビリティアナウンス
        if (window.accessibilityManager) {
            window.accessibilityManager.announceGameStart(problemNum, this.gridSize);
        }
    }


    shufflePuzzle() {
        console.log("シャッフル開始:", this.gridSize + "x" + this.gridSize);
        console.log("シャッフル前:", [...this.puzzleState]);

        // 完全ランダムな配置を生成し、解ける配置になるまで繰り返す
        let attempts = 0;
        const maxAttempts = 100;

        do {
            this.generateRandomConfiguration();
            attempts++;
        } while (!this.isSolvable() && attempts < maxAttempts);

        console.log("シャッフル試行回数:", attempts);
        console.log("シャッフル後:", [...this.puzzleState]);

        // 万が一解ける配置が見つからない場合は、移動ベースのシャッフルにフォールバック
        if (!this.isSolvable()) {
            console.log("フォールバック: 移動ベースのシャッフルを使用");
            this.fallbackShuffle();
            console.log("フォールバック後:", [...this.puzzleState]);
        }
    }

    generateRandomConfiguration() {
        // Fisher-Yatesシャッフルを使用して完全ランダムな配置を生成
        const numbers = [];
        for (let i = 1; i < this.totalTiles; i++) {
            numbers.push(i);
        }
        numbers.push(0); // 空のタイルを最後に追加

        // Fisher-Yatesシャッフル
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }

        this.puzzleState = [...numbers];
        this.emptyIndex = this.puzzleState.indexOf(0);
    }

    isSolvable() {
        // スライドパズルが解けるかどうかを判定
        const inversions = this.countInversions();

        if (this.gridSize % 2 === 1) {
            // 奇数サイズ: 逆転数が偶数なら解ける
            return inversions % 2 === 0;
        } else {
            // 偶数サイズ: より複雑な判定が必要
            const emptyRowFromBottom = this.gridSize - Math.floor(this.emptyIndex / this.gridSize);
            if (emptyRowFromBottom % 2 === 1) {
                return inversions % 2 === 0;
            } else {
                return inversions % 2 === 1;
            }
        }
    }

    countInversions() {
        // 逆転数をカウント（空のタイル0は除外）
        let inversions = 0;
        const nonZeroTiles = this.puzzleState.filter(tile => tile !== 0);

        for (let i = 0; i < nonZeroTiles.length - 1; i++) {
            for (let j = i + 1; j < nonZeroTiles.length; j++) {
                if (nonZeroTiles[i] > nonZeroTiles[j]) {
                    inversions++;
                }
            }
        }

        return inversions;
    }

    fallbackShuffle() {
        // 移動ベースのシャッフル（フォールバック用）
        const shuffleCount = this.gridSize * this.gridSize * 100;

        for (let i = 0; i < shuffleCount; i++) {
            const validMoves = this.getValidMoves();
            if (validMoves.length > 0) {
                const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                this.swapTiles(this.emptyIndex, randomMove);
            }
        }
    }

    getValidMoves() {
        const moves = [];
        const row = Math.floor(this.emptyIndex / this.gridSize);
        const col = this.emptyIndex % this.gridSize;

        // 上
        if (row > 0) moves.push(this.emptyIndex - this.gridSize);
        // 下
        if (row < this.gridSize - 1) moves.push(this.emptyIndex + this.gridSize);
        // 左
        if (col > 0) moves.push(this.emptyIndex - 1);
        // 右
        if (col < this.gridSize - 1) moves.push(this.emptyIndex + 1);

        return moves;
    }

    async renderPuzzle() {
        const puzzleGrid = document.getElementById('puzzle-grid');
        puzzleGrid.innerHTML = '';

        // グリッドサイズに応じたクラスを設定
        puzzleGrid.className = `size-${this.gridSize}`;

        const tileSize = this.getTileSize();

        // 画像パスを先に解決
        const baseImagePath = this.getPuzzleImagePath();
        const fullImagePath = await this.detectImageExtension(baseImagePath);

        for (let i = 0; i < this.totalTiles; i++) {
            const tile = document.createElement('div');
            tile.className = 'puzzle-piece';
            tile.dataset.index = i;

            if (this.puzzleState[i] === 0) {
                // 空のタイル
                tile.classList.add('empty');
            } else {
                // 画像のタイル
                const pieceNumber = this.puzzleState[i];
                const displayNumber = pieceNumber; // 表示用の番号（1から始まる）
                const imageIndex = pieceNumber - 1; // 画像位置計算用（0から始まる）
                const row = Math.floor(imageIndex / this.gridSize);
                const col = imageIndex % this.gridSize;
                tile.style.backgroundImage = `url(${fullImagePath})`;
                tile.style.backgroundPosition = `-${col * tileSize}px -${row * tileSize}px`;

                // 番号を表示
                const numberElement = document.createElement('div');
                numberElement.className = 'puzzle-number';
                numberElement.textContent = displayNumber; // そのまま表示
                tile.appendChild(numberElement);

                // タッチイベント処理用のフラグ
                let touchHandled = false;
                let touchStartTime = 0;
                let touchMoved = false;
                let touchStartX = 0;
                let touchStartY = 0;

                // タッチイベント（長押し防止とタッチフィードバック）
                tile.addEventListener('touchstart', (e) => {
                    touchStartTime = Date.now();
                    touchMoved = false;
                    touchHandled = false;
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                    tile.style.opacity = '0.8';  // タッチフィードバック
                }, { passive: true });

                tile.addEventListener('touchmove', (e) => {
                    // タッチ位置が大きく移動した場合のみmoveと判定
                    const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
                    const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
                    if (deltaX > 10 || deltaY > 10) {
                        touchMoved = true;
                    }
                }, { passive: true });

                tile.addEventListener('touchend', (e) => {
                    tile.style.opacity = '1';  // 元に戻す
                    const touchDuration = Date.now() - touchStartTime;

                    // タップと判定（移動が少なく、1秒以内）
                    if (!touchMoved && touchDuration < 1000) {
                        e.preventDefault();  // クリックイベントとの重複を防ぐ
                        e.stopPropagation();
                        touchHandled = true;
                        this.handleTileClick(i);

                        // タッチハンドラフラグをリセット
                        setTimeout(() => {
                            touchHandled = false;
                        }, 300);
                    }
                }, { passive: false });

                // クリックイベント（デスクトップ用、タッチイベントが処理されなかった場合のみ）
                tile.addEventListener('click', (e) => {
                    if (!touchHandled) {
                        this.handleTileClick(i);
                    }
                });
            }

            puzzleGrid.appendChild(tile);
        }

        // パズルグリッド全体にスワイプジェスチャーを追加
        this.addSwipeGesture(puzzleGrid);
    }

    getTileSize() {
        // 画面サイズと向きを考慮
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isLandscape = width > height;
        const isMobileWidth = width <= 767;

        // スマホ横画面（767px以下でlandscape）
        if (isMobileWidth && isLandscape) {
            switch (this.gridSize) {
                case 3: return 340 / 3;  // 横画面用: 340px (113.3px/tile) - CSSと一致
                case 4: return 360 / 4;  // 横画面用: 360px (90px/tile) - CSSと一致
                case 5: return 380 / 5;  // 横画面用: 380px (76px/tile) - CSSと一致
                default: return 340 / 3;
            }
        }
        // スマホ縦画面（767px以下でportrait）
        else if (isMobileWidth && !isLandscape) {
            switch (this.gridSize) {
                case 3: return 300 / 3;  // 縦画面用: 300px
                case 4: return 320 / 4;  // 縦画面用: 320px
                case 5: return 340 / 5;  // 縦画面用: 340px
                default: return 300 / 3;
            }
        }
        // デスクトップ・タブレット
        else {
            switch (this.gridSize) {
                case 3: return 420 / 3;
                case 4: return 440 / 4;
                case 5: return 460 / 5;
                default: return 420 / 3;
            }
        }
    }

    addSwipeGesture(element) {
        // スワイプジェスチャーのサポート（空タイルを移動）
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        element.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe(touchStartX, touchStartY, touchEndX, touchEndY);
        }, { passive: true });
    }

    handleSwipe(startX, startY, endX, endY) {
        const diffX = endX - startX;
        const diffY = endY - startY;
        const minSwipeDistance = 30;  // 最小スワイプ距離

        // スワイプが十分な距離でない場合は無視
        if (Math.abs(diffX) < minSwipeDistance && Math.abs(diffY) < minSwipeDistance) {
            return;
        }

        // 水平方向と垂直方向のどちらが大きいかを判定
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // 水平スワイプ
            if (diffX > 0) {
                this.moveEmptyTile('right');  // 右スワイプ → 空タイルを右に移動
            } else {
                this.moveEmptyTile('left');   // 左スワイプ → 空タイルを左に移動
            }
        } else {
            // 垂直スワイプ
            if (diffY > 0) {
                this.moveEmptyTile('down');   // 下スワイプ → 空タイルを下に移動
            } else {
                this.moveEmptyTile('up');     // 上スワイプ → 空タイルを上に移動
            }
        }
    }

    moveEmptyTile(direction) {
        const emptyRow = Math.floor(this.emptyIndex / this.gridSize);
        const emptyCol = this.emptyIndex % this.gridSize;
        let targetIndex = -1;

        switch (direction) {
            case 'up':
                if (emptyRow > 0) {
                    targetIndex = this.emptyIndex - this.gridSize;
                }
                break;
            case 'down':
                if (emptyRow < this.gridSize - 1) {
                    targetIndex = this.emptyIndex + this.gridSize;
                }
                break;
            case 'left':
                if (emptyCol > 0) {
                    targetIndex = this.emptyIndex - 1;
                }
                break;
            case 'right':
                if (emptyCol < this.gridSize - 1) {
                    targetIndex = this.emptyIndex + 1;
                }
                break;
        }

        if (targetIndex !== -1) {
            // タイルクリック音を再生
            if (window.soundManager) {
                window.soundManager.playTileClick();
            }

            this.swapTiles(this.emptyIndex, targetIndex);

            // タイルスライド音を再生
            if (window.soundManager) {
                window.soundManager.playTileSlide();
            }

            this.renderPuzzle();

            if (this.checkWin()) {
                this.gameRunning = false;
                this.isForcedClear = false;
                this.markProblemAsCleared(this.gridSize, this.currentProblem);
                this.stopTimer();

                // 成功フィードバック
                if (window.feedbackManager) {
                    window.feedbackManager.setAmbient('victory');
                }

                setTimeout(() => {
                    this.showWinScreen();
                }, 300);
            }
        }
    }

    getPuzzleImagePath() {
        const sizeImages = this.problemImages[this.gridSize];
        if (sizeImages && sizeImages[this.currentProblem]) {
            return sizeImages[this.currentProblem];
        }

        // フォールバック画像（拡張子なし）
        switch (this.gridSize) {
            case 3: return 'assets/img/puzzle3x3';
            case 4: return 'assets/img/puzzle4x4';
            case 5: return 'assets/img/puzzle5x5';
            default: return 'assets/img/puzzle3x3';
        }
    }

    handleTileClick(clickedIndex) {
        // クリックされたタイルが空のタイルと隣接しているかチェック
        if (this.isAdjacent(clickedIndex, this.emptyIndex)) {
            // タイルクリック音を再生
            if (window.soundManager) {
                window.soundManager.playTileClick();
            }

            // タイル移動時のパーティクルエフェクト
            if (window.particleEffects) {
                const puzzleGrid = document.getElementById('puzzle-grid');
                const tiles = puzzleGrid.querySelectorAll('.puzzle-piece');
                const clickedTile = tiles[clickedIndex];

                if (clickedTile) {
                    const rect = clickedTile.getBoundingClientRect();
                    const x = rect.left + rect.width / 2;
                    const y = rect.top + rect.height / 2;

                    // 軽い魔法のパーティクル
                    window.particleEffects.createMagicSparkles(x, y, 5);
                }
            }

            this.swapTiles(clickedIndex, this.emptyIndex);

            // タイルスライド音を再生
            if (window.soundManager) {
                window.soundManager.playTileSlide();
            }

            this.renderPuzzle();

            if (this.checkWin()) {
                this.gameRunning = false;
                this.isForcedClear = false; // 通常クリアなのでフラグをリセット
                this.markProblemAsCleared(this.gridSize, this.currentProblem); // クリア済みフラグを設定
                this.stopTimer();

                // 成功フィードバック
                if (window.feedbackManager) {
                    window.feedbackManager.setAmbient('victory');
                }

                setTimeout(() => {
                    this.showWinScreen();
                }, 300);
            }
        }
    }

    isAdjacent(index1, index2) {
        const row1 = Math.floor(index1 / this.gridSize);
        const col1 = index1 % this.gridSize;
        const row2 = Math.floor(index2 / this.gridSize);
        const col2 = index2 % this.gridSize;

        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);

        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    swapTiles(index1, index2) {
        [this.puzzleState[index1], this.puzzleState[index2]] = [this.puzzleState[index2], this.puzzleState[index1]];

        // 空のタイルの位置を更新
        if (this.puzzleState[index1] === 0) {
            this.emptyIndex = index1;
        } else if (this.puzzleState[index2] === 0) {
            this.emptyIndex = index2;
        }
    }

    startTimer() {
        this.startTime = Date.now();
        this.updateTimer();
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        const elapsed = Date.now() - this.startTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        const timeString = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        const timerDisplay = document.getElementById('timer-display');

        // タイマーはアニメーションなしで更新
        timerDisplay.textContent = `タイム: ${timeString}`;
    }

    checkWin() {
        return JSON.stringify(this.puzzleState) === JSON.stringify(this.correctOrder);
    }

    showWinScreen() {
        const clearTimeCard = document.getElementById('clear-time');
        const bestTimeCard = document.getElementById('best-time');
        const newRecordBadge = document.getElementById('new-record-badge');
        const bonusStageOffer = document.getElementById('bonus-stage-offer');

        // バッジとベストタイムカードとボーナスステージオファーを初期化
        newRecordBadge.classList.add('hidden');
        bestTimeCard.classList.add('hidden');
        bonusStageOffer.classList.add('hidden');

        if (this.isForcedClear) {
            // 即堕ちの場合
            const bestTime = this.getBestTime(this.gridSize, this.currentProblem);

            clearTimeCard.querySelector('.time-value').textContent = '即堕ち';

            if (bestTime) {
                bestTimeCard.querySelector('.time-value').textContent = this.formatTime(bestTime);
                bestTimeCard.classList.remove('hidden');
            }

            this.isForcedClear = false; // フラグをリセット
        } else {
            // 通常クリアの場合
            const elapsed = Date.now() - this.startTime;
            const timeString = this.formatTime(elapsed);

            // ベストタイムの保存と比較
            const isNewRecord = this.saveBestTime(this.gridSize, this.currentProblem, elapsed);
            const bestTime = this.getBestTime(this.gridSize, this.currentProblem);

            // クリアタイムを表示
            clearTimeCard.querySelector('.time-value').textContent = timeString;

            if (isNewRecord) {
                // NEW RECORDバッジを表示
                newRecordBadge.classList.remove('hidden');

                // 新記録時のエフェクトとアニメーション
                if (window.particleEffects) {
                    // canvas-confettiによる豪華な紙吹雪
                    window.particleEffects.celebrateNewRecord();

                    // カスタムパーティクルエフェクトを追加
                    setTimeout(() => {
                        window.particleEffects.createStars(window.innerWidth / 2, window.innerHeight / 2, 30);
                    }, 500);

                    setTimeout(() => {
                        window.particleEffects.createHearts(20);
                    }, 1000);
                }
                if (window.soundManager) {
                    window.soundManager.playNewRecord();
                }
                if (window.animationController) {
                    window.animationController.bounceElement(clearTimeCard);
                }
            } else {
                // 通常クリア時のエフェクト
                if (window.particleEffects) {
                    // canvas-confettiによる紙吹雪
                    window.particleEffects.celebrateWin();

                    // カスタムパーティクルエフェクト
                    window.particleEffects.celebrationCombo(clearTimeCard);
                }
                if (window.soundManager) {
                    window.soundManager.playComplete();
                }
                if (window.animationController) {
                    window.animationController.popup(clearTimeCard);
                }

                // ベストタイムカードを表示
                if (bestTime && bestTime !== elapsed) {
                    bestTimeCard.querySelector('.time-value').textContent = this.formatTime(bestTime);
                    bestTimeCard.classList.remove('hidden');
                }
            }

            // 通常クリア時はボーナスステージオファーを表示
            bonusStageOffer.classList.remove('hidden');
        }

        // CG画像の処理
        const clearImage = document.getElementById('clear-image');
        const cgContainer = document.getElementById('cg-container');

        if (this.isForcedClear) {
            // 即堕ちの場合は画像を非表示
            cgContainer.classList.add('hidden');
            this.showScreen('clear-screen');
        } else {
            // 通常クリアの場合は画像を表示
            cgContainer.classList.remove('hidden');
            const baseImagePath = this.getPuzzleImagePath();

            // 画像のloadedクラスを削除して初期化
            clearImage.classList.remove('loaded');
            clearImage.src = '';

            // 先に画面を表示してから画像を読み込む（点滅防止）
            this.showScreen('clear-screen');

            // 画像パスを解決してから画像を読み込む
            this.detectImageExtension(baseImagePath).then(fullImagePath => {
                // 画像を事前に読み込む
                const preloadImage = new Image();
                preloadImage.onload = () => {
                    // 画像が読み込まれたら設定
                    clearImage.src = fullImagePath;
                    // 少し遅延させてから画像を表示（スムーズな遷移）
                    setTimeout(() => {
                        clearImage.classList.add('loaded');
                    }, 50);
                };
                preloadImage.onerror = () => {
                    // エラーの場合もとりあえず表示
                    clearImage.src = fullImagePath;
                    setTimeout(() => {
                        clearImage.classList.add('loaded');
                    }, 50);
                };
                preloadImage.src = fullImagePath;
            });
        }
    }


    forceClear() {
        if (this.gameRunning) {
            this.gameRunning = false;
            this.isForcedClear = true;
            this.markProblemAsCleared(this.gridSize, this.currentProblem); // すぐクリアでもクリア済みフラグを設定
            this.stopTimer();
            this.showWinScreen();
        }
    }

    /**
     * クリッカーボーナスステージ開始
     */
    async startClickerBonus() {
        console.log('🎮 ボーナスステージ開始');

        if (!this.clickerGame) {
            console.error('クリッカーゲームが初期化されていません');
            return;
        }

        // クリア画像パスを取得
        const baseImagePath = this.getPuzzleImagePath();
        const fullImagePath = await this.detectImageExtension(baseImagePath);

        // 画像リストを作成（現在のクリア画像のみ）
        const images = [fullImagePath];

        // クリッカー画面に遷移
        this.showScreen('clicker-screen');

        // ボーナスBGMに切り替え
        if (window.soundManager) {
            window.soundManager.switchToBonusBGM();
        }

        // クリッカーゲーム開始
        this.clickerGame.start(images);
    }

    generatePageNumbers() {
        const pageNumbersContainer = document.getElementById('page-numbers');
        pageNumbersContainer.innerHTML = '';

        for (let i = 1; i <= this.totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'page-number-btn';
            pageBtn.textContent = i;
            pageBtn.dataset.page = i;

            if (i === this.currentPage) {
                pageBtn.classList.add('active');
            }

            pageBtn.addEventListener('click', () => {
                if (window.soundManager) {
                    window.soundManager.playButtonClick();
                }
                this.goToPage(parseInt(pageBtn.dataset.page));
            });

            pageNumbersContainer.appendChild(pageBtn);
        }
    }

    updatePaginationControls() {
        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');
        const pageIndicator = document.getElementById('page-indicator');

        // 前へボタンの状態
        if (this.currentPage === 1) {
            prevBtn.disabled = true;
        } else {
            prevBtn.disabled = false;
        }

        // 次へボタンの状態
        if (this.currentPage === this.totalPages) {
            nextBtn.disabled = true;
        } else {
            nextBtn.disabled = false;
        }

        // ページインジケーターの更新
        pageIndicator.textContent = `ページ ${this.currentPage} / ${this.totalPages}`;

        // ページ番号ボタンの状態を更新
        document.querySelectorAll('.page-number-btn').forEach(btn => {
            if (parseInt(btn.dataset.page) === this.currentPage) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    goToPage(pageNumber) {
        if (pageNumber < 1 || pageNumber > this.totalPages) {
            return;
        }

        this.currentPage = pageNumber;
        this.generateProblemButtons();
        this.updateBestTimesDisplay();
        this.updatePaginationControls();
    }

    goToNextPage() {
        if (this.currentPage < this.totalPages) {
            this.goToPage(this.currentPage + 1);
        } else {
            // エラーフィードバック
            if (window.feedbackManager) {
                const btn = document.getElementById('next-page-btn');
                window.feedbackManager.showError(btn);
            }
        }
    }

    goToPreviousPage() {
        if (this.currentPage > 1) {
            this.goToPage(this.currentPage - 1);
        } else {
            // エラーフィードバック
            if (window.feedbackManager) {
                const btn = document.getElementById('prev-page-btn');
                window.feedbackManager.showError(btn);
            }
        }
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    const game = new SlidePuzzleGame();
    window.game = game; // グローバルアクセス用（キーボード操作）

    // ツールチップをバインド
    if (window.feedbackManager) {
        // 遅延実行でボタンが生成された後にバインド
        setTimeout(() => {
            const resetBtn = document.getElementById('reset-times-btn');
            if (resetBtn) {
                window.feedbackManager.bindTooltip(resetBtn, '全ての記録をリセット', 'top');
            }
        }, 500);
    }

    // NW.js環境でのウィンドウクローズ処理
    if (typeof nw !== 'undefined') {
        const win = nw.Window.get();
        win.on('close', function() {
            // タイマーをクリーンアップ
            if (game.timerInterval) {
                clearInterval(game.timerInterval);
            }
            // BGMを停止
            if (window.soundManager) {
                window.soundManager.stopAllSounds();
            }
            // 即座に強制終了（アプリケーションプロセス全体を終了）
            nw.App.quit();
        });
    }
});