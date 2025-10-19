/**
 * サウンド管理クラス
 * ゲーム内の全ての効果音とBGMを管理
 */
class SoundManager {
    constructor() {
        this.sounds = {};
        this.bgm = null;
        this.isMuted = false;
        this.isBGMMuted = false; // BGMはデフォルトで再生
        this.volume = 0.5;
        this.bgmVolume = 0.3;

        this.initSounds();
        this.loadMuteState();
    }

    /**
     * 効果音の初期化
     */
    initSounds() {
        // 効果音の定義
        const soundFiles = {
            tileSlide: 'assets/sound/tile-slide.mp3',
            tileClick: 'assets/sound/tile-click.mp3',
            buttonClick: 'assets/sound/button-click.mp3',
            buttonHover: 'assets/sound/button-hover.mp3',
            complete: 'assets/sound/complete.mp3',
            newRecord: 'assets/sound/new-record.mp3',
            screenTransition: 'assets/sound/screen-transition.mp3'
        };

        // 各効果音をロード
        for (const [key, path] of Object.entries(soundFiles)) {
            this.sounds[key] = new Audio(path);
            this.sounds[key].volume = this.volume;

            // エラーハンドリング
            this.sounds[key].addEventListener('error', (e) => {
                console.warn(`効果音の読み込みに失敗: ${path}`, e);
            });
        }

        // BGMのロード
        this.titleBGM = new Audio('assets/sound/bgm/title.mp3');
        this.titleBGM.volume = this.bgmVolume;
        this.titleBGM.loop = true;
        this.titleBGM.addEventListener('error', (e) => {
            console.warn('タイトルBGMの読み込みに失敗', e);
        });

        this.puzzleBGM = new Audio('assets/sound/bgm/puzzle.mp3');
        this.puzzleBGM.volume = this.bgmVolume;
        this.puzzleBGM.loop = true;
        this.puzzleBGM.addEventListener('error', (e) => {
            console.warn('パズルBGMの読み込みに失敗', e);
        });

        this.galleryBGM = new Audio('assets/sound/bgm/gallery.mp3');
        this.galleryBGM.volume = this.bgmVolume;
        this.galleryBGM.loop = true;
        this.galleryBGM.addEventListener('error', (e) => {
            console.warn('ギャラリーBGMの読み込みに失敗', e);
        });

        this.clearBGM = new Audio('assets/sound/bgm/clear.mp3');
        this.clearBGM.volume = this.bgmVolume;
        this.clearBGM.loop = true;
        this.clearBGM.addEventListener('error', (e) => {
            console.warn('クリアBGMの読み込みに失敗', e);
        });

        this.bgm = new Audio('assets/sound/bgm-gameplay.mp3');
        this.bgm.volume = this.bgmVolume;
        this.bgm.loop = true;
        this.bgm.addEventListener('error', (e) => {
            console.warn('BGMの読み込みに失敗', e);
        });

        // デフォルトはタイトルBGMを使用
        this.currentBGM = this.titleBGM;
    }

    /**
     * ミュート状態をLocalStorageから読み込み
     */
    loadMuteState() {
        const savedMuteState = localStorage.getItem('soundMuted');
        const savedBGMMuteState = localStorage.getItem('bgmMuted');

        if (savedMuteState !== null) {
            this.isMuted = savedMuteState === 'true';
        }

        if (savedBGMMuteState !== null) {
            this.isBGMMuted = savedBGMMuteState === 'true';
        }
    }

    /**
     * ミュート状態をLocalStorageに保存
     */
    saveMuteState() {
        localStorage.setItem('soundMuted', this.isMuted.toString());
        localStorage.setItem('bgmMuted', this.isBGMMuted.toString());
    }

    /**
     * 効果音を再生
     * @param {string} soundName - 再生する効果音の名前
     */
    play(soundName) {
        if (this.isMuted || !this.sounds[soundName]) {
            return;
        }

        try {
            // 音声をクローンして再生（同時再生対応）
            const sound = this.sounds[soundName].cloneNode();
            sound.volume = this.volume;
            sound.play().catch((e) => {
                console.warn(`効果音の再生に失敗: ${soundName}`, e);
            });
        } catch (e) {
            console.warn(`効果音の再生エラー: ${soundName}`, e);
        }
    }

    /**
     * BGMを再生
     */
    playBGM() {
        console.log('playBGM呼び出し - isBGMMuted:', this.isBGMMuted, 'currentBGM:', this.currentBGM);
        if (this.isBGMMuted || !this.currentBGM) {
            console.log('BGM再生スキップ - ミュート:', this.isBGMMuted, 'BGM存在:', !!this.currentBGM);
            return;
        }

        // 既に再生中の場合は最初から再生しない
        if (!this.currentBGM.paused) {
            console.log('BGMは既に再生中なのでスキップ');
            return;
        }

        this.currentBGM.currentTime = 0;
        this.currentBGM.play().then(() => {
            console.log('BGM再生開始成功');
        }).catch((e) => {
            console.warn('BGMの再生に失敗', e);
        });
    }

    /**
     * BGMを停止
     */
    stopBGM() {
        if (this.titleBGM) {
            this.titleBGM.pause();
            this.titleBGM.currentTime = 0;
        }
        if (this.puzzleBGM) {
            this.puzzleBGM.pause();
            this.puzzleBGM.currentTime = 0;
        }
        if (this.galleryBGM) {
            this.galleryBGM.pause();
            this.galleryBGM.currentTime = 0;
        }
        if (this.clearBGM) {
            this.clearBGM.pause();
            this.clearBGM.currentTime = 0;
        }
        if (this.bgm) {
            this.bgm.pause();
            this.bgm.currentTime = 0;
        }
    }

