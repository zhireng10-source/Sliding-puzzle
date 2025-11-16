/**
 * クリッカーゲームクラス
 */
class ClickerGame {
    constructor() {
        this.clickCount = 0;
        this.actualClickCount = 0;  // 実際のクリック回数（画像切り替え用）
        this.currentImageIndex = 0;
        this.isActive = false;
        this.lastClickTime = 0;
        this.lastDecayTime = 0;  // 最後の減少時刻
        this.lastDoubleTapTime = 0;  // ダブルタップ検出用の時刻
        this.pleasureDecayTimer = null;
        this.clickHistory = [];
        this.unlockedImages = new Set();
        this.hasMilestone = false;
        this.hideReactionTimer = null;  // リアクション非表示タイマー
        this.lastPleasureMilestone = 0;  // 最後の快楽度マイルストーン（10%単位）
        this.lastSweetSpotClick = -10;   // 最後にsweet spotが発動したクリック番号

        // 画像リスト（bonusフォルダの画像を使用）
        this.images = [];

        // リアクションテキスト（JSONファイルから読み込み）
        this.reactions = [];          // 快楽度50%以下
        this.superReactions = [];     // 快楽度51%以上、99%以下
        this.sweetSpotReactions = []; // sweet spot発生時
        this.finishReactions = [];    // 快楽度100%絶頂演出時
        this.doubleTapReactions = [];
        this.rapidReactions = [];

        // イベントバインド済みフラグ
        this.eventsbound = false;

        // 練習モードフラグ（おさわりモードで使用、CG解放なし）
        this.isPracticeMode = false;
    }

    /**
     * リアクションテキストをJavaScriptファイルから読み込み
     */
    loadReactions() {
        console.log('📖 リアクションテキスト読み込み開始...');

        // グローバルのREACTIONS_DATAから読み込み
        if (window.REACTIONS_DATA) {
            console.log('✅ REACTIONS_DATAが見つかりました');
            const data = window.REACTIONS_DATA;

            this.reactions = data.reactions || [];
            this.superReactions = data.SuperReactions || [];
            this.sweetSpotReactions = data.SweetSpotReactions || [];
            this.finishReactions = data.FinishReactions || [];
            this.doubleTapReactions = data.doubleTapReactions || [];
            this.rapidReactions = data.rapidReactions || [];

            console.log('✅ リアクションテキストを読み込みました:');
            console.log('  - 通常リアクション(~50%):', this.reactions.length, '個');
            console.log('  - 強リアクション(51~99%):', this.superReactions.length, '個');
            console.log('  - Sweet Spotリアクション:', this.sweetSpotReactions.length, '個');
            console.log('  - 絶頂リアクション:', this.finishReactions.length, '個');
            console.log('  - ダブルタップ:', this.doubleTapReactions.length, '個');
            console.log('  - 連打:', this.rapidReactions.length, '個');
        } else {
            console.error('❌ REACTIONS_DATAが見つかりません');
            // エラー時はデフォルトのリアクションを設定
            this.reactions = ['「んっ…」'];
            this.superReactions = ['「あっ…！」'];
            this.sweetSpotReactions = ['そこっ…！'];
            this.finishReactions = ['「イっちゃう…！」'];
            this.doubleTapReactions = ['そこっ…！'];
            this.rapidReactions = ['はやいっ…！'];
            console.log('⚠️ デフォルトリアクションを使用します');
        }
    }

    /**
     * クリッカーゲーム開始
     * @param {Array} images - 使用する画像のリスト（未使用、bonusフォルダの画像を使用）
     * @param {Boolean} isPracticeMode - 練習モードかどうか（true: CG解放なし）
     */
    start(images, isPracticeMode = false) {
        console.log('🎮 クリッカーゲーム開始 - isPracticeModeパラメータ:', isPracticeMode, '現在のフラグ:', this.isPracticeMode);

        // 練習モードフラグを設定
        this.isPracticeMode = isPracticeMode;
        console.log('🎮 フラグ設定後 - isPracticeMode:', this.isPracticeMode);

        // リアクションテキストを読み込み（初回のみ）
        if (this.reactions.length === 0) {
            this.loadReactions();
        }

        // bonusフォルダの画像を使用（bonus001.jpg～bonus100.jpg）
        this.images = [];
        for (let i = 1; i <= 100; i++) {
            const bonusNum = String(i).padStart(3, '0');
            this.images.push(`assets/img/bonus/bonus${bonusNum}.jpg`);
        }

        this.clickCount = 0;
        this.actualClickCount = 0;
        this.currentImageIndex = 0;
        this.isActive = true;
        this.unlockedImages.clear();
        this.hasMilestone = false;
        this.lastPleasureMilestone = 0;  // 快楽度マイルストーンをリセット
        this.lastSweetSpotClick = -10;  // sweet spot発動カウンターをリセット

        // デバッグログ
        console.log(`🔄 クリッカーゲーム変数リセット: actualClickCount=${this.actualClickCount}, lastSweetSpotClick=${this.lastSweetSpotClick}`);

        // タイマー初期化（重要：クリックするまで減少しないようnullで初期化）
        this.lastClickTime = null;
        this.lastDecayTime = null;
        this.lastDoubleTapTime = 0;

        // UI初期化
        this.resetUI();

        // 初期画像を表示
        this.updateImage();

        // 快楽度自動減少タイマー開始
        this.startPleasureDecayTimer();

        // イベントリスナーを設定（初回のみ）
        if (!this.eventsbound) {
            this.bindEvents();
            this.eventsbound = true;
        }

        // ボーナス効果音を再生開始
        if (window.soundManager) {
            window.soundManager.playBonusEffect();
        }
    }

