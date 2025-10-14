// ========================================
// フィードバックマネージャー
// ========================================

class FeedbackManager {
    constructor() {
        this.guideMessage = document.getElementById('guide-message');
        this.tooltip = document.getElementById('tooltip');
        this.guideTimeout = null;
        this.tooltipTimeout = null;
    }

    // ========================================
    // 視覚的フィードバック
    // ========================================

    // 成功フィードバック
    showSuccess(element) {
        if (!element) return;

        element.classList.add('feedback-success');
        setTimeout(() => {
            element.classList.remove('feedback-success');
        }, 500);

        // リップルエフェクトを追加
        this.addRippleEffect(element);
    }

    // エラーフィードバック
    showError(element) {
        if (!element) return;

        element.classList.add('feedback-error');
        setTimeout(() => {
            element.classList.remove('feedback-error');
        }, 500);
    }

    // クリックフィードバック
    showClick(element) {
        if (!element) return;

        element.classList.add('feedback-click');
        setTimeout(() => {
            element.classList.remove('feedback-click');
        }, 200);
    }

    // リップルエフェクト
    addRippleEffect(element) {
        if (!element) return;

        const wasRelative = element.style.position === 'relative';
        if (!wasRelative) {
            element.style.position = 'relative';
        }

        element.classList.add('feedback-ripple');

        setTimeout(() => {
            element.classList.remove('feedback-ripple');
            if (!wasRelative) {
                element.style.position = '';
            }
        }, 600);
    }

