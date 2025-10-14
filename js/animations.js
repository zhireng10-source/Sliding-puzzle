/**
 * アニメーション制御クラス
 * タイルのスライドアニメーションと画面遷移を管理
 */
class AnimationController {
    constructor() {
        this.animationDuration = 200; // タイルアニメーションの時間（ms）
        this.isAnimating = false;
    }

    /**
     * タイルのスライドアニメーション
     * @param {HTMLElement} tile1 - 移動するタイル1
     * @param {HTMLElement} tile2 - 移動するタイル2（空タイル）
     * @param {Function} callback - アニメーション完了時のコールバック
     */
    animateTileSwap(tile1, tile2, callback) {
        if (this.isAnimating) return;

        this.isAnimating = true;

        // 両タイルの位置を取得
        const tile1Rect = tile1.getBoundingClientRect();
        const tile2Rect = tile2.getBoundingClientRect();

        // 移動距離を計算
        const deltaX = tile2Rect.left - tile1Rect.left;
        const deltaY = tile2Rect.top - tile1Rect.top;

        // タイルにmovingクラスを追加
        tile1.classList.add('moving');

        // CSSトランジションを使用して移動
        tile1.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

        // アニメーション完了後の処理
        setTimeout(() => {
            // トランスフォームをリセット
            tile1.style.transform = '';
            tile1.classList.remove('moving');

            this.isAnimating = false;

            // コールバックを実行
            if (callback) {
                callback();
            }
        }, this.animationDuration);
    }

    /**
     * タイル移動後のグローエフェクト
     * @param {HTMLElement} tile - エフェクトを適用するタイル
     */
    addTileGlow(tile) {
        tile.classList.add('just-moved');

        setTimeout(() => {
            tile.classList.remove('just-moved');
        }, 300);
    }

    /**
     * 画面遷移アニメーション
     * @param {HTMLElement} currentScreen - 現在の画面
     * @param {HTMLElement} nextScreen - 次の画面
     * @param {Function} callback - アニメーション完了時のコールバック
     */
    transitionScreen(currentScreen, nextScreen, callback) {
        // 現在の画面をフェードアウト
        currentScreen.classList.add('exit');

        setTimeout(() => {
            currentScreen.classList.add('hidden');
            currentScreen.classList.remove('exit');

            // 次の画面を表示
            nextScreen.classList.remove('hidden');

            // 効果音を再生
            if (window.soundManager) {
                window.soundManager.playScreenTransition();
            }

            if (callback) {
                callback();
            }
        }, 300);
    }

    /**
     * ボタンのパルスアニメーション
     * @param {HTMLElement} button - パルスさせるボタン
     */
    pulseButton(button) {
        button.classList.add('pulse');

        setTimeout(() => {
            button.classList.remove('pulse');
        }, 500);
    }

    /**
     * 要素のフェードイン
     * @param {HTMLElement} element - フェードインさせる要素
     * @param {number} duration - アニメーション時間（ms）
     */
    fadeIn(element, duration = 400) {
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease`;

        // 次のフレームで透明度を変更
        requestAnimationFrame(() => {
            element.style.opacity = '1';
        });

        setTimeout(() => {
            element.style.transition = '';
        }, duration);
    }

    /**
     * 要素のフェードアウト
     * @param {HTMLElement} element - フェードアウトさせる要素
     * @param {number} duration - アニメーション時間（ms）
     * @param {Function} callback - アニメーション完了時のコールバック
     */
    fadeOut(element, duration = 400, callback) {
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = '0';

        setTimeout(() => {
            element.style.transition = '';
            if (callback) callback();
        }, duration);
    }

    /**
     * 要素のスケールアニメーション
     * @param {HTMLElement} element - スケールさせる要素
     * @param {number} fromScale - 開始スケール
     * @param {number} toScale - 終了スケール
     * @param {number} duration - アニメーション時間（ms）
     */
    scaleAnimation(element, fromScale, toScale, duration = 400) {
        element.style.transform = `scale(${fromScale})`;
        element.style.transition = `transform ${duration}ms cubic-bezier(0.68, -0.55, 0.265, 1.55)`;

        requestAnimationFrame(() => {
            element.style.transform = `scale(${toScale})`;
        });

        setTimeout(() => {
            element.style.transition = '';
        }, duration);
    }

    /**
     * シェイクアニメーション（エラー時などに使用）
     * @param {HTMLElement} element - シェイクさせる要素
     */
    shake(element) {
        const keyframes = [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(0)' }
        ];

        const options = {
            duration: 400,
            easing: 'ease-in-out'
        };

        element.animate(keyframes, options);
    }

    /**
     * バウンスアニメーション
     * @param {HTMLElement} element - バウンスさせる要素
     */
    bounce(element) {
        const keyframes = [
            { transform: 'translateY(0)' },
            { transform: 'translateY(-20px)' },
            { transform: 'translateY(0)' },
            { transform: 'translateY(-10px)' },
            { transform: 'translateY(0)' }
        ];

        const options = {
            duration: 600,
            easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        };

        element.animate(keyframes, options);
    }

    /**
     * 回転アニメーション
     * @param {HTMLElement} element - 回転させる要素
     * @param {number} degrees - 回転角度
     * @param {number} duration - アニメーション時間（ms）
     */
    rotate(element, degrees, duration = 400) {
        element.style.transition = `transform ${duration}ms ease`;
        element.style.transform = `rotate(${degrees}deg)`;

        setTimeout(() => {
            element.style.transition = '';
        }, duration);
    }

    /**
     * スライドインアニメーション
     * @param {HTMLElement} element - スライドインさせる要素
     * @param {string} direction - 'left', 'right', 'top', 'bottom'
     * @param {number} duration - アニメーション時間（ms）
     */
    slideIn(element, direction = 'bottom', duration = 400) {
        const offsets = {
            left: 'translateX(-100%)',
            right: 'translateX(100%)',
            top: 'translateY(-100%)',
            bottom: 'translateY(100%)'
        };

        element.style.transform = offsets[direction] || offsets.bottom;
        element.style.opacity = '0';
        element.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${duration}ms ease`;

        requestAnimationFrame(() => {
            element.style.transform = 'translate(0, 0)';
            element.style.opacity = '1';
        });

        setTimeout(() => {
            element.style.transition = '';
            element.style.transform = '';
        }, duration);
    }