    /**
     * イベントリスナーをバインド
     */
    bindEvents() {
        const cgArea = document.getElementById('clicker-cg-area');
        const helpBtn = document.getElementById('clicker-help-btn');
        const exitBtn = document.getElementById('clicker-exit-btn');
        const unlockBtn = document.getElementById('unlock-bonus-cg-btn');

        // CG領域のクリック
        cgArea.addEventListener('click', (e) => {
            // ボタンクリック時は処理しない
            if (e.target.classList.contains('clicker-control-btn') ||
                e.target.classList.contains('bonus-unlock-btn')) {
                return;
            }
            this.handleClick(e);
        });

        // ヘルプボタン
        helpBtn.addEventListener('click', () => this.showHelp());

        // 終了ボタン
        exitBtn.addEventListener('click', () => this.exit());

        // おまけCG解放ボタン
        unlockBtn.addEventListener('click', () => this.showUnlockedCGsFromButton());
    }

    /**
     * クリック処理
     */
    handleClick(event) {
        if (!this.isActive) return;

        // 前の吹き出しを非表示にする
        this.hideReaction();

        // 実際のクリック回数をカウント
        this.actualClickCount++;

        // 20%の確率でsweet spot発動（ただし連続では発動しない）
        const canTriggerSweetSpot = this.actualClickCount > this.lastSweetSpotClick + 1;
        const isSweetSpot = canTriggerSweetSpot && Math.random() < 0.2;

        // デバッグログ
        console.log(`🎯 sweet spot判定: actualClickCount=${this.actualClickCount}, lastSweetSpotClick=${this.lastSweetSpotClick}, canTrigger=${canTriggerSweetSpot}, isSweetSpot=${isSweetSpot}`);

        if (isSweetSpot) {
            // sweet spot: 快楽度+10%
            this.clickCount = Math.min(100, this.clickCount + 10);
            this.lastSweetSpotClick = this.actualClickCount;  // sweet spot発動を記録
            console.log(`✨ SWEET SPOT! 快楽度+10%（現在: ${this.clickCount}%）`);

            // sweet spot演出
            this.showSweetSpot(event);

            // 画像を大きく振動
            this.shakeScreen(30, 800);
        } else {
            // 通常: 快楽度+3%
            this.clickCount = Math.min(100, this.clickCount + 3);
            console.log(`🎮 クリック回数: ${this.actualClickCount}回（快楽度: ${this.clickCount}%）`);

            // 通常の画面振動
            this.shakeScreen(8, 200);
        }

        // 音声をランダムに再生
        if (window.soundManager) {
            window.soundManager.playRandomVoice();
        }

        // 最後のクリック時刻を更新
        this.lastClickTime = Date.now();

        // ゲージ更新
        this.updateProgress();

        // sweet spotの場合は通常のリアクションをスキップ
        if (isSweetSpot) {
            // sweet spot専用のリアクションは演出に含まれる
        } else {
            // ダブルタップ検出（通常リアクションより先に判定）
            const isDoubleTap = this.detectDoubleTap();

            // 連打検出（通常リアクションより先に判定）
            const isRapidClick = this.detectRapidClick();

            // 特殊アクションでない場合のみ通常リアクション表示
            if (!isDoubleTap && !isRapidClick) {
                // 快楽度に応じてリアクション配列を選択
                let reactionArray;
                let reactionType;

                if (this.clickCount <= 50) {
                    // 快楽度50%以下
                    reactionArray = this.reactions;
                    reactionType = '通常';
                } else {
                    // 快楽度51%以上
                    reactionArray = this.superReactions;
                    reactionType = '強';
                }

                // デバッグ: リアクション配列の確認
                if (reactionArray.length === 0) {
                    console.error('❌ リアクション配列が空です！');
                    return;
                }

                const randomIndex = Math.floor(Math.random() * reactionArray.length);
                const reaction = reactionArray[randomIndex];
                console.log(`🎭 ${reactionType}リアクション表示 [${randomIndex}/${reactionArray.length}] (快楽度${this.clickCount}%):`, reaction);
                this.showReaction(reaction);
            }
        }

        // 快楽度10%毎に画像切り替え
        const currentMilestone = Math.floor(this.clickCount / 10) * 10;
        if (currentMilestone > this.lastPleasureMilestone && currentMilestone > 0) {
            this.lastPleasureMilestone = currentMilestone;
            this.updateImage();
            console.log(`🖼️ 快楽度${currentMilestone}%到達、画像切り替え`);
        }

        // マイルストーンチェック
        this.checkMilestones();

        // 100%達成
        if (this.clickCount >= 100 && !this.hasMilestone) {
            this.showMilestone();
            this.hasMilestone = true;
        }
    }

