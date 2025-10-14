/**
 * 奥行き管理クラス
 * Material Design風の影とレイヤー構造を動的に制御
 */
class DepthManager {
    constructor() {
        this.activeModal = null;
        this.focusedElement = null;
        this.init();
    }

    init() {
        this.setupDepthInteractions();
        this.setupModalDepthEffects();
        this.setupFocusManagement();
        this.setupParallaxEffect();
        console.log('DepthManager initialized');
    }

    /**
     * 要素に奥行きレベルを設定
     */
    setDepthLevel(element, level) {
        if (!element) return;

        // 既存の奥行きクラスを削除
        element.classList.remove(
            'depth-level-1',
            'depth-level-2',
            'depth-level-3'
        );

        // 新しい奥行きクラスを追加
        if (level >= 1 && level <= 3) {
            element.classList.add(`depth-level-${level}`);
        }
    }

    /**
     * インタラクション時の奥行き効果
     */
    setupDepthInteractions() {
        // ボタンの押し込み効果
        document.addEventListener('mousedown', (e) => {
            const btn = e.target.closest('.btn, .size-btn, .problem-btn, .gallery-tab-btn');
            if (btn && !btn.disabled) {
                btn.classList.add('pressed');
            }
        });

        document.addEventListener('mouseup', () => {
            document.querySelectorAll('.pressed').forEach(el => {
                el.classList.remove('pressed');
            });
        });

        // タッチデバイス対応
        document.addEventListener('touchstart', (e) => {
            const btn = e.target.closest('.btn, .size-btn, .problem-btn, .gallery-tab-btn');
            if (btn && !btn.disabled) {
                btn.classList.add('pressed');
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            document.querySelectorAll('.pressed').forEach(el => {
                el.classList.remove('pressed');
            });
        }, { passive: true });

        // ギャラリーアイテムの浮上効果
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('mouseenter', (e) => {
                this.liftElement(e.currentTarget, 300);
            });

            item.addEventListener('mouseleave', (e) => {
                this.unliftElement(e.currentTarget, 300);
            });
        });

        // パズルピースの浮上効果
        const observePuzzlePieces = () => {
            const puzzlePieces = document.querySelectorAll('.puzzle-piece:not(.empty)');
            puzzlePieces.forEach(piece => {
                piece.addEventListener('mouseenter', (e) => {
                    this.liftElement(e.currentTarget, 200);
                });

                piece.addEventListener('mouseleave', (e) => {
                    this.unliftElement(e.currentTarget, 200);
                });
            });
        };

