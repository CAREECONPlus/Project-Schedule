# Project-Schedule

# 建設業工程管理ツール - ファイル構成

## 基本ファイル構成（MVP版）

```
construction-manager/
├── index.html              # メインページ（案件一覧・ダッシュボード）
├── project-detail.html     # 案件詳細ページ
├── site-management.html    # 現場管理ページ
├── gantt-chart.html        # 工程スケジュール（簡易ガントチャート）
├── css/
│   ├── reset.css           # CSSリセット
│   ├── common.css          # 共通スタイル
│   ├── dashboard.css       # ダッシュボード専用スタイル
│   ├── project-detail.css  # 案件詳細専用スタイル
│   ├── site-management.css # 現場管理専用スタイル
│   └── gantt-chart.css     # ガントチャート専用スタイル
├── js/
│   ├── app.js              # アプリケーションのメイン処理
│   ├── data-manager.js     # データ管理（localStorage操作）
│   ├── project-handler.js  # 案件関連の処理
│   ├── status-manager.js   # ステータス管理・自動起票機能
│   └── utils.js            # 共通ユーティリティ関数
├── data/
│   └── sample-data.json    # サンプルデータ（開発用）
└── README.md               # 開発・運用ドキュメント
```

## 各ファイルの役割詳細

### HTMLファイル
- **index.html**: 案件一覧ダッシュボード（全案件のステータス表示）
- **project-detail.html**: 案件詳細画面（案件情報編集・ステータス更新）
- **site-management.html**: 現場管理画面（受注以降の案件のみ表示）
- **gantt-chart.html**: 工程スケジュール表示（簡易ガントチャート）

### CSSファイル
- **reset.css**: ブラウザ標準スタイルのリセット
- **common.css**: 全体共通のスタイル（ヘッダー、フッター、ボタン等）
- **各画面専用CSS**: 画面固有のスタイル定義

### JavaScriptファイル
- **app.js**: アプリケーション全体の初期化・共通処理
- **data-manager.js**: データの保存・読み込み（localStorage管理）
- **project-handler.js**: 案件の追加・更新・削除処理
- **status-manager.js**: ステータス変更・自動起票処理
- **utils.js**: 日付フォーマット・バリデーション等の共通関数

## 段階的開発の順序

### Phase 1: 基本構造の構築
1. HTMLの基本構造作成
2. CSS共通スタイルの定義
3. データ構造の設計（JSON形式）

### Phase 2: 案件管理機能の実装
1. 案件一覧表示機能
2. 案件詳細表示・編集機能
3. ステータス更新機能

### Phase 3: 自動起票・現場管理機能
1. 受注時の自動起票機能
2. 現場管理画面の実装
3. 工程スケジュール表示

### Phase 4: UI/UX改善
1. レスポンシブデザイン対応
2. 操作性の向上
3. エラーハンドリングの強化

## Firebase移行時の拡張ポイント

将来的なFirebase移行を考慮した設計：

- **data-manager.js**: Firebase Firestore接続に容易に変更可能
- **status-manager.js**: Cloud Functions連携に対応
- **認証機能**: Firebase Authentication追加時の受け皿
- **リアルタイム更新**: Firestore onSnapshotに対応

## 注意点

1. **シンプルさの維持**: 中小企業向けのため、直感的な操作性を重視
2. **段階的開発**: 一度に全機能を実装せず、段階的に機能追加
3. **拡張性**: Firebase移行を見据えた柔軟な設計
4. **データ管理**: 初期はlocalStorageで十分、後にFirestore移行

この構成で開発を進めることで、MVPとして必要な機能を段階的に実装しながら、将来的な拡張にも対応できる基盤を構築できます。