    /**
     * 快楽度ゲージ更新
     */
    updateProgress() {
        const gaugeBar = document.getElementById('pleasure-gauge-bar');
        const percentage = document.getElementById('pleasure-percentage');

        if (gaugeBar && percentage) {
            const percent = Math.min(this.clickCount, 100);
            gaugeBar.style.height = `${percent}%`;
            percentage.textContent = `${percent}%`;
        }
    }

    /**
     * 画像を更新
     */
    updateImage() {
        if (this.images.length === 0) return;

        // 未表示画像から選択
        let availableImages = this.images.filter(img => !this.unlockedImages.has(img));

        // 全て表示済みの場合はリセット
        if (availableImages.length === 0) {
            console.log('🎮 全CG表示完了、リセットします');
            this.unlockedImages.clear();
            availableImages = [...this.images];
        }

        // ランダム選択
        const randomIndex = Math.floor(Math.random() * availableImages.length);
        const selectedImage = availableImages[randomIndex];
        this.unlockedImages.add(selectedImage);

        // 画像を表示
        const cgImage = document.getElementById('clicker-cg-image');
        if (cgImage) {
            cgImage.src = selectedImage;
        }

        console.log(`🎮 画像切り替え: ${selectedImage}`);
    }

    /**
     * リアクション表示
     */
    showReaction(text) {
        const bubble = document.getElementById('reaction-bubble');
        const cgImage = document.getElementById('clicker-cg-image');
        if (!bubble || !cgImage) return;

        // hideReaction()のタイマーをキャンセル
        if (this.hideReactionTimer) {
            clearTimeout(this.hideReactionTimer);
            this.hideReactionTimer = null;
        }

        // スタイルをリセット（sweet spot用とshowMilestone用のスタイルを全てリセット）
        bubble.style.fontSize = '';
        bubble.style.fontWeight = '';
        bubble.style.whiteSpace = '';
        bubble.style.color = '';
        bubble.style.textShadow = '';
        bubble.style.border = '';
        bubble.style.boxShadow = '';
        bubble.style.animation = '';

        // テキストを先に設定
        bubble.textContent = text;
        bubble.classList.remove('hidden');

        // 快楽度に応じた色変化
        const pleasureLevel = this.clickCount;

        if (pleasureLevel < 50) {
            bubble.style.background = 'linear-gradient(135deg, #ff6ec7 0%, #ff85d4 50%, #ffa8e1 100%)';
        } else if (pleasureLevel < 80) {
            bubble.style.background = 'linear-gradient(135deg, #ff1493 0%, #ff69b4 50%, #ffb6c1 100%)';
        } else {
            bubble.style.background = 'linear-gradient(135deg, #ff0080 0%, #ff1493 50%, #ff69b4 100%)';
            bubble.classList.add('shake');
        }

        // CG画像の位置とサイズを取得
        const cgRect = cgImage.getBoundingClientRect();

        // 吹き出しの実際のサイズを取得（一時的に表示して測定）
        bubble.style.opacity = '0';
        bubble.classList.add('show');
        const bubbleRect = bubble.getBoundingClientRect();
        bubble.style.opacity = '';

        // 吹き出しのサイズを考慮（transform: translate(-50%, -50%)があるため、半分のサイズを使用）
        const bubbleHalfWidth = bubbleRect.width / 2;
        const bubbleHalfHeight = bubbleRect.height / 2;

        // CG画像の範囲内でランダムな位置を計算（吹き出しがはみ出ないように調整）
        const minX = cgRect.left + bubbleHalfWidth + 20; // マージン20px
        const maxX = cgRect.right - bubbleHalfWidth - 20;
        const minY = cgRect.top + bubbleHalfHeight + 20;
        const maxY = cgRect.bottom - bubbleHalfHeight - 20;

        // 範囲が有効か確認
        let randomX, randomY;
        if (maxX > minX && maxY > minY) {
            // ランダムな座標を計算
            randomX = minX + Math.random() * (maxX - minX);
            randomY = minY + Math.random() * (maxY - minY);
        } else {
            // CG画像が小さすぎる場合は中央に表示
            randomX = (cgRect.left + cgRect.right) / 2;
            randomY = (cgRect.top + cgRect.bottom) / 2;
        }

        // 位置を設定（transform: translate(-50%, -50%)を考慮）
        bubble.style.left = `${randomX}px`;
        bubble.style.top = `${randomY}px`;
    }

    /**
     * リアクションを非表示にする
     */
    hideReaction() {
        const bubble = document.getElementById('reaction-bubble');
        if (!bubble) return;

        // 既存のタイマーをキャンセル
        if (this.hideReactionTimer) {
            clearTimeout(this.hideReactionTimer);
        }

        bubble.classList.remove('show');
        bubble.classList.remove('shake');

        // フェードアウト完了後にスタイルをリセット
        this.hideReactionTimer = setTimeout(() => {
            bubble.classList.add('hidden');

            // sweet spotのカスタムスタイルをリセット（フェードアウト完了後）
            bubble.style.fontSize = '';
            bubble.style.fontWeight = '';
            bubble.style.whiteSpace = '';
            bubble.style.color = '';
            bubble.style.textShadow = '';
            bubble.style.border = '';
            bubble.style.boxShadow = '';
            bubble.style.animation = '';
            bubble.style.left = '';
            bubble.style.top = '';
            bubble.style.transform = '';

            this.hideReactionTimer = null;
        }, 300);
    }