    /**
     * 全てのサウンド（効果音とBGM）を停止
     */
    stopAllSounds() {
        // 全てのBGMを停止
        this.stopBGM();

        // 全ての効果音を停止
        for (const sound of Object.values(this.sounds)) {
            if (sound) {
                sound.pause();
                sound.currentTime = 0;
            }
        }
    }

    /**
     * BGMを一時停止
     */
    pauseBGM() {
        if (this.currentBGM) {
            this.currentBGM.pause();
        }
    }

    /**
     * BGMを再開
     */
    resumeBGM() {
        if (!this.isBGMMuted && this.currentBGM && this.currentBGM.paused) {
            this.currentBGM.play().catch((e) => {
                console.warn('BGMの再開に失敗', e);
            });
        }
    }

    /**
     * タイトルBGMに切り替え
     */
    switchToTitleBGM() {
        console.log('タイトルBGMに切り替え - isBGMMuted:', this.isBGMMuted);
        // 既にタイトルBGMが再生中の場合は何もしない
        if (this.currentBGM === this.titleBGM && !this.titleBGM.paused) {
            console.log('タイトルBGMは既に再生中');
            return;
        }
        this.stopBGM();
        this.currentBGM = this.titleBGM;
        this.playBGM();
    }

    /**
     * パズルBGMに切り替え
     */
    switchToPuzzleBGM() {
        console.log('パズルBGMに切り替え - isBGMMuted:', this.isBGMMuted);
        // 既にパズルBGMが再生中の場合は何もしない
        if (this.currentBGM === this.puzzleBGM && !this.puzzleBGM.paused) {
            console.log('パズルBGMは既に再生中');
            return;
        }
        this.stopBGM();
        this.currentBGM = this.puzzleBGM;
        this.playBGM();
    }

    /**
     * ギャラリーBGMに切り替え
     */
    switchToGalleryBGM() {
        console.log('ギャラリーBGMに切り替え - isBGMMuted:', this.isBGMMuted);
        // 既にギャラリーBGMが再生中の場合は何もしない
        if (this.currentBGM === this.galleryBGM && !this.galleryBGM.paused) {
            console.log('ギャラリーBGMは既に再生中');
            return;
        }
        this.stopBGM();
        this.currentBGM = this.galleryBGM;
        this.playBGM();
    }

    /**
     * クリアBGMに切り替え
     */
    switchToClearBGM() {
        console.log('クリアBGMに切り替え - isBGMMuted:', this.isBGMMuted);
        // 既にクリアBGMが再生中の場合は何もしない
        if (this.currentBGM === this.clearBGM && !this.clearBGM.paused) {
            console.log('クリアBGMは既に再生中');
            return;
        }
        this.stopBGM();
        this.currentBGM = this.clearBGM;
        this.playBGM();
    }

    /**
     * ゲームBGMに切り替え
     */
    switchToGameBGM() {
        console.log('ゲームBGMに切り替え - isBGMMuted:', this.isBGMMuted);
        // 既にゲームBGMが再生中の場合は何もしない
        if (this.currentBGM === this.bgm && !this.bgm.paused) {
            console.log('ゲームBGMは既に再生中');
            return;
        }
        this.stopBGM();
        this.currentBGM = this.bgm;
        this.playBGM();
    }

    /**
     * 効果音のミュート切り替え
     * @returns {boolean} - 現在のミュート状態
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.saveMuteState();
        return this.isMuted;
    }

    /**
     * BGMのミュート切り替え
     * @returns {boolean} - 現在のBGMミュート状態
     */
    toggleBGMMute() {
        this.isBGMMuted = !this.isBGMMuted;
        this.saveMuteState();

        if (this.isBGMMuted) {
            this.stopBGM();
        } else {
            this.playBGM();
        }

        return this.isBGMMuted;
    }

    /**
     * 音量を設定
     * @param {number} volume - 音量（0.0 - 1.0）
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));

        // 全ての効果音の音量を更新
        for (const sound of Object.values(this.sounds)) {
            sound.volume = this.volume;
        }
    }

    /**
     * BGM音量を設定
     * @param {number} volume - BGM音量（0.0 - 1.0）
     */
    setBGMVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));

        if (this.titleBGM) {
            this.titleBGM.volume = this.bgmVolume;
        }
        if (this.puzzleBGM) {
            this.puzzleBGM.volume = this.bgmVolume;
        }
        if (this.galleryBGM) {
            this.galleryBGM.volume = this.bgmVolume;
        }
        if (this.clearBGM) {
            this.clearBGM.volume = this.bgmVolume;
        }
        if (this.bgm) {
            this.bgm.volume = this.bgmVolume;
        }
    }

    /**
     * 便利メソッド: タイルスライド音
     */
    playTileSlide() {
        this.play('tileSlide');
    }

    /**
     * 便利メソッド: タイルクリック音
     */
    playTileClick() {
        this.play('tileClick');
    }

    /**
     * 便利メソッド: ボタンクリック音
     */
    playButtonClick() {
        this.play('buttonClick');
    }

    /**
     * 便利メソッド: ボタンホバー音
     */
    playButtonHover() {
        this.play('buttonHover');
    }

    /**
     * 便利メソッド: クリア音
     */
    playComplete() {
        this.play('complete');
    }

    /**
     * 便利メソッド: 新記録音
     */
    playNewRecord() {
        this.play('newRecord');
    }

    /**
     * 便利メソッド: 画面遷移音
     */
    playScreenTransition() {
        this.play('screenTransition');
    }
}

// グローバルインスタンスを作成（game.jsから使用）
window.soundManager = new SoundManager();
