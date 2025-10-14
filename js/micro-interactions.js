/**
 * マイクロインタラクション管理クラス
 * 細部のUIアニメーションと状態変化を制御
 */
class MicroInteractionManager {
    constructor() {
        this.previousTimerValue = null;
        this.init();
    }

    init() {
        this.setupButtonRippleEffects();
        this.setupNumberAnimations();
        this.setupModalAnimations();
        this.setupInputAnimations();
    }

    /**
     * ボタンのリプルエフェクト（既にCSSで実装済みだが、追加強化）
     */
    setupButtonRippleEffects() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn, .size-btn, .problem-btn, .gallery-tab-btn');
            if (!btn) return;

            // クリック位置でリプルを作成
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            btn.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    }

    /**
     * 数値のカウントアップアニメーション
     */
    animateNumber(element, start, end, duration = 800, suffix = '') {
        if (!element) return;

        const startTime = performance.now();
        const range = end - start;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // イージング関数（easeOutCubic）
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(start + range * easeProgress);

            element.textContent = currentValue + suffix;

            // アニメーション中はクラスを追加
            element.classList.add('number-change');

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // アニメーション完了後にクラスを削除
                setTimeout(() => {
                    element.classList.remove('number-change');
                }, 300);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * タイマー表示の数値変化アニメーション
     */
    setupNumberAnimations() {
        // タイマーの監視（MutationObserver使用）
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' || mutation.type === 'characterData') {
                        // タイマーが更新されたときの軽いアニメーション
                        timerDisplay.style.animation = 'none';
                        setTimeout(() => {
                            timerDisplay.style.animation = 'timerUpdate 0.3s ease';
                        }, 10);
                    }
                });
            });

            observer.observe(timerDisplay, {
                characterData: true,
                childList: true,
                subtree: true
            });
        }
    }

    /**
     * クリアタイムのカウントアップ表示
     */
    displayClearTimeWithAnimation(timeInMs) {
        const clearTimeElement = document.getElementById('clear-time');
        if (!clearTimeElement) return;

        const totalSeconds = Math.floor(timeInMs / 1000);

        // 秒数を0から目標までカウントアップ
        this.animateNumber(
            clearTimeElement,
            0,
            totalSeconds,
            1000,
            '秒'
        );

        // または時間形式（MM:SS）でアニメーション
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        // より詳細な実装
        let currentSeconds = 0;
        const interval = setInterval(() => {
            currentSeconds++;
            const m = Math.floor(currentSeconds / 60);
            const s = currentSeconds % 60;
            clearTimeElement.textContent = `クリアタイム: ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

            if (currentSeconds >= totalSeconds) {
                clearInterval(interval);
            }
        }, 1000 / totalSeconds); // アニメーション速度を調整
    }

    /**
     * モーダルの表示/非表示アニメーション
     */
    setupModalAnimations() {
        const modal = document.getElementById('image-modal');
        if (!modal) return;

        // モーダルが表示される際のアニメーション
        const originalClassListAdd = modal.classList.add.bind(modal.classList);
        const originalClassListRemove = modal.classList.remove.bind(modal.classList);

        modal.classList.remove = function(className) {
            if (className === 'hidden') {
                modal.style.animation = 'modalFadeIn 0.3s ease-out';
                const content = modal.querySelector('.modal-content');
                if (content) {
                    content.style.animation = 'modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                }
            }
            originalClassListRemove(className);
        };

        modal.classList.add = function(className) {
            if (className === 'hidden') {
                modal.style.animation = 'modalFadeOut 0.2s ease-in';
                setTimeout(() => {
                    originalClassListAdd(className);
                }, 200);
                return;
            }
            originalClassListAdd(className);
        };
    }

    /**
     * 入力フィールドのフォーカス/エラーアニメーション
     * （現在は入力フィールドがないが、将来の拡張用）
     */
    setupInputAnimations() {
        document.querySelectorAll('input, textarea').forEach(input => {
            // フォーカス時のアニメーション
            input.addEventListener('focus', (e) => {
                e.target.parentElement?.classList.add('input-focused');
                this.createFocusRing(e.target);
            });

            input.addEventListener('blur', (e) => {
                e.target.parentElement?.classList.remove('input-focused');
            });

            // 入力時のバリデーションフィードバック
            input.addEventListener('input', (e) => {
                if (e.target.hasAttribute('required') && !e.target.value) {
                    e.target.classList.add('input-error');
                } else {
                    e.target.classList.remove('input-error');
                    e.target.classList.add('input-success');
                }
            });
        });
    }

    /**
     * フォーカスリングの生成
     */
    createFocusRing(element) {
        const ring = document.createElement('div');
        ring.className = 'focus-ring';
        ring.style.position = 'absolute';
        ring.style.top = '-4px';
        ring.style.left = '-4px';
        ring.style.right = '-4px';
        ring.style.bottom = '-4px';
        ring.style.border = '2px solid var(--color-primary-light)';
        ring.style.borderRadius = 'inherit';
        ring.style.pointerEvents = 'none';
        ring.style.animation = 'focusRingExpand 0.3s ease-out';

        element.parentElement?.style.position = 'relative';
        element.parentElement?.appendChild(ring);

        element.addEventListener('blur', () => {
            ring.remove();
        }, { once: true });
    }

    /**
     * 要素のシェイク（エラー表示）
     */
    shakeElement(element) {
        if (!element) return;

        element.style.animation = 'shake 0.5s ease-in-out';

        element.addEventListener('animationend', () => {
            element.style.animation = '';
        }, { once: true });
    }

    /**
     * 要素のバウンス（成功表示）
     */
    bounceElement(element) {
        if (!element) return;

        element.style.animation = 'bounce 0.6s ease-in-out';

        element.addEventListener('animationend', () => {
            element.style.animation = '';
        }, { once: true });
    }

    /**
     * スムーズスクロール
     */
    smoothScrollTo(element, duration = 500) {
        if (!element) return;

        const targetPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const startTime = performance.now();

        const animation = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // イージング関数（easeInOutCubic）
            const easeProgress = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            window.scrollTo(0, startPosition + distance * easeProgress);

            if (progress < 1) {
                requestAnimationFrame(animation);
            }
        };

        requestAnimationFrame(animation);
    }

    /**
     * プログレスバーのアニメーション（将来の拡張用）
     */
    animateProgress(progressBar, startPercent, endPercent, duration = 1000) {
        if (!progressBar) return;

        const startTime = performance.now();
        const range = endPercent - startPercent;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // イージング関数（easeOutQuad）
            const easeProgress = 1 - (1 - progress) * (1 - progress);
            const currentPercent = startPercent + range * easeProgress;

            progressBar.style.width = `${currentPercent}%`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * ツールチップの表示アニメーション
     */
    showTooltip(element, text, position = 'top') {
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip tooltip-${position}`;
        tooltip.textContent = text;
        tooltip.style.position = 'absolute';
        tooltip.style.zIndex = '9999';
        tooltip.style.opacity = '0';
        tooltip.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

        document.body.appendChild(tooltip);

        // 位置を計算
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        switch (position) {
            case 'top':
                tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
                tooltip.style.top = `${rect.top - tooltipRect.height - 8}px`;
                break;
            case 'bottom':
                tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
                tooltip.style.top = `${rect.bottom + 8}px`;
                break;
            case 'left':
                tooltip.style.left = `${rect.left - tooltipRect.width - 8}px`;
                tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
                break;
            case 'right':
                tooltip.style.left = `${rect.right + 8}px`;
                tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
                break;
        }

        // アニメーションで表示
        setTimeout(() => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateY(0)';
        }, 10);

        return tooltip;
    }

    /**
     * ツールチップの非表示
     */
    hideTooltip(tooltip) {
        if (!tooltip) return;

        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateY(4px)';

        setTimeout(() => {
            tooltip.remove();
        }, 300);
    }

    /**
     * パーティクルエフェクト（軽量版）
     */
    createParticles(x, y, count = 10, color = '#4A90E2') {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'micro-particle';
            particle.style.position = 'fixed';
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.borderRadius = '50%';
            particle.style.backgroundColor = color;
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '9999';

            document.body.appendChild(particle);

            // ランダムな方向に飛ばす
            const angle = (Math.PI * 2 * i) / count;
            const velocity = 50 + Math.random() * 50;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            this.animateParticle(particle, vx, vy);
        }
    }

    /**
     * パーティクルのアニメーション
     */
    animateParticle(particle, vx, vy) {
        const startTime = performance.now();
        const duration = 600;
        const startX = parseFloat(particle.style.left);
        const startY = parseFloat(particle.style.top);

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = elapsed / duration;

            if (progress >= 1) {
                particle.remove();
                return;
            }

            // 重力効果
            const gravity = 200;
            const x = startX + vx * progress;
            const y = startY + vy * progress + 0.5 * gravity * progress * progress;

            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.opacity = 1 - progress;

            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }

    /**
     * ボタンクリック時のフィードバック強化
     */
    enhanceButtonClick(button) {
        if (!button) return;

        // クリック位置でパーティクル生成
        button.addEventListener('click', (e) => {
            const rect = button.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;

            // 軽いパーティクルエフェクト
            this.createParticles(x, y, 5, getComputedStyle(button).backgroundColor);
        });
    }

    /**
     * データグラフのバー伸長アニメーション（将来の拡張用）
     */
    animateBar(bar, targetHeight, duration = 800) {
        if (!bar) return;

        const startHeight = parseFloat(bar.style.height) || 0;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // イージング関数（easeOutBack）
            const easeProgress = 1 + 2.70158 * Math.pow(progress - 1, 3) + 1.70158 * Math.pow(progress - 1, 2);
            const currentHeight = startHeight + (targetHeight - startHeight) * easeProgress;

            bar.style.height = `${currentHeight}%`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }
}

// グローバルインスタンスを作成
window.microInteractionManager = new MicroInteractionManager();

// DOMContentLoaded後に初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('MicroInteractionManager initialized');
});
