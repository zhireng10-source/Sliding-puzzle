/**
 * サウンド管理クラス
 * ゲーム内の全ての効果音とBGMを管理
 */
class SoundManager {
    constructor() {
        this.sounds = {};
        this.voiceSounds = []; // 音声ファイル配列
        this.finishVoiceSounds = []; // 絶頂演出用音声ファイル配列
        this.isVoicePlaying = false; // 音声再生中フラグ
        this.currentVoice = null; // 現在再生中の音声
        this.bgm = null;
        this.isMuted = false;
        this.isBGMMuted = false; // BGMはデフォルトで再生
        this.volume = 0.4;       // 効果音音量（小さめ）
        this.bgmVolume = 0.12;   // BGM音量（小さめ）

        // ボーナスステージ用の音量設定
        this.bonusBgmVolume = 0.1;   // ボーナスステージのBGM音量（さらに小さめ）
        this.bonusVoiceVolume = 1.0; // ボーナスステージのボイス音量（最大）
        this.finishVoiceVolume = 1.0; // 絶頂演出時のボイス音量（最大）
        this.omakeBgmVolume = 0.08;   // おまけCG解放画面のBGM音量（小さめ）
        this.defaultVolume = 0.4;     // 通常の効果音音量
        this.defaultBgmVolume = 0.12; // 通常のBGM音量
        this.isBonusMode = false;     // ボーナスモードフラグ

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

        this.bonusBGM = new Audio('assets/sound/bgm/bonus.mp3');
        this.bonusBGM.volume = this.bgmVolume;
        this.bonusBGM.loop = true;
        this.bonusBGM.addEventListener('error', (e) => {
            console.warn('ボーナスBGMの読み込みに失敗', e);
        });

        this.omakeBGM = new Audio('assets/sound/bgm/omake.mp3');
        this.omakeBGM.volume = this.omakeBgmVolume;
        this.omakeBGM.loop = true;
        this.omakeBGM.addEventListener('error', (e) => {
            console.warn('おまけBGMの読み込みに失敗', e);
        });

        this.bgm = new Audio('assets/sound/bgm-gameplay.mp3');
        this.bgm.volume = this.bgmVolume;
        this.bgm.loop = true;
        this.bgm.addEventListener('error', (e) => {
            console.warn('BGMの読み込みに失敗', e);
        });

        // ボーナスステージ用効果音（ループ再生用）
        this.bonusEffectSound = new Audio('assets/sound/effects/kuchu.opus');
        this.bonusEffectSound.volume = 0.15; // 効果音音量（小さめ）
        this.bonusEffectSound.loop = true;
        this.bonusEffectSound.addEventListener('error', (e) => {
            console.warn('ボーナス効果音の読み込みに失敗', e);
        });

        // デフォルトはタイトルBGMを使用
        this.currentBGM = this.titleBGM;

        // 音声ファイルをロード（ボーナスステージ用）
        const voiceFiles = [
            'assets/voice/10_喘ぎ声（小）1.wav',
            'assets/voice/11_喘ぎ声（小）2.wav',
            'assets/voice/12_喘ぎ声（小）3.wav',
            'assets/voice/13_喘ぎ声（小）4.wav',
            'assets/voice/14_喘ぎ声（中）1.wav',
            'assets/voice/15_喘ぎ声（中）2.wav',
            'assets/voice/16_喘ぎ声（大）1.wav',
            'assets/voice/17_喘ぎ声（大）2.wav',
            'assets/voice/18_喘ぎ声（大）3.wav'
        ];

        voiceFiles.forEach((path, index) => {
            const audio = new Audio(path);
            audio.volume = this.volume;
            audio.addEventListener('error', (e) => {
                console.warn(`音声ファイルの読み込みに失敗: ${path}`, e);
            });
            this.voiceSounds.push(audio);
        });

        // 絶頂演出用音声ファイルをロード（assets/voice/finishフォルダ内）
        const finishVoiceFiles = [
            'assets/voice/finish/30_セリフ2.wav',
            'assets/voice/finish/31_セリフ3.wav',
            'assets/voice/finish/32_セリフ4.wav',
            'assets/voice/finish/33_セリフ5.wav',
            'assets/voice/finish/34_セリフ6.wav'
        ];

        finishVoiceFiles.forEach((path, index) => {
            const audio = new Audio(path);
            audio.volume = this.volume;
            audio.addEventListener('error', (e) => {
                console.warn(`絶頂演出用音声ファイルの読み込みに失敗: ${path}`, e);
            });
            this.finishVoiceSounds.push(audio);
        });
    }