    /**
     * カウントアップアニメーション（数字用）
     * @param {HTMLElement} element - 数字を表示する要素
     * @param {number} targetValue - 目標値
     * @param {number} duration - アニメーション時間（ms）
     */
    countUp(element, targetValue, duration = 1000) {
        const startValue = 0;
        const startTime = Date.now();

        const updateCount = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // イージング関数（ease-out）
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOut);

            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(updateCount);
            } else {
                element.textContent = targetValue;
            }
        };

        updateCount();
    }

    /**
     * タイマーのパルスエフェクト
     * @param {HTMLElement} timerElement - タイマー要素
     */
    pulseTimer(timerElement) {
        timerElement.classList.add('pulse');

        setTimeout(() => {
            timerElement.classList.remove('pulse');
        }, 500);
    }

    /**
     * 要素にfade-in-upアニメーションを適用
     * @param {HTMLElement} element - アニメーションする要素
     */
    fadeInUp(element) {
        element.classList.add('fade-in-up');
        setTimeout(() => {
            element.classList.remove('fade-in-up');
        }, 500);
    }

    /**
     * 要素にfade-out-scaleアニメーションを適用
     * @param {HTMLElement} element - アニメーションする要素
     * @param {Function} callback - アニメーション完了後のコールバック
     */
    fadeOutScale(element, callback) {
        element.classList.add('fade-out-scale');
        setTimeout(() => {
            element.classList.remove('fade-out-scale');
            if (callback) callback();
        }, 400);
    }

    /**
     * shakeアニメーションを適用（エラー時）
     * @param {HTMLElement} element - シェイクする要素
     */
    shakeElement(element) {
        element.classList.add('shake');
        setTimeout(() => {
            element.classList.remove('shake');
        }, 500);
    }

    /**
     * bounceアニメーションを適用（成功時）
     * @param {HTMLElement} element - バウンスする要素
     */
    bounceElement(element) {
        element.classList.add('bounce');
        setTimeout(() => {
            element.classList.remove('bounce');
        }, 800);
    }

    /**
     * flash-successアニメーションを適用
     * @param {HTMLElement} element - フラッシュする要素
     */
    flashSuccess(element) {
        element.classList.add('flash-success');
        setTimeout(() => {
            element.classList.remove('flash-success');
        }, 600);
    }

    /**
     * flash-errorアニメーションを適用
     * @param {HTMLElement} element - フラッシュする要素
     */
    flashError(element) {
        element.classList.add('flash-error');
        setTimeout(() => {
            element.classList.remove('flash-error');
        }, 600);
    }

    /**
     * popupアニメーションを適用
     * @param {HTMLElement} element - ポップアップする要素
     */
    popup(element) {
        element.classList.add('popup');
        setTimeout(() => {
            element.classList.remove('popup');
        }, 400);
    }

    /**
     * rotate-inアニメーションを適用
     * @param {HTMLElement} element - 回転しながら出現する要素
     */
    rotateIn(element) {
        element.classList.add('rotate-in');
        setTimeout(() => {
            element.classList.remove('rotate-in');
        }, 600);
    }

    /**
     * 数値のカウントアップアニメーション（改良版）
     * @param {HTMLElement} element - 数字を表示する要素
     * @param {number} startValue - 開始値
     * @param {number} endValue - 終了値
     * @param {number} duration - アニメーション時間（ms）
     * @param {Function} formatFunc - 値をフォーマットする関数（オプション）
     */
    animateNumber(element, startValue, endValue, duration = 1000, formatFunc = null) {
        const startTime = Date.now();

        // count-upクラスを追加してアニメーション
        element.classList.add('count-up');

        const updateNumber = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // イージング関数（ease-out cubic）
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const currentValue = startValue + (endValue - startValue) * easeOutCubic;

            // フォーマット関数があれば適用
            if (formatFunc) {
                element.textContent = formatFunc(currentValue);
            } else {
                element.textContent = Math.round(currentValue);
            }

            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                // 最終値を設定
                element.textContent = formatFunc ? formatFunc(endValue) : endValue;

                // アニメーションクラスを削除
                setTimeout(() => {
                    element.classList.remove('count-up');
                }, 300);
            }
        };

        updateNumber();
    }

    /**
     * タイマーのカウントアップアニメーション
     * @param {HTMLElement} element - タイマー要素
     * @param {string} timeString - 時間文字列（MM:SS形式）
     */
    updateTimerWithAnimation(element, timeString) {
        // timer-tickクラスを追加
        element.classList.add('timer-tick');
        element.textContent = `タイム: ${timeString}`;

        setTimeout(() => {
            element.classList.remove('timer-tick');
        }, 200);
    }
}

// グローバルインスタンスを作成
window.animationController = new AnimationController();
