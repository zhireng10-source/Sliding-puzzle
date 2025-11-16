class SaveManager {
    constructor() {
        this.saveData = {};
        this.saveDir = '';
        this.saveFile = '';
        this.initialized = false;

        // NW.js環境チェック
        if (typeof nw !== 'undefined') {
            const path = require('path');
            const fs = require('fs');

            // 実行ファイルのディレクトリを取得
            const execPath = process.execPath;
            const execDir = path.dirname(execPath);

            // saveフォルダのパス
            this.saveDir = path.join(execDir, 'save');
            this.saveFile = path.join(this.saveDir, 'savedata.json');

            // saveフォルダが存在しない場合は作成
            if (!fs.existsSync(this.saveDir)) {
                try {
                    fs.mkdirSync(this.saveDir, { recursive: true });
                    console.log('saveフォルダを作成しました:', this.saveDir);
                } catch (err) {
                    console.error('saveフォルダの作成に失敗しました:', err);
                }
            }

            // 既存のセーブデータを読み込む
            this.loadFromFile();
            this.initialized = true;
        } else {
            // ブラウザ環境ではlocalStorageにフォールバック
            console.warn('NW.js環境ではありません。localStorageを使用します。');
            this.loadFromLocalStorage();
            this.initialized = true;
        }
    }

    loadFromFile() {
        if (typeof nw === 'undefined') return;

        const fs = require('fs');

        try {
            if (fs.existsSync(this.saveFile)) {
                const data = fs.readFileSync(this.saveFile, 'utf8');
                this.saveData = JSON.parse(data);
                console.log('セーブデータを読み込みました:', this.saveFile);
            } else {
                // ファイルが存在しない場合は空のデータで初期化
                this.saveData = {};
                console.log('新しいセーブデータを初期化しました');
            }
        } catch (err) {
            console.error('セーブデータの読み込みに失敗しました:', err);
            this.saveData = {};
        }
    }

    saveToFile() {
        if (typeof nw === 'undefined') return;

        const fs = require('fs');

        try {
            const jsonData = JSON.stringify(this.saveData, null, 2);
            fs.writeFileSync(this.saveFile, jsonData, 'utf8');
            console.log('セーブデータを保存しました:', this.saveFile);
        } catch (err) {
            console.error('セーブデータの保存に失敗しました:', err);
        }
    }

    loadFromLocalStorage() {
        // localStorageからデータを移行
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            this.saveData[key] = value;
        }
        console.log('localStorageからデータを読み込みました');
    }

    setItem(key, value) {
        this.saveData[key] = value;

        if (typeof nw !== 'undefined') {
            this.saveToFile();
        } else {
            // ブラウザ環境ではlocalStorageにも保存
            localStorage.setItem(key, value);
        }
    }

    getItem(key) {
        if (this.saveData.hasOwnProperty(key)) {
            return this.saveData[key];
        }
        return null;
    }

    removeItem(key) {
        delete this.saveData[key];

        if (typeof nw !== 'undefined') {
            this.saveToFile();
        } else {
            // ブラウザ環境ではlocalStorageからも削除
            localStorage.removeItem(key);
        }
    }

    clear() {
        this.saveData = {};

        if (typeof nw !== 'undefined') {
            this.saveToFile();
        } else {
            // ブラウザ環境ではlocalStorageもクリア
            localStorage.clear();
        }
    }

    // セーブファイルのパスを取得（デバッグ用）
    getSaveFilePath() {
        return this.saveFile || 'localStorage (browser)';
    }
}

// グローバルインスタンスを作成
window.saveManager = new SaveManager();