    // 処理中表示
    showProcessing(element, text = null) {
        if (!element) return;

        element.classList.add('btn-processing');

        // スピナーを追加
        const spinner = document.createElement('span');
        spinner.className = 'loading-spinner';
        spinner.dataset.feedbackSpinner = 'true';
        element.appendChild(spinner);

        if (text) {
            const originalText = element.textContent;
            element.dataset.originalText = originalText;
            element.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    node.textContent = text;
                }
            });
        }
    }

    // 処理中表示を解除
    hideProcessing(element) {
        if (!element) return;

        element.classList.remove('btn-processing');

        // スピナーを削除
        const spinner = element.querySelector('[data-feedback-spinner]');
        if (spinner) {
            spinner.remove();
        }

        // テキストを復元
        if (element.dataset.originalText) {
            element.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    node.textContent = element.dataset.originalText;
                }
            });
            delete element.dataset.originalText;
        }
    }

    // ========================================
    // ガイドメッセージ
    // ========================================

    showGuide(message, type = 'info', duration = 3000) {
        if (!this.guideMessage) return;

        // 既存のタイムアウトをクリア
        if (this.guideTimeout) {
            clearTimeout(this.guideTimeout);
        }

        // タイプに応じたクラスを設定
        this.guideMessage.className = 'guide-message';
        if (type === 'success' || type === 'error' || type === 'info') {
            this.guideMessage.classList.add(type);
        }

        this.guideMessage.textContent = message;
        this.guideMessage.classList.add('show');

        // 自動で非表示
        this.guideTimeout = setTimeout(() => {
            this.hideGuide();
        }, duration);
    }

    hideGuide() {
        if (!this.guideMessage) return;

        this.guideMessage.classList.remove('show');

        if (this.guideTimeout) {
            clearTimeout(this.guideTimeout);
            this.guideTimeout = null;
        }
    }

    // ========================================
    // ツールチップ
    // ========================================

    showTooltip(element, message, position = 'top') {
        if (!this.tooltip || !element) return;

        const rect = element.getBoundingClientRect();

        this.tooltip.textContent = message;
        this.tooltip.className = 'tooltip';

        // 位置を計算
        let top, left;

        if (position === 'top') {
            top = rect.top - this.tooltip.offsetHeight - 10;
            left = rect.left + (rect.width / 2);
        } else if (position === 'bottom') {
            top = rect.bottom + 10;
            left = rect.left + (rect.width / 2);
        } else if (position === 'left') {
            top = rect.top + (rect.height / 2);
            left = rect.left - this.tooltip.offsetWidth - 10;
        } else if (position === 'right') {
            top = rect.top + (rect.height / 2);
            left = rect.right + 10;
        }

        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
        this.tooltip.classList.add('show');
    }

    hideTooltip() {
        if (!this.tooltip) return;

        this.tooltip.classList.remove('show');
    }

    // 要素にツールチップを自動バインド
    bindTooltip(element, message, position = 'top') {
        if (!element) return;

        element.addEventListener('mouseenter', () => {
            this.showTooltip(element, message, position);
        });

        element.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });

        // モバイル対応
        element.addEventListener('touchstart', (e) => {
            this.showTooltip(element, message, position);

            if (this.tooltipTimeout) {
                clearTimeout(this.tooltipTimeout);
            }

            this.tooltipTimeout = setTimeout(() => {
                this.hideTooltip();
            }, 2000);
        }, { passive: true });
    }

    // ========================================
    // 背景アンビエント効果
    // ========================================

    setAmbient(mode = 'calm') {
        const body = document.body;

        // 既存のアンビエントクラスを削除
        body.classList.remove('ambient-calm', 'ambient-active', 'ambient-victory');

        // 新しいアンビエントクラスを追加
        if (mode === 'calm' || mode === 'active' || mode === 'victory') {
            body.classList.add(`ambient-${mode}`);
        }
    }

    // ========================================
    // 進行状況バー
    // ========================================

    createProgressBar(container, initial = 0) {
        if (!container) return null;

        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-bar-container';

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.width = `${initial}%`;

        progressContainer.appendChild(progressBar);
        container.appendChild(progressContainer);

        return {
            element: progressBar,
            update: (percentage) => {
                progressBar.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
            },
            remove: () => {
                progressContainer.remove();
            }
        };
    }

    // ========================================
    // ユーティリティ
    // ========================================

    // 全ボタンにクリックフィードバックを適用
    bindClickFeedbackToAll(selector = '.btn, .size-btn, .problem-btn, .page-number-btn, .pagination-btn') {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                this.showClick(button);
            });
        });
    }

    // 要素を一時的にハイライト
    highlight(element, duration = 1000) {
        if (!element) return;

        const originalBoxShadow = element.style.boxShadow;
        const originalTransform = element.style.transform;

        element.style.boxShadow = '0 0 20px rgba(74, 144, 226, 0.8), 0 0 40px rgba(74, 144, 226, 0.4)';
        element.style.transform = 'scale(1.05)';
        element.style.transition = 'all 0.3s ease';

        setTimeout(() => {
            element.style.boxShadow = originalBoxShadow;
            element.style.transform = originalTransform;
        }, duration);
    }

    // カウントダウン表示を作成
    createCountdown(container, seconds, onComplete) {
        if (!container) return null;

        const countdownDiv = document.createElement('div');
        countdownDiv.className = 'countdown-display';
        countdownDiv.textContent = seconds;
        container.appendChild(countdownDiv);

        let remaining = seconds;
        const interval = setInterval(() => {
            remaining--;
            countdownDiv.textContent = remaining;

            // 警告状態
            if (remaining <= 10 && remaining > 5) {
                countdownDiv.classList.add('warning');
                countdownDiv.classList.remove('danger');
            }
            // 危険状態
            else if (remaining <= 5) {
                countdownDiv.classList.add('danger');
                countdownDiv.classList.remove('warning');
            }

            if (remaining <= 0) {
                clearInterval(interval);
                countdownDiv.remove();
                if (onComplete) onComplete();
            }
        }, 1000);

        return {
            element: countdownDiv,
            cancel: () => {
                clearInterval(interval);
                countdownDiv.remove();
            }
        };
    }

    // ヒントバッジを作成
    createHintBadge(text) {
        const badge = document.createElement('span');
        badge.className = 'hint-badge';
        badge.textContent = text;
        return badge;
    }
}

// グローバルインスタンスを作成
window.feedbackManager = new FeedbackManager();

// DOMContentLoaded後に初期化
document.addEventListener('DOMContentLoaded', () => {
    // 全ボタンにクリックフィードバックを適用
    window.feedbackManager.bindClickFeedbackToAll();

    // デフォルトのアンビエント設定
    window.feedbackManager.setAmbient('calm');
});