        // パズルが再レンダリングされるたびに再設定
        const puzzleGrid = document.getElementById('puzzle-grid');
        if (puzzleGrid) {
            const observer = new MutationObserver(observePuzzlePieces);
            observer.observe(puzzleGrid, { childList: true, subtree: true });
            observePuzzlePieces(); // 初期設定
        }
    }

    /**
     * 要素を浮上させる
     */
    liftElement(element, duration = 300) {
        if (!element || element.classList.contains('empty')) return;

        element.style.transition = `box-shadow ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        element.classList.add('lifted');

        // 周囲の要素を軽く暗くする（相対的に浮き上がって見える）
        // パズルピースでは無効化: 他のピースが暗くなるのを防止
        // this.dimSiblings(element);
    }

    /**
     * 要素の浮上を解除
     */
    unliftElement(element, duration = 300) {
        if (!element) return;

        element.style.transition = `box-shadow ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        element.classList.remove('lifted');

        // 周囲の要素の暗さを解除
        // パズルピースでは無効化: 他のピースが暗くなるのを防止
        // this.undimSiblings(element);
    }

    /**
     * 兄弟要素を暗くする
     */
    dimSiblings(element) {
        const parent = element.parentElement;
        if (!parent) return;

        Array.from(parent.children).forEach(sibling => {
            if (sibling !== element && !sibling.classList.contains('empty')) {
                sibling.classList.add('unfocused');
            }
        });
    }

    /**
     * 兄弟要素の暗さを解除
     */
    undimSiblings(element) {
        const parent = element.parentElement;
        if (!parent) return;

        Array.from(parent.children).forEach(sibling => {
            sibling.classList.remove('unfocused');
        });
    }

    /**
     * モーダル表示時の奥行き効果
     */
    setupModalDepthEffects() {
        // モーダルの監視
        const modal = document.getElementById('image-modal');
        if (!modal) return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const isHidden = modal.classList.contains('hidden');

                    if (!isHidden) {
                        // モーダル表示時: 背景をぼかす
                        this.showModalDepth(modal);
                    } else {
                        // モーダル非表示時: ぼかしを解除
                        this.hideModalDepth();
                    }
                }
            });
        });

        observer.observe(modal, { attributes: true });
    }

    /**
     * モーダル表示時の背景処理
     */
    showModalDepth(modal) {
        this.activeModal = modal;

        // 背景の全要素をぼかす
        const screens = document.querySelectorAll('.screen:not(.hidden)');
        screens.forEach(screen => {
            if (!modal.contains(screen)) {
                screen.classList.add('blur-background');
            }
        });

        // モーダルコンテンツを段階的に表示
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            setTimeout(() => {
                this.setDepthLevel(modalContent, 3);
            }, 50);
        }

        // モーダル画像にフォーカス効果
        const modalImage = modal.querySelector('#modal-image');
        if (modalImage) {
            setTimeout(() => {
                modalImage.classList.add('focused');
            }, 200);
        }
    }

    /**
     * モーダル非表示時の背景処理
     */
    hideModalDepth() {
        // 背景のぼかしを解除
        document.querySelectorAll('.blur-background').forEach(el => {
            el.classList.remove('blur-background');
        });

        // フォーカス効果を解除
        document.querySelectorAll('.focused').forEach(el => {
            el.classList.remove('focused');
        });

        this.activeModal = null;
    }

    /**
     * フォーカス管理（キーボードナビゲーション）
     */
    setupFocusManagement() {
        // フォーカス可能な要素
        const focusableSelector = '.btn, .size-btn, .problem-btn, .gallery-tab-btn, .gallery-item, .page-number-btn';

        document.addEventListener('focusin', (e) => {
            const focusable = e.target.closest(focusableSelector);
            if (focusable) {
                this.setFocusedElement(focusable);
            }
        });

        document.addEventListener('focusout', (e) => {
            const focusable = e.target.closest(focusableSelector);
            if (focusable) {
                this.clearFocusedElement(focusable);
            }
        });
    }

    /**
     * フォーカスされた要素を強調
     */
    setFocusedElement(element) {
        if (!element) return;

        // 前のフォーカス要素をクリア
        if (this.focusedElement) {
            this.clearFocusedElement(this.focusedElement);
        }

        this.focusedElement = element;
        element.classList.add('focused');

        // 軽く浮上させる
        this.liftElement(element, 200);
    }

    /**
     * フォーカスをクリア
     */
    clearFocusedElement(element) {
        if (!element) return;

        element.classList.remove('focused');
        this.unliftElement(element, 200);

        if (this.focusedElement === element) {
            this.focusedElement = null;
        }
    }

    /**
     * パララックス効果（マウス追従で奥行き感を演出）
     */
    setupParallaxEffect() {
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        // マウス位置を追跡
        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        // スムーズなアニメーション
        const animateParallax = () => {
            targetX += (mouseX - targetX) * 0.1;
            targetY += (mouseY - targetY) * 0.1;

            // パララックス対象要素
            const screens = document.querySelectorAll('.screen:not(.hidden)');
            screens.forEach((screen, index) => {
                const depth = (index + 1) * 2;
                const offsetX = targetX * depth;
                const offsetY = targetY * depth;

                screen.style.transform = `
                    translate(${offsetX}px, ${offsetY}px)
                    perspective(1000px)
                    rotateY(${targetX * 2}deg)
                    rotateX(${-targetY * 2}deg)
                `;
            });

            requestAnimationFrame(animateParallax);
        };

        // パララックス効果は控えめにするため、ユーザーが有効化した場合のみ
        // 現在は無効化（必要に応じてコメント解除）
        // animateParallax();
    }

    /**
     * スクロール時の奥行き効果（将来の拡張用）
     */
    setupScrollDepthEffect() {
        let lastScrollTop = 0;

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';

            // スクロール方向に応じて要素の影を調整
            document.querySelectorAll('.depth-aware').forEach(el => {
                const rect = el.getBoundingClientRect();
                const distanceFromCenter = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
                const maxDistance = window.innerHeight / 2;
                const depthFactor = 1 - (distanceFromCenter / maxDistance);

                // 中央に近いほど影を強く
                if (depthFactor > 0) {
                    const shadowIntensity = depthFactor * 0.3;
                    el.style.boxShadow = `
                        0 ${4 + shadowIntensity * 10}px ${12 + shadowIntensity * 20}px rgba(0, 0, 0, ${0.12 + shadowIntensity * 0.12}),
                        0 ${2 + shadowIntensity * 4}px ${4 + shadowIntensity * 8}px rgba(0, 0, 0, ${0.24 + shadowIntensity * 0.12})
                    `;
                }
            });

            lastScrollTop = scrollTop;
        }, { passive: true });
    }

    /**
     * 要素のドラッグ中の奥行き効果（将来の拡張用）
     */
    makeDraggable(element) {
        if (!element) return;

        let isDragging = false;

        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            element.classList.add('dragging');
            this.setDepthLevel(element, 3);
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            // ドラッグ中の位置更新
            element.style.left = `${e.clientX}px`;
            element.style.top = `${e.clientY}px`;
        });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;

            isDragging = false;
            element.classList.remove('dragging');
            this.setDepthLevel(element, 1);
        });
    }

    /**
     * 色による奥行き感の調整
     */
    adjustColorDepth(element, depthLevel) {
        if (!element) return;

        switch (depthLevel) {
            case 1:
                // 背景に近い: 暗く、彩度低く
                element.style.filter = 'brightness(0.95) saturate(0.9)';
                break;
            case 2:
                // 中間: 通常
                element.style.filter = 'brightness(1) saturate(1)';
                break;
            case 3:
                // 最前面: 明るく、彩度高く
                element.style.filter = 'brightness(1.05) saturate(1.1)';
                break;
            default:
                element.style.filter = 'none';
        }
    }

    /**
     * アニメーションで奥行きを変更
     */
    animateDepthChange(element, fromLevel, toLevel, duration = 300) {
        if (!element) return;

        element.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;

        // 開始状態を設定
        this.setDepthLevel(element, fromLevel);

        // アニメーション実行
        requestAnimationFrame(() => {
            this.setDepthLevel(element, toLevel);
        });

        // アニメーション完了後にトランジションをリセット
        setTimeout(() => {
            element.style.transition = '';
        }, duration);
    }

    /**
     * 画面遷移時の奥行き効果
     */
    transitionScreenDepth(fromScreen, toScreen) {
        if (!fromScreen || !toScreen) return;

        // 現在の画面を奥に押し込む
        fromScreen.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
        fromScreen.style.transform = 'scale(0.95) translateZ(-100px)';
        fromScreen.style.opacity = '0';

        // 新しい画面を手前から登場
        toScreen.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
        toScreen.style.transform = 'scale(1.05) translateZ(100px)';
        toScreen.style.opacity = '0';

        setTimeout(() => {
            toScreen.style.transform = 'scale(1) translateZ(0)';
            toScreen.style.opacity = '1';
        }, 50);

        // アニメーション完了後にスタイルをリセット
        setTimeout(() => {
            fromScreen.style.transition = '';
            fromScreen.style.transform = '';
            toScreen.style.transition = '';
            toScreen.style.transform = '';
        }, 450);
    }
}

// グローバルインスタンスを作成
window.depthManager = new DepthManager();