    /**
     * sweet spot演出
     */
    showSweetSpot(event) {
        const bubble = document.getElementById('reaction-bubble');
        if (!bubble) return;

        // hideReaction()のタイマーをキャンセル
        if (this.hideReactionTimer) {
            clearTimeout(this.hideReactionTimer);
            this.hideReactionTimer = null;
        }

        // トランジションを一時的に無効化（位置のずれを防ぐ）
        bubble.style.transition = 'none';

        // 既存の位置スタイルを完全にリセット（showReaction()で設定されたピクセル値を削除）
        bubble.style.left = '';
        bubble.style.top = '';
        bubble.style.transform = '';

        // 強制リフロー（リセットを確定させる）
        bubble.offsetHeight;

        // クリック位置を取得（イベントがある場合）
        let clickX, clickY;
        if (event && event.clientX !== undefined && event.clientY !== undefined) {
            clickX = event.clientX;
            clickY = event.clientY;
        } else {
            // イベントがない場合はデフォルト位置（画面上部中央）
            clickX = window.innerWidth / 2;
            clickY = window.innerHeight * 0.08;
        }

        // 新しい位置スタイルを設定（クリック位置）
        bubble.style.left = `${clickX}px`;
        bubble.style.top = `${clickY}px`;
        bubble.style.transform = 'translate(-50%, -50%)';

        // sweet spotテキスト表示（ランダムにセリフを選択）
        let sweetSpotText = '✨ SWEET SPOT! ✨';
        if (this.sweetSpotReactions.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.sweetSpotReactions.length);
            sweetSpotText = this.sweetSpotReactions[randomIndex];
            console.log(`✨ Sweet Spotセリフ [${randomIndex}/${this.sweetSpotReactions.length}]:`, sweetSpotText);
        }