    /**
     * ミュート状態をsaveManagerから読み込み
     */
    loadMuteState() {
        // saveManagerが初期化されるまで待機
        if (!window.saveManager) {
            setTimeout(() => this.loadMuteState(), 100);
            return;
        }

        const savedMuteState = window.saveManager.getItem('soundMuted');
        const savedBGMMuteState = window.saveManager.getItem('bgmMuted');

        if (savedMuteState !== null) {
            this.isMuted = savedMuteState === 'true';
        }

        if (savedBGMMuteState !== null) {
            this.isBGMMuted = savedBGMMuteState === 'true';
        }
    }

    /**
     * ミュート状態をsaveManagerに保存
     */
    saveMuteState() {
        if (window.saveManager) {
            window.saveManager.setItem('soundMuted', this.isMuted.toString());
            window.saveManager.setItem('bgmMuted', this.isBGMMuted.toString());
        }
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
        if (this.bonusBGM) {
            this.bonusBGM.pause();
            this.bonusBGM.currentTime = 0;
        }
        if (this.omakeBGM) {
            this.omakeBGM.pause();
            this.omakeBGM.currentTime = 0;
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

        // ボーナスモードをOFFにして音量を元に戻す
        if (this.isBonusMode) {
            this.isBonusMode = false;
            console.log('通常モードに戻しました');
        }

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

        // ボーナスモードをOFFにして音量を元に戻す
        if (this.isBonusMode) {
            this.isBonusMode = false;
            console.log('通常モードに戻しました');
        }

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

        // ボーナスモードをOFFにして音量を元に戻す
        if (this.isBonusMode) {
            this.isBonusMode = false;
            console.log('通常モードに戻しました');
        }

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

        // ボーナスモードをOFFにして音量を元に戻す
        if (this.isBonusMode) {
            this.isBonusMode = false;
            console.log('通常モードに戻しました');
        }

        this.currentBGM = this.clearBGM;
        this.playBGM();
    }

    /**
     * ボーナスBGMに切り替え
     */
    switchToBonusBGM() {
        console.log('ボーナスBGMに切り替え - isBGMMuted:', this.isBGMMuted);
        // 既にボーナスBGMが再生中の場合は何もしない
        if (this.currentBGM === this.bonusBGM && !this.bonusBGM.paused) {
            console.log('ボーナスBGMは既に再生中');
            return;
        }
        this.stopBGM();

        // ボーナスモードをONにして音量を調整
        this.isBonusMode = true;
        this.bonusBGM.volume = this.bonusBgmVolume;
        console.log('ボーナスステージ音量設定 - BGM:', this.bonusBgmVolume, 'ボイス:', this.bonusVoiceVolume);

        this.currentBGM = this.bonusBGM;
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

        // ボーナスモードをOFFにして音量を元に戻す
        if (this.isBonusMode) {
            this.isBonusMode = false;
            console.log('通常モードに戻しました');
        }

        this.currentBGM = this.bgm;
        this.playBGM();
    }

    /**
     * おまけBGMに切り替え
     */
    switchToOmakeBGM() {
        console.log('おまけBGMに切り替え - isBGMMuted:', this.isBGMMuted);
        // 既におまけBGMが再生中の場合は何もしない
        if (this.currentBGM === this.omakeBGM && !this.omakeBGM.paused) {
            console.log('おまけBGMは既に再生中');
            return;
        }
        this.stopBGM();

        // ボーナスモードをOFFにして音量を元に戻す
        if (this.isBonusMode) {
            this.isBonusMode = false;
            console.log('通常モードに戻しました');
        }

        this.currentBGM = this.omakeBGM;
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
        if (this.bonusBGM) {
            this.bonusBGM.volume = this.bgmVolume;
        }
        if (this.omakeBGM) {
            this.omakeBGM.volume = this.omakeBgmVolume;
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

    /**
     * ランダムに音声を再生（ボーナスステージ用）
     */
    playRandomVoice() {
        // ミュート中、または音声ファイルがない場合はスキップ
        if (this.isMuted || this.voiceSounds.length === 0) {
            return;
        }

        try {
            // 既に音声が再生中の場合は停止してから新しい音声を再生
            if (this.isVoicePlaying && this.currentVoice) {
                this.currentVoice.pause();
                this.currentVoice.currentTime = 0;
            }

            // ランダムに音声を選択
            const randomIndex = Math.floor(Math.random() * this.voiceSounds.length);
            const voice = this.voiceSounds[randomIndex].cloneNode();

            // ボーナスモード時はボイス音量を大きくする
            voice.volume = this.isBonusMode ? this.bonusVoiceVolume : this.volume;

            // 音声要素をDOMに追加（停止処理で検出できるように）
            voice.style.display = 'none';
            voice.classList.add('temp-voice');
            document.body.appendChild(voice);

            console.log(`🎵 ランダムボイス再生: ${randomIndex + 1}/${this.voiceSounds.length} (音量: ${voice.volume})`);

            // 現在の音声を保存
            this.currentVoice = voice;

            // 再生中フラグをtrueに設定
            this.isVoicePlaying = true;

            // 音声再生終了時にフラグをリセット＆DOMから削除
            voice.addEventListener('ended', () => {
                this.isVoicePlaying = false;
                this.currentVoice = null;
                if (voice.parentNode) {
                    voice.parentNode.removeChild(voice);
                }
            });

            // エラー時もフラグをリセット＆DOMから削除
            voice.addEventListener('error', () => {
                this.isVoicePlaying = false;
                this.currentVoice = null;
                if (voice.parentNode) {
                    voice.parentNode.removeChild(voice);
                }
            });

            voice.play().catch((e) => {
                console.warn('音声の再生に失敗', e);
                this.isVoicePlaying = false; // エラー時もフラグをリセット
                this.currentVoice = null;
                // DOMから削除
                if (voice.parentNode) {
                    voice.parentNode.removeChild(voice);
                }
            });
        } catch (e) {
            console.warn('音声の再生エラー', e);
            this.isVoicePlaying = false;
            this.currentVoice = null;
            // DOMから削除
            if (voice && voice.parentNode) {
                voice.parentNode.removeChild(voice);
            }
        }
    }

    /**
     * 絶頂演出用音声をランダムに再生
     */
    playFinishVoice() {
        console.log('🎉 playFinishVoice呼び出し - ミュート:', this.isMuted, 'ファイル数:', this.finishVoiceSounds.length);

        // ミュート中、または音声ファイルがない場合はスキップ
        if (this.isMuted || this.finishVoiceSounds.length === 0) {
            console.warn('⚠️ 絶頂ボイス再生スキップ - ミュート:', this.isMuted, 'ファイル数:', this.finishVoiceSounds.length);
            return;
        }

        try {
            // 既存の音声を停止
            this.stopVoice();

            // ランダムに音声を選択
            const randomIndex = Math.floor(Math.random() * this.finishVoiceSounds.length);
            const voice = this.finishVoiceSounds[randomIndex].cloneNode();

            console.log(`🎵 絶頂ボイス選択: ${randomIndex + 1}/${this.finishVoiceSounds.length}`);

            // 絶頂演出時は音量を最大にする
            voice.volume = this.finishVoiceVolume;
            console.log('🔊 絶頂ボイス音量:', voice.volume);

            // 音声要素をDOMに追加（停止処理で検出できるように）
            voice.style.display = 'none';
            voice.classList.add('temp-voice');
            document.body.appendChild(voice);

            // 現在の音声を保存
            this.currentVoice = voice;

            // 再生中フラグをtrueに設定
            this.isVoicePlaying = true;

            // 音声再生終了時にフラグをリセット＆DOMから削除
            voice.addEventListener('ended', () => {
                this.isVoicePlaying = false;
                this.currentVoice = null;
                if (voice.parentNode) {
                    voice.parentNode.removeChild(voice);
                }
                console.log('✅ 絶頂ボイス再生完了');
            });

            // エラー時もフラグをリセット＆DOMから削除
            voice.addEventListener('error', (e) => {
                this.isVoicePlaying = false;
                this.currentVoice = null;
                if (voice.parentNode) {
                    voice.parentNode.removeChild(voice);
                }
                console.error('❌ 絶頂ボイス再生エラー:', e);
            });

            // 再生開始
            voice.play()
                .then(() => {
                    console.log('▶️ 絶頂ボイス再生開始成功');
                })
                .catch((e) => {
                    console.error('❌ 絶頂演出用音声の再生に失敗:', e);
                    this.isVoicePlaying = false;
                    this.currentVoice = null;
                    // DOMから削除
                    if (voice.parentNode) {
                        voice.parentNode.removeChild(voice);
                    }
                });
        } catch (e) {
            console.error('❌ 絶頂演出用音声の再生エラー:', e);
            this.isVoicePlaying = false;
            this.currentVoice = null;
            // DOMから削除
            if (voice && voice.parentNode) {
                voice.parentNode.removeChild(voice);
            }
        }
    }

    /**
     * ボーナスステージ用効果音を再生
     */
    playBonusEffect() {
        if (this.isMuted || !this.bonusEffectSound) {
            console.log('ボーナス効果音再生スキップ - ミュート:', this.isMuted);
            return;
        }

        // 既に再生中の場合は何もしない
        if (!this.bonusEffectSound.paused) {
            console.log('ボーナス効果音は既に再生中');
            return;
        }

        this.bonusEffectSound.currentTime = 0;
        this.bonusEffectSound.play()
            .then(() => {
                console.log('✅ ボーナス効果音再生開始');
            })
            .catch((e) => {
                console.warn('❌ ボーナス効果音の再生に失敗', e);
            });
    }

    /**
     * ボーナスステージ用効果音を停止
     */
    stopBonusEffect() {
        if (this.bonusEffectSound) {
            this.bonusEffectSound.pause();
            this.bonusEffectSound.currentTime = 0;
            console.log('🛑 ボーナス効果音を停止');
        }
    }

    /**
     * 再生中の音声を停止
     */
    stopVoice() {
        console.log('🔇 stopVoice呼び出し - currentVoice:', this.currentVoice ? '存在する' : 'null', 'isVoicePlaying:', this.isVoicePlaying);

        // currentVoiceを停止
        if (this.currentVoice) {
            try {
                console.log('🛑 音声を停止中... paused:', this.currentVoice.paused, 'currentTime:', this.currentVoice.currentTime);
                this.currentVoice.pause();
                this.currentVoice.currentTime = 0;

                // DOMから削除
                if (this.currentVoice.parentNode) {
                    this.currentVoice.parentNode.removeChild(this.currentVoice);
                }

                this.currentVoice = null;
                this.isVoicePlaying = false;
                console.log('✅ 音声を停止しました');
            } catch (e) {
                console.warn('❌ 音声停止エラー:', e);
            }
        } else {
            console.log('⚠️ 停止する音声がありません（currentVoice is null）');
        }

        // 念のため、全てのaudio要素を強制停止（取りこぼしを防ぐ）
        try {
            const allAudios = document.querySelectorAll('audio');
            let stoppedCount = 0;
            allAudios.forEach((audio) => {
                if (!audio.paused && !audio.src.includes('bgm')) {
                    console.log('🛑 未停止の音声を発見して停止:', audio.src);
                    audio.pause();
                    audio.currentTime = 0;
                    stoppedCount++;
                }
            });
            if (stoppedCount > 0) {
                console.log(`✅ ${stoppedCount}個の追加音声を停止しました`);
            }
        } catch (e) {
            console.warn('❌ 全audio要素の停止エラー:', e);
        }
    }
}

// グローバルインスタンスを作成（game.jsから使用）
window.soundManager = new SoundManager();
