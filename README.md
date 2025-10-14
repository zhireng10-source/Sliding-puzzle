# スライドパズルゲーム

3×3、4×4、5×5のスライドパズルゲームです。各サイズで第1問から第10問まで、合計30問の問題を楽しめます。

## 特徴

- 3つのサイズ（3×3、4×4、5×5）のスライドパズル
- 各サイズで10問ずつ、合計30問の問題
- 問題ごとに異なる画像を使用
- タイマー機能付き
- レスポンシブデザイン

## ゲームの流れ

1. **タイトル画面** - スタートボタンを押してゲーム開始
2. **サイズ選択画面** - 3×3、4×4、5×5から選択
3. **問題選択画面** - 第1問〜第10問から選択
4. **ゲーム画面** - パズルを解く
5. **クリア画面** - クリア時間の表示と再挑戦・問題選択への移動

## 画像ファイルの配置

ゲームで使用する画像ファイルは以下の構造で配置してください：

```
assets/img/
├── 3x3/
│   ├── problem1.jpg
│   ├── problem2.jpg
│   ├── problem3.jpg
│   ├── problem4.jpg
│   ├── problem5.jpg
│   ├── problem6.jpg
│   ├── problem7.jpg
│   ├── problem8.jpg
│   ├── problem9.jpg
│   └── problem10.jpg
├── 4x4/
│   ├── problem1.jpg
│   ├── problem2.jpg
│   ├── problem3.jpg
│   ├── problem4.jpg
│   ├── problem5.jpg
│   ├── problem6.jpg
│   ├── problem7.jpg
│   ├── problem8.jpg
│   ├── problem9.jpg
│   └── problem10.jpg
├── 5x5/
│   ├── problem1.jpg
│   ├── problem2.jpg
│   ├── problem3.jpg
│   ├── problem4.jpg
│   ├── problem5.jpg
│   ├── problem6.jpg
│   ├── problem7.jpg
│   ├── problem8.jpg
│   ├── problem9.jpg
│   └── problem10.jpg
├── puzzle3x3.jpg (フォールバック画像)
├── puzzle4x4.jpg (フォールバック画像)
└── puzzle5x5.jpg (フォールバック画像)
```

### 画像の仕様

- **ファイル形式**: JPG形式を推奨
- **画像サイズ**:
  - 3×3用: 300×300px
  - 4×4用: 320×320px
  - 5×5用: 350×350px
- **内容**: パズルに適した画像（風景、イラスト、写真など）

### フォールバック画像

各サイズ用のフォールバック画像（`puzzle3x3.jpg`, `puzzle4x4.jpg`, `puzzle5x5.jpg`）は、問題別画像が見つからない場合に使用されます。

## ファイル構成

```
/
├── index.html          # メインHTMLファイル
├── css/
│   └── style.css      # スタイルシート
├── js/
│   └── game.js        # ゲームロジック
├── assets/
│   └── img/           # 画像ファイル
└── README.md          # このファイル
```

## 使用方法

1. Webブラウザで `index.html` を開く
2. 画像ファイルを指定の場所に配置
3. ゲームを楽しむ

## 技術仕様

- HTML5
- CSS3 (Grid Layout, Flexbox)
- JavaScript (ES6+)
- レスポンシブWebデザイン

## ブラウザ対応

- Chrome (推奨)
- Firefox
- Safari
- Edge