        bubble.textContent = sweetSpotText;
        bubble.style.fontSize = '28px';
        bubble.style.fontWeight = 'bold';
        bubble.style.whiteSpace = 'normal';
        bubble.style.maxWidth = '80vw';
        bubble.style.wordWrap = 'break-word';
        bubble.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%)';
        bubble.style.color = '#ff1493';
        bubble.style.textShadow = '0 0 20px rgba(255, 215, 0, 1), 0 0 40px rgba(255, 215, 0, 0.8), 3px 3px 6px rgba(0, 0, 0, 0.8)';
        bubble.style.border = '4px solid #ff1493';
        bubble.style.boxShadow = '0 0 40px rgba(255, 215, 0, 1), 0 0 80px rgba(255, 20, 147, 0.8)';
        bubble.classList.remove('hidden');

        // ブラウザに位置をレンダリングさせてからクラスを追加
        bubble.offsetHeight; // 強制リフロー

        // トランジションを再有効化
        bubble.style.transition = 'opacity 0.3s ease';

        // shakeクラスは位置を固定してしまうため、sweet spotでは使用しない
        bubble.classList.add('show');

        // pulseアニメーションもtransformを使うため、位置を維持するために削除
        // 代わりに光るエフェクトのみで演出
        bubble.style.animation = '';

        // 1.5秒後に非表示
        this.hideReactionTimer = setTimeout(() => {
            this.hideReaction();
        }, 1500);

        // ハートエフェクトを生成（クリック位置から複数のハートが出現）
        this.createSweetSpotHearts(clickX, clickY);

        console.log('✨ sweet spot演出表示');
    }

    /**
     * Sweet Spot用のハートエフェクトを生成
     */
    createSweetSpotHearts(centerX, centerY) {
        // 8～12個のハートをランダムに生成
        const heartCount = Math.floor(Math.random() * 5) + 8; // 8～12個

        for (let i = 0; i < heartCount; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.className = 'sweet-spot-heart';

                // ハートの種類をランダムに選択
                const heartTypes = ['💕', '💖', '💗', '💓', '💝'];
                heart.textContent = heartTypes[Math.floor(Math.random() * heartTypes.length)];

                // クリック位置を中心にランダムにばらつかせる（半径100px以内）
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 100;
                const offsetX = Math.cos(angle) * distance;
                const offsetY = Math.sin(angle) * distance;

                heart.style.left = `${centerX + offsetX}px`;
                heart.style.top = `${centerY + offsetY}px`;

                // ランダムなアニメーション遅延を追加（より自然な動き）
                const randomDelay = Math.random() * 0.3;
                heart.style.animationDelay = `${randomDelay}s`;

                document.body.appendChild(heart);

                // アニメーション完了後に削除（1.5秒 + 遅延）
                setTimeout(() => {
                    heart.remove();
                }, 1500 + (randomDelay * 1000));
            }, i * 50); // 少しずつ時間差で生成
        }
    }

    /**
     * 画面振動
     */
    shakeScreen(intensity, duration) {
        const cgImage = document.getElementById('clicker-cg-image');
        if (!cgImage) return;

        let startTime = Date.now();

        const shake = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed >= duration) {
                cgImage.style.transform = 'translate(-50%, -50%)';
                return;
            }

            const x = (Math.random() - 0.5) * intensity;
            const y = (Math.random() - 0.5) * intensity;
            cgImage.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;

            requestAnimationFrame(shake);
        };

        shake();
    }

    /**
     * マイルストーンチェック
     */
    checkMilestones() {
        // 80%でハート粒子
        if (this.clickCount >= 80 && this.clickCount < 90) {
            this.showHeartParticles();
        }
    }

    /**
     * ハート粒子表示
     */
    showHeartParticles() {
        const cgArea = document.getElementById('clicker-cg-area');
        if (!cgArea) return;

        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const heart = document.createElement('div');
                heart.textContent = '💕';
                heart.className = 'heart-particle';
                heart.style.left = `${20 + Math.random() * 60}%`;
                heart.style.bottom = '0';
                cgArea.appendChild(heart);

                setTimeout(() => {
                    heart.remove();
                }, 2000);
            }, i * 200);
        }
    }

    /**
     * 100%達成時の演出
     */
    showMilestone() {
        console.log('🎉 100%達成！');

        // クリッカーゲームを無効化（これ以上クリックできないように）
        this.isActive = false;

        // 快楽度自動減少タイマーを停止（100%到達後は減少しない）
        this.stopPleasureDecayTimer();

        // 絶頂演出を実行
        this.showClimax(() => {
            // 練習モードまたは全て解放済みかどうかをチェック
            const unlockedBonuses = this.getUnlockedBonusCGs();
            const allUnlocked = unlockedBonuses.length >= 100;

            console.log('🎯 showMilestone - isPracticeMode:', this.isPracticeMode, 'allUnlocked:', allUnlocked);

            const unlockBtn = document.getElementById('unlock-bonus-cg-btn');
            const bubble = document.getElementById('reaction-bubble');
            const exitBtn = document.getElementById('clicker-exit-btn');

            // 終了ボタンを非表示
            if (exitBtn) {
                exitBtn.classList.add('hidden');
            }

            if (unlockBtn) {
                if (this.isPracticeMode || allUnlocked) {
                    // 練習モードまたは全て解放済みの場合は「トップに戻る」ボタンを表示
                    unlockBtn.textContent = '🏠 トップに戻る';
                    unlockBtn.classList.add('back-to-title-btn');

                    // メッセージを画面中央に表示（練習モード時は非表示）
                    if (bubble && !this.isPracticeMode) {
                        bubble.textContent = '🎉 おまけCG解放率100%達成！\nコンプリートおめでとうございます！💕';
                        bubble.style.fontSize = '24px';
                        bubble.style.whiteSpace = 'pre-line';
                        bubble.style.left = '50%';
                        bubble.style.top = '50%';
                        bubble.style.maxWidth = '90vw';
                        bubble.style.width = 'auto';
                        bubble.style.padding = '20px 30px';
                        bubble.style.textAlign = 'center';
                        bubble.style.lineHeight = '1.6';
                        bubble.classList.remove('hidden');
                        bubble.classList.add('show');
                        bubble.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%)';
                    } else if (bubble && this.isPracticeMode) {
                        // 練習モード時はメッセージを非表示
                        bubble.classList.add('hidden');
                    }

                    // イベントリスナーを削除して新しいものを追加
                    unlockBtn.replaceWith(unlockBtn.cloneNode(true));
                    const newBtn = document.getElementById('unlock-bonus-cg-btn');
                    newBtn.addEventListener('click', () => {
                        if (window.game) {
                            window.game.showScreen('title-screen');
                        }
                    });
                    newBtn.classList.remove('hidden');
                    console.log('🏠 トップに戻るボタンを表示' + (this.isPracticeMode ? '（練習モード）' : '（全て解放済み）'));
                } else {
                    // 未解放がある場合は「おまけCGを見る」ボタンを表示
                    unlockBtn.textContent = '🎉 おまけCGを見る';
                    unlockBtn.classList.remove('hidden');
                    console.log('🎁 おまけCG解放ボタンを表示');
                }
            }
        });
    }

    /**
     * 絶頂演出
     */
    showClimax(callback) {
        console.log('💥 絶頂演出開始！');

        // BGMと全ての音声、ボーナス効果音を停止
        if (window.soundManager) {
            window.soundManager.pauseBGM();
            window.soundManager.stopVoice();  // 再生中の音声を停止
            window.soundManager.stopBonusEffect();  // ボーナス効果音を停止
            console.log('🔇 絶頂演出のためBGM、音声、効果音を停止');
        }

        // 絶頂テキスト表示（ランダムにセリフを選択）
        const bubble = document.getElementById('reaction-bubble');
        if (bubble) {
            let finishText = 'イっちゃう…！💕💕💕';
            if (this.finishReactions.length > 0) {
                // 最初の方のセリフ（イク直前のセリフ）を優先的に選択
                const firstHalfCount = Math.min(10, this.finishReactions.length);
                const randomIndex = Math.floor(Math.random() * firstHalfCount);
                finishText = this.finishReactions[randomIndex];
                console.log(`🎉 絶頂セリフ [${randomIndex}/${this.finishReactions.length}]:`, finishText);
            }

            bubble.textContent = finishText;
            bubble.classList.remove('hidden');
            bubble.classList.add('show', 'shake');
            bubble.style.background = 'linear-gradient(135deg, #ff1493 0%, #ff69b4 50%, #ffb6c1 100%)';
            bubble.style.fontSize = '32px';
            bubble.style.whiteSpace = 'pre-line';
        }

        // 強い画面振動
        this.shakeScreen(25, 800);

        // 画面フラッシュエフェクト
        this.createFlashEffect();

        // ハート粒子超大量発生
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                this.showHeartParticles();
            }, i * 50);
        }

        // 絶頂演出用音声を最大音量で再生（最後まで再生）
        if (window.soundManager) {
            window.soundManager.playFinishVoice();
        }

        // 1秒後に絶頂後のセリフを表示
        setTimeout(() => {
            if (bubble && this.finishReactions.length > 0) {
                // 後半のセリフ（イった後のセリフ）を選択
                const secondHalfStart = Math.min(10, this.finishReactions.length);
                const secondHalfCount = this.finishReactions.length - secondHalfStart;
                if (secondHalfCount > 0) {
                    const randomIndex = secondHalfStart + Math.floor(Math.random() * secondHalfCount);
                    const afterText = this.finishReactions[randomIndex];
                    bubble.textContent = afterText;
                    console.log(`💕 絶頂後セリフ [${randomIndex}/${this.finishReactions.length}]:`, afterText);
                } else {
                    bubble.textContent = 'イっちゃった…💕';
                }
                bubble.style.fontSize = '28px';
            }
        }, 1000);

        // 2.5秒後にボタンを表示（音声は最後まで再生し続ける）
        if (callback) {
            setTimeout(callback, 2500);
        }
    }

    /**
     * 画面フラッシュエフェクト
     */
    createFlashEffect() {
        // 白い全画面オーバーレイを作成
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
        flash.style.zIndex = '9999';
        flash.style.pointerEvents = 'none';
        flash.style.animation = 'climax-flash 0.3s ease-out';
        document.body.appendChild(flash);

        // 2回目のフラッシュ
        setTimeout(() => {
            flash.style.animation = 'climax-flash 0.15s ease-out';
        }, 400);

        // 0.8秒後に削除
        setTimeout(() => {
            flash.remove();
        }, 800);
    }

    /**
     * おまけCG解放ボタンから解放画面を表示
     */
    showUnlockedCGsFromButton() {
        console.log('🎁 おまけCG解放ボタンがクリックされました');

        // ボイスとボーナス効果音を停止（絶頂演出の音声が再生中の場合）
        if (window.soundManager) {
            window.soundManager.stopVoice();
            window.soundManager.stopBonusEffect();
        }

        // おまけCGを3～5枚ランダムに解放
        const unlockedBonuses = this.unlockMultipleBonusCGs();

        if (unlockedBonuses && unlockedBonuses.length > 0) {
            // CG表示画面へ遷移
            this.showUnlockedCGs(unlockedBonuses);
        } else {
            // 全て解放済みの場合は完了メッセージとトップに戻るボタンを表示
            const bubble = document.getElementById('reaction-bubble');
            if (bubble) {
                bubble.textContent = '🎉 100%達成！\n（全てのおまけCGは解放済み）';
                bubble.style.fontSize = '24px';
                bubble.classList.remove('hidden');
                bubble.classList.add('show');
            }

            // おまけCG解放ボタンを「トップに戻る」ボタンに変更
            const unlockBtn = document.getElementById('unlock-bonus-cg-btn');
            if (unlockBtn) {
                unlockBtn.textContent = '🏠 トップに戻る';
                unlockBtn.classList.add('back-to-title-btn');

                // イベントリスナーを削除して新しいものを追加
                unlockBtn.replaceWith(unlockBtn.cloneNode(true));
                const newBtn = document.getElementById('unlock-bonus-cg-btn');
                newBtn.addEventListener('click', () => {
                    if (window.game) {
                        window.game.showScreen('title-screen');
                    }
                });
            }
        }
    }

    /**
     * 複数の解放されたCGを表示
     */
    showUnlockedCGs(bonusIds) {
        // クリッカーゲームを停止
        this.isActive = false;
        this.stopPleasureDecayTimer();

        // ボイスとボーナス効果音を停止
        if (window.soundManager) {
            window.soundManager.stopVoice();
            window.soundManager.stopBonusEffect();
        }

        // 各CGのデータを作成
        const cgDataArray = bonusIds.map(bonusId => {
            const bonusNum = bonusId.replace('bonus', '');
            const displayNum = parseInt(bonusNum);
            const imagePath = `assets/img/bonus/${bonusId}.jpg`;
            const cgName = `おまけCG No.${displayNum}`;

            return { imagePath, cgName };
        });

        // game.jsのメソッドを呼び出して画面遷移
        if (window.game) {
            window.game.showUnlockedCGScreen(cgDataArray);
        }
    }

    /**
     * 解放されたCGを表示（1枚のみ・後方互換性のため）
     */
    showUnlockedCG(bonusId, totalUnlocked = 1) {
        // クリッカーゲームを停止
        this.isActive = false;
        this.stopPleasureDecayTimer();

        // ボイスとボーナス効果音を停止
        if (window.soundManager) {
            window.soundManager.stopVoice();
            window.soundManager.stopBonusEffect();
        }

        // 解放されたCGの番号を取得
        const bonusNum = bonusId.replace('bonus', '');
        const displayNum = parseInt(bonusNum);

        // 画像のパスを設定
        const imagePath = `assets/img/bonus/${bonusId}.jpg`;

        // タイトルに解放枚数を追加
        const title = totalUnlocked > 1
            ? `おまけCG No.${displayNum} (${totalUnlocked}枚解放！)`
            : `おまけCG No.${displayNum}`;

        // game.jsのメソッドを呼び出して画面遷移
        if (window.game) {
            window.game.showUnlockedCGScreen(imagePath, title);
        }
    }

    /**
     * 複数のランダムなボーナスCGを解放（3～5枚）
     */
    unlockMultipleBonusCGs() {
        // デバッグログ: 練習モードフラグの確認
        console.log('🔍 unlockMultipleBonusCGs() 呼び出し - isPracticeMode:', this.isPracticeMode);

        // 練習モードの場合はCGを解放しない
        if (this.isPracticeMode) {
            console.log('🔒 練習モードのため、おまけCGは解放されません');
            return null;
        }

        // 解放済みボーナスCGのリストを取得
        const unlockedBonuses = this.getUnlockedBonusCGs();
        console.log('🔍 現在の解放済みCG数:', unlockedBonuses.length);
        console.log('🔍 解放済みCGリスト:', unlockedBonuses);

        // 全ボーナスCGのリスト（bonus001 ~ bonus100）
        const allBonuses = [];
        for (let i = 1; i <= 100; i++) {
            const bonusNum = String(i).padStart(3, '0');
            allBonuses.push(`bonus${bonusNum}`);
        }

        // 未解放のボーナスCGを抽出
        const lockedBonuses = allBonuses.filter(bonus => !unlockedBonuses.includes(bonus));
        console.log('🔍 未解放CG数:', lockedBonuses.length);

        if (lockedBonuses.length === 0) {
            console.log('✨ 全てのおまけCGは解放済み');
            return null;
        }

        // 3～5枚のランダムな枚数を決定
        const unlockCount = Math.floor(Math.random() * 3) + 3; // 3, 4, 5のいずれか

        // 実際に解放できる枚数（未解放数が少ない場合を考慮）
        const actualCount = Math.min(unlockCount, lockedBonuses.length);

        // ランダムに複数選択
        const selectedBonuses = [];
        const tempLockedBonuses = [...lockedBonuses]; // コピーを作成

        for (let i = 0; i < actualCount; i++) {
            const randomIndex = Math.floor(Math.random() * tempLockedBonuses.length);
            const selectedBonus = tempLockedBonuses[randomIndex];
            selectedBonuses.push(selectedBonus);

            // 選択したCGをリストから削除（重複を避ける）
            tempLockedBonuses.splice(randomIndex, 1);

            // 解放情報に追加
            unlockedBonuses.push(selectedBonus);
        }

        // 解放情報を保存
        window.saveManager.setItem('unlockedBonusCGs', JSON.stringify(unlockedBonuses));

        console.log(`✨ おまけCG解放: ${selectedBonuses.length}枚 - ${selectedBonuses.join(', ')}`);
        return selectedBonuses;
    }

    /**
     * ランダムなボーナスCGを解放（1枚のみ）
     */
    unlockRandomBonusCG() {
        // 練習モードの場合はCGを解放しない
        if (this.isPracticeMode) {
            console.log('🔒 練習モードのため、おまけCGは解放されません');
            return null;
        }

        // 解放済みボーナスCGのリストを取得
        const unlockedBonuses = this.getUnlockedBonusCGs();

        // 全ボーナスCGのリスト（bonus001 ~ bonus100）
        const allBonuses = [];
        for (let i = 1; i <= 100; i++) {
            const bonusNum = String(i).padStart(3, '0');
            allBonuses.push(`bonus${bonusNum}`);
        }

        // 未解放のボーナスCGを抽出
        const lockedBonuses = allBonuses.filter(bonus => !unlockedBonuses.includes(bonus));

        if (lockedBonuses.length === 0) {
            console.log('✨ 全てのおまけCGは解放済み');
            return null;
        }

        // ランダムに1つ選択
        const randomIndex = Math.floor(Math.random() * lockedBonuses.length);
        const selectedBonus = lockedBonuses[randomIndex];

        // 解放情報を保存
        unlockedBonuses.push(selectedBonus);
        window.saveManager.setItem('unlockedBonusCGs', JSON.stringify(unlockedBonuses));

        console.log(`✨ おまけCG解放: ${selectedBonus}`);
        return selectedBonus;
    }

    /**
     * 解放済みボーナスCGのリストを取得
     */
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

    /**
     * ダブルタップ検出
     */
    detectDoubleTap() {
        const now = Date.now();

        if (this.lastDoubleTapTime && now - this.lastDoubleTapTime < 300) {
            const reaction = this.doubleTapReactions[Math.floor(Math.random() * this.doubleTapReactions.length)];
            this.showReaction(reaction);
            this.shakeScreen(20, 600);
            console.log('💥 ダブルタップ発動！');
            this.lastDoubleTapTime = 0;
            return true;  // ダブルタップ発動
        } else {
            this.lastDoubleTapTime = now;
            return false;
        }
    }

    /**
     * 連打検出
     */
    detectRapidClick() {
        const now = Date.now();

        if (!this.clickHistory) {
            this.clickHistory = [];
        }

        this.clickHistory.push(now);
        this.clickHistory = this.clickHistory.filter(time => now - time < 1000);

        if (this.clickHistory.length >= 5) {
            const reaction = this.rapidReactions[Math.floor(Math.random() * this.rapidReactions.length)];
            this.showReaction(reaction);
            this.shakeScreen(15, 500);
            this.clickHistory = [];
            console.log('⚡ 連打ボーナス発動！');
            return true;  // 連打ボーナス発動
        }
        return false;
    }

    /**
     * 快楽度自動減少タイマー開始
     */
    startPleasureDecayTimer() {
        if (this.pleasureDecayTimer) {
            clearInterval(this.pleasureDecayTimer);
        }

        // lastClickTimeとlastDecayTimeはstart()で初期化済み

        this.pleasureDecayTimer = setInterval(() => {
            const now = Date.now();

            // クリックしていない場合は減少しない
            if (this.lastClickTime === null) {
                return;
            }

            const timeSinceLastClick = now - this.lastClickTime;

            // 最後のクリックから5秒経過していない場合は減少しない
            if (timeSinceLastClick <= 5000) {
                return;
            }

            // 最後の減少から1秒経過している場合のみ減少（初回はlastDecayTimeがnull）
            const timeSinceLastDecay = this.lastDecayTime === null ? Infinity : now - this.lastDecayTime;

            if (timeSinceLastDecay >= 1000 && this.clickCount > 0) {
                this.clickCount = Math.max(0, this.clickCount - 1);
                this.lastDecayTime = now;  // 減少時刻を更新
                this.updateProgress();

                // 快楽度減少時のリアクションは表示しない（既存のリアクションを維持するため）
                // if (this.clickCount % 10 === 0 && this.clickCount > 0) {
                //     const decayReactions = [
                //         'はぁ…はぁ…落ち着いてきた…',
                //         '少し…冷めてきちゃった…',
                //         'もっと…触って欲しい…',
                //         '放っておかないで…',
                //         '続けて…お願い…'
                //     ];
                //     const reaction = decayReactions[Math.floor(Math.random() * decayReactions.length)];
                //     this.showReaction(reaction);
                // }

                console.log(`⏰ 快楽度減少: ${this.clickCount}%`);
            }
        }, 500);

        console.log('⏰ 快楽度自動減少タイマー開始');
    }

    /**
     * 快楽度自動減少タイマー停止
     */
    stopPleasureDecayTimer() {
        if (this.pleasureDecayTimer) {
            clearInterval(this.pleasureDecayTimer);
            this.pleasureDecayTimer = null;
            console.log('⏰ 快楽度自動減少タイマー停止');
        }
    }

    /**
     * ヘルプ表示
     */
    showHelp() {
        alert(`🎮 ボーナスステージ - 遊び方

⚡ 基本操作
・画面をクリックして快楽度を上昇させる
・通常クリック: 快楽度+3%
・快楽度は0%から100%まで上昇
・5秒間放置すると1秒毎に1%ずつ減少

✨ Sweet Spot（スイートスポット）
・女の子の感じる場所(ランダム)を触ると発動！
・快楽度+10%（通常の3倍以上！）
・ハートのエフェクトが出現
・特別なセリフが表示される

🎁 おまけCG
・快楽度100%達成するとおまけCGを3～5枚解放
・全100枚のおまけCGをコンプリートしよう！
・タイトル画面のおさわりモードからクリア時は解放されません`);
    }

    /**
     * UI初期化
     */
    resetUI() {
        // ゲージリセット
        this.updateProgress();

        // リアクション吹き出しを非表示
        const bubble = document.getElementById('reaction-bubble');
        if (bubble) {
            bubble.classList.add('hidden');
            bubble.classList.remove('show', 'shake');
        }

        // おまけCG解放ボタンを非表示＆初期状態に戻す
        const unlockBtn = document.getElementById('unlock-bonus-cg-btn');
        if (unlockBtn) {
            unlockBtn.classList.add('hidden');
            unlockBtn.classList.remove('back-to-title-btn');

            // ボタンのテキストを初期状態に戻す
            unlockBtn.textContent = '🎉 おまけCGを見る';

            // イベントハンドラーをリセット（2回目以降の呼び出し時のみ）
            // 初回はbindEvents()で設定されるため、ここではスキップ
            if (this.eventsbound) {
                unlockBtn.replaceWith(unlockBtn.cloneNode(true));
                const newBtn = document.getElementById('unlock-bonus-cg-btn');
                newBtn.addEventListener('click', () => this.showUnlockedCGsFromButton());
            }
        }

        // 終了ボタンを再表示
        const exitBtn = document.getElementById('clicker-exit-btn');
        if (exitBtn) {
            exitBtn.classList.remove('hidden');
        }
    }

    /**
     * クリッカーゲーム終了
     */
    exit() {
        console.log('🎮 クリッカーゲーム終了');

        this.isActive = false;
        this.stopPleasureDecayTimer();

        // ボイスとボーナス効果音を停止
        if (window.soundManager) {
            window.soundManager.stopVoice();
            window.soundManager.stopBonusEffect();
        }

        // UIリセット
        this.resetUI();

        // ゲーム画面に戻るか、問題選択画面に戻る
        if (window.game) {
            window.game.showProblemSelectScreen();
        }
    }
}

// グローバルに公開
window.ClickerGame = ClickerGame;
