/**
 * app.js - アプリケーションメインクラス
 * 全体的な初期化、統合、共通処理を管理
 */

class App {
    constructor() {
        this.initialized = false;
        this.currentUser = null;
        this.notifications = [];
        this.intervalIds = [];
        
        debugLog('App constructor called');
    }

    // =========================================================================
    // アプリケーション初期化
    // =========================================================================

    /**
     * アプリケーション全体を初期化
     */
    initialize() {
        if (this.initialized) {
            debugLog('App already initialized, skipping');
            return;
        }

        try {
            // 基本初期化
            this.initializeCore();
            
            // ユーザー設定読み込み
            this.loadUserSettings();
            
            // UI初期化
            this.initializeUI();
            
            // イベントリスナー設定
            this.setupGlobalEventListeners();
            
            // 定期処理開始
            this.startPeriodicTasks();
            
            // ページ固有の初期化
            this.initializeCurrentPage();
            
            this.initialized = true;
            debugLog('App initialized successfully');
            
            // 初期化完了通知
            this.showWelcomeMessage();
            
        } catch (error) {
            errorLog('App initialization failed', error);
            this.showInitializationError();
        }
    }

    /**
     * 基本的なコア機能を初期化
     */
    initializeCore() {
        // デバッグモードの設定
        window.DEBUG_MODE = window.location.hostname === 'localhost' || 
                           window.location.search.includes('debug=true');

        // エラーハンドリング設定
        this.setupErrorHandling();
        
        // サービスワーカー登録（PWA対応の準備）
        this.registerServiceWorker();
        
        debugLog('Core initialization completed');
    }

    /**
     * ユーザー設定を読み込み
     */
    loadUserSettings() {
        const settings = dataManager.getSettings();
        this.currentUser = settings.currentUser || this.getCurrentUser();
        
        // テーマ設定
        this.applyTheme(settings.theme || 'default');
        
        // 言語設定
        this.setLanguage(settings.language || 'ja');
        
        debugLog('User settings loaded', { user: this.currentUser, theme: settings.theme });
    }

    /**
     * UI全体を初期化
     */
    initializeUI() {
        // ローディング状態の管理
        this.hideLoadingSpinner();
        
        // 通知の初期化
        this.initializeNotifications();
        
        // ショートカットキーの設定
        this.setupKeyboardShortcuts();
        
        // レスポンシブ対応
        this.setupResponsiveHandlers();
        
        debugLog('UI initialization completed');
    }

    /**
     * 現在のページを初期化
     */
    initializeCurrentPage() {
        const currentPage = this.getCurrentPageName();
        
        switch (currentPage) {
            case 'index':
                this.initializeDashboard();
                break;
            case 'project-detail':
                this.initializeProjectDetail();
                break;
            case 'site-management':
                this.initializeSiteManagement();
                break;
            case 'gantt-chart':
                this.initializeGanttChart();
                break;
            default:
                debugLog('Unknown page, using default initialization');
        }
    }

    // =========================================================================
    // ページ別初期化
    // =========================================================================

    /**
     * ダッシュボードを初期化
     */
    initializeDashboard() {
        debugLog('Initializing dashboard');
        
        // ProjectHandlerの初期化
        if (typeof projectHandler !== 'undefined') {
            projectHandler.initializeDashboard();
        }
        
        // アラート表示
        this.displayDashboardAlerts();
        
        // 下書き復元
        projectHandler.restoreDraft('addProjectForm');
        
        // ダッシュボード固有のイベント
        this.setupDashboardEvents();
    }

    /**
     * 案件詳細ページを初期化
     */
    initializeProjectDetail() {
        const projectId = this.getProjectIdFromUrl();
        
        if (!projectId) {
            projectHandler.showToast('案件IDが指定されていません', 'error');
            window.location.href = 'index.html';
            return;
        }
        
        debugLog('Initializing project detail', { projectId });
        
        // ProjectHandlerの初期化
        if (typeof projectHandler !== 'undefined') {
            projectHandler.loadProjectDetail(projectId);
        }
        
        // StatusManagerの初期化
        this.setupProjectDetailStatusManager(projectId);
        
        // 案件詳細固有のイベント
        this.setupProjectDetailEvents(projectId);
    }

    /**
     * 現場管理ページを初期化
     */
    initializeSiteManagement() {
        debugLog('Initializing site management');
        
        // 現場管理データの読み込み
        this.loadSiteManagementData();
        
        // 現場管理固有のイベント
        this.setupSiteManagementEvents();
        
        // 通知チェック
        this.checkSiteNotifications();
    }

    /**
     * ガントチャートページを初期化
     */
    initializeGanttChart() {
        debugLog('Initializing gantt chart');
        
        // ガントチャートの描画
        this.renderGanttChart();
        
        // ガントチャート固有のイベント
        this.setupGanttChartEvents();
    }

    // =========================================================================
    // イベントリスナー設定
    // =========================================================================

    /**
     * グローバルイベントリスナーを設定
     */
    setupGlobalEventListeners() {
        // ウィンドウイベント
        window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e));
        window.addEventListener('online', () => this.handleOnlineStatusChange(true));
        window.addEventListener('offline', () => this.handleOnlineStatusChange(false));
        window.addEventListener('resize', () => this.handleWindowResize());
        
        // フォーカスイベント
        window.addEventListener('focus', () => this.handleWindowFocus());
        window.addEventListener('blur', () => this.handleWindowBlur());
        
        // エラーイベント
        window.addEventListener('error', (e) => this.handleGlobalError(e));
        window.addEventListener('unhandledrejection', (e) => this.handleUnhandledRejection(e));
        
        debugLog('Global event listeners set up');
    }

    /**
     * ダッシュボード固有のイベント設定
     */
    setupDashboardEvents() {
        // エクスポートボタン
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.showExportOptions();
            });
        }
        
        // 統計更新
        this.scheduleStatsUpdate();
    }

    /**
     * 案件詳細固有のイベント設定
     */
    setupProjectDetailEvents(projectId) {
        // ステータス変更ボタン
        const changeStatusBtn = document.getElementById('changeStatusBtn');
        if (changeStatusBtn) {
            changeStatusBtn.addEventListener('click', () => {
                statusManager.initializeStatusChangeModal(projectId);
                projectHandler.openModal('statusChangeModal');
            });
        }
        
        // 編集ボタン
        const editBtn = document.getElementById('editProjectBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                projectHandler.editProject(projectId);
            });
        }
        
        // 削除ボタン
        const deleteBtn = document.getElementById('deleteProjectBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                projectHandler.confirmDeleteProject(projectId);
            });
        }
    }

    /**
     * 案件詳細のステータス管理を設定
     */
    setupProjectDetailStatusManager(projectId) {
        // ステータス変更コールバックを追加
        statusManager.addStatusChangeCallback((project, newStatus) => {
            // ページタイトル更新
            document.title = `${project.name} - 案件詳細`;
            
            // URL更新（必要に応じて）
            if (window.history && window.history.replaceState) {
                window.history.replaceState(null, document.title, `project-detail.html?id=${project.id}`);
            }
        });
    }

    /**
     * 現場管理固有のイベント設定
     */
    setupSiteManagementEvents() {
        // 更新ボタン
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshSiteManagementData();
            });
        }
        
        // 表示切り替え
        const toggleBtns = document.querySelectorAll('.toggle-btn');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleViewToggle(e.target.dataset.view);
            });
        });
    }

    /**
     * ガントチャート固有のイベント設定
     */
    setupGanttChartEvents() {
        // 今日ボタン
        const todayBtn = document.getElementById('todayBtn');
        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                this.scrollGanttToToday();
            });
        }
        
        // エクスポートボタン
        const exportGanttBtn = document.getElementById('exportGanttBtn');
        if (exportGanttBtn) {
            exportGanttBtn.addEventListener('click', () => {
                this.exportGanttChart();
            });
        }
    }

    // =========================================================================
    // 通知システム
    // =========================================================================

    /**
     * 通知システムを初期化
     */
    initializeNotifications() {
        // 通知権限をリクエスト
        this.requestNotificationPermission();
        
        // 既存の通知を読み込み
        this.loadNotifications();
        
        // 通知チェックを定期実行
        this.scheduleNotificationCheck();
        
        debugLog('Notifications initialized');
    }

    /**
     * 通知権限をリクエスト
     */
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            debugLog('Notification permission:', permission);
        }
    }

    /**
     * 通知を読み込み
     */
    loadNotifications() {
        this.notifications = statusManager.getNotifications(this.currentUser);
        this.updateNotificationUI();
    }

    /**
     * 通知UIを更新
     */
    updateNotificationUI() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        
        // 通知バッジを更新
        const notificationBadge = document.querySelector('.notification-badge');
        if (notificationBadge) {
            notificationBadge.textContent = unreadCount > 0 ? unreadCount : '';
            notificationBadge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
        
        // 通知リストを更新
        this.renderNotificationList();
    }

    /**
     * ダッシュボードアラートを表示
     */
    displayDashboardAlerts() {
        const alerts = statusManager.getDeadlineAlerts();
        const recommendations = statusManager.getStatusChangeRecommendations();
        
        // 重要なアラートのみトースト表示
        const criticalAlerts = alerts.filter(alert => alert.priority === 'critical');
        criticalAlerts.slice(0, 3).forEach(alert => {
            projectHandler.showToast(
                `⚠️ ${alert.projectName}: ${alert.message}`,
                'warning'
            );
        });
        
        debugLog('Dashboard alerts displayed', { alerts: alerts.length, recommendations: recommendations.length });
    }

    // =========================================================================
    // データ管理
    // =========================================================================

    /**
     * 現場管理データを読み込み
     */
    loadSiteManagementData() {
        try {
            const siteProjects = dataManager.getSiteManagementProjects();
            this.renderSiteManagementProjects(siteProjects);
            this.updateSiteManagementStats(siteProjects);
            
            debugLog('Site management data loaded', { count: siteProjects.length });
            
        } catch (error) {
            errorLog('Failed to load site management data', error);
            projectHandler.showToast('現場データの読み込みに失敗しました', 'error');
        }
    }

    /**
     * 現場管理データを更新
     */
    refreshSiteManagementData() {
        projectHandler.showToast('データを更新中...', 'info');
        
        // 少し遅延させてリアルな感じを演出
        setTimeout(() => {
            this.loadSiteManagementData();
            projectHandler.showToast('データを更新しました', 'success');
        }, 500);
    }

    /**
     * 現場管理プロジェクトを描画
     */
    renderSiteManagementProjects(projects) {
        const gridContainer = document.getElementById('sitesGrid');
        const tableBody = document.getElementById('sitesTableBody');
        
        if (projects.length === 0) {
            this.showSiteManagementEmptyState();
            return;
        }
        
        // カード表示
        if (gridContainer) {
            gridContainer.innerHTML = projects.map(project => 
                this.createSiteCard(project)
            ).join('');
        }
        
        // テーブル表示
        if (tableBody) {
            tableBody.innerHTML = projects.map(project => 
                this.createSiteTableRow(project)
            ).join('');
        }
    }

    /**
     * 現場カードを作成
     */
    createSiteCard(project) {
        const urgencyClass = this.getUrgencyClass(project);
        const progressPercent = project.progress || 0;
        
        return `
            <div class="site-card ${urgencyClass}" onclick="siteHandler.showSiteDetail('${project.id}')">
                <div class="site-card-header">
                    <div class="site-title">
                        <h3 class="site-name">${project.name}</h3>
                        <span class="site-urgency ${urgencyClass}">${this.getUrgencyLabel(project)}</span>
                    </div>
                    <div class="site-client">顧客: ${project.client.name}</div>
                    <div class="site-manager">現場管理者: ${project.assignedTo.siteManager || '-'}</div>
                </div>
                <div class="site-card-body">
                    <div class="site-progress">
                        <div class="progress-header">
                            <span class="progress-label">進捗</span>
                            <span class="progress-percentage">${progressPercent}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>
                    <div class="site-schedule">
                        <div class="schedule-item">
                            <span class="schedule-label">着工予定</span>
                            <span class="schedule-date">${formatDateJP(project.schedule.startDate)}</span>
                        </div>
                        <div class="schedule-item">
                            <span class="schedule-label">完了予定</span>
                            <span class="schedule-date">${formatDateJP(project.schedule.endDate)}</span>
                        </div>
                    </div>
                </div>
                <div class="site-card-footer">
                    <span class="status-badge ${projectHandler.getStatusClass(project.status.current)}">
                        ${project.status.current}
                    </span>
                    <div class="site-actions">
                        <button class="site-action-btn" onclick="event.stopPropagation(); statusManager.initializeStatusChangeModal('${project.id}')">
                            更新
                        </button>
                        <button class="site-action-btn primary" onclick="event.stopPropagation(); projectHandler.viewProject('${project.id}')">
                            詳細
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 現場管理統計を更新
     */
    updateSiteManagementStats(projects) {
        const stats = {
            pending: projects.filter(p => p.status.current === '施工前').length,
            active: projects.filter(p => p.status.current === '施工中').length,
            urgent: projects.filter(p => this.getUrgencyClass(p) === 'urgent').length,
            completed: projects.filter(p => ['施工完了', '案件完了'].includes(p.status.current)).length
        };
        
        setElementText('#pendingCount', stats.pending);
        setElementText('#activeCount', stats.active);
        setElementText('#urgentCount', stats.urgent);
        setElementText('#completedCount', stats.completed);
    }

    // =========================================================================
    // ガントチャート
    // =========================================================================

    /**
     * ガントチャートを描画
     */
    renderGanttChart() {
        try {
            const projects = this.getGanttProjects();
            const dateRange = this.getGanttDateRange();
            
            this.renderGanttSidebar(projects);
            this.renderGanttTimeline(projects, dateRange);
            this.renderGanttBars(projects, dateRange);
            this.updateGanttStats(projects);
            
            debugLog('Gantt chart rendered', { projects: projects.length });
            
        } catch (error) {
            errorLog('Failed to render gantt chart', error);
            this.showGanttChartError();
        }
    }

    /**
     * ガントチャート用プロジェクトを取得
     */
    getGanttProjects() {
        const startDate = document.getElementById('startDate')?.value;
        const endDate = document.getElementById('endDate')?.value;
        const statusFilter = document.getElementById('ganttFilter')?.value;
        
        return dataManager.searchProjects({
            startDate,
            endDate,
            status: statusFilter
        }).filter(project => 
            project.schedule.startDate && project.schedule.endDate
        );
    }

    /**
     * ガントチャートの日付範囲を取得
     */
    getGanttDateRange() {
        const startInput = document.getElementById('startDate');
        const endInput = document.getElementById('endDate');
        
        const startDate = startInput?.value ? new Date(startInput.value) : getMonthStart();
        const endDate = endInput?.value ? new Date(endInput.value) : addDays(60);
        
        return { startDate, endDate };
    }

    // =========================================================================
    // ユーティリティ
    // =========================================================================

    /**
     * 現在のページ名を取得
     */
    getCurrentPageName() {
        const path = window.location.pathname.split('/').pop();
        return path.replace('.html', '') || 'index';
    }

    /**
     * URLから案件IDを取得
     */
    getProjectIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    /**
     * 現在のユーザーを取得
     */
    getCurrentUser() {
        // 実際の実装では認証システムから取得
        return '山田花子';
    }

    /**
     * 緊急度クラスを取得
     */
    getUrgencyClass(project) {
        if (!project.schedule.endDate) return 'normal';
        
        const endDate = new Date(project.schedule.endDate);
        const today = new Date();
        const daysLeft = calculateDaysDifference(today, endDate);
        
        if (daysLeft < 0) return 'urgent'; // 遅延
        if (daysLeft <= 3) return 'urgent'; // 3日以内
        if (daysLeft <= 7) return 'attention'; // 1週間以内
        
        return 'normal';
    }

    /**
     * 緊急度ラベルを取得
     */
    getUrgencyLabel(project) {
        const urgencyClass = this.getUrgencyClass(project);
        const labels = {
            urgent: '緊急',
            attention: '要注意',
            normal: '通常'
        };
        return labels[urgencyClass] || '通常';
    }

    /**
     * テーマを適用
     */
    applyTheme(theme) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme}`);
        debugLog('Theme applied', theme);
    }

    /**
     * 言語を設定
     */
    setLanguage(language) {
        document.documentElement.lang = language;
        debugLog('Language set', language);
    }

    // =========================================================================
    // エラーハンドリング
    // =========================================================================

    /**
     * エラーハンドリングを設定
     */
    setupErrorHandling() {
        // グローバルエラーハンドラー
        window.onerror = (message, source, lineno, colno, error) => {
            this.handleGlobalError({ message, source, lineno, colno, error });
            return true;
        };
    }

    /**
     * グローバルエラーを処理
     */
    handleGlobalError(errorEvent) {
        errorLog('Global error caught', errorEvent);
        
        // ユーザーには分かりやすいメッセージを表示
        if (!window.DEBUG_MODE) {
            projectHandler.showToast('予期しないエラーが発生しました', 'error');
        }
    }

    /**
     * 未処理のPromise拒否を処理
     */
    handleUnhandledRejection(event) {
        errorLog('Unhandled promise rejection', event.reason);
        event.preventDefault();
    }

    /**
     * 初期化エラーを表示
     */
    showInitializationError() {
        const errorHtml = `
            <div class="init-error">
                <h2>⚠️ 初期化エラー</h2>
                <p>アプリケーションの初期化に失敗しました。</p>
                <button onclick="location.reload()">再読み込み</button>
            </div>
        `;
        
        document.body.innerHTML = errorHtml;
    }

    // =========================================================================
    // 定期処理
    // =========================================================================

    /**
     * 定期処理を開始
     */
    startPeriodicTasks() {
        // 5分ごとに通知チェック
        const notificationInterval = setInterval(() => {
            this.checkNotifications();
        }, 5 * 60 * 1000);
        
        // 1時間ごとにデータ同期（将来のFirebase連携用）
        const syncInterval = setInterval(() => {
            this.syncData();
        }, 60 * 60 * 1000);
        
        this.intervalIds.push(notificationInterval, syncInterval);
        
        debugLog('Periodic tasks started');
    }

    /**
     * 通知をチェック
     */
    checkNotifications() {
        this.loadNotifications();
        this.checkSiteNotifications();
    }

    /**
     * 現場通知をチェック
     */
    checkSiteNotifications() {
        const alerts = statusManager.getDeadlineAlerts();
        const criticalAlerts = alerts.filter(alert => alert.priority === 'critical');
        
        // 重要な通知があればデスクトップ通知
        if (criticalAlerts.length > 0 && Notification.permission === 'granted') {
            criticalAlerts.slice(0, 1).forEach(alert => {
                new Notification(`${alert.projectName}`, {
                    body: alert.message,
                    icon: '/favicon.ico'
                });
            });
        }
    }

    /**
     * データ同期（将来のFirebase連携用）
     */
    syncData() {
        debugLog('Data sync executed (placeholder)');
        // 将来的にFirebaseとの同期処理を実装
    }

    /**
     * ウェルカムメッセージを表示
     */
    showWelcomeMessage() {
        const lastLogin = getLocalStorage('last_login');
        const today = formatDate(new Date());
        
        if (lastLogin !== today) {
            projectHandler.showToast(
                `おはようございます、${this.currentUser}さん！`,
                'info'
            );
            setLocalStorage('last_login', today);
        }
    }

    /**
     * ローディングスピナーを非表示
     */
    hideLoadingSpinner() {
        const spinner = document.querySelector('.loading-spinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    }

    /**
     * キーボードショートカットを設定
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+N: 新規案件追加
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                const addBtn = document.getElementById('addProjectBtn');
                if (addBtn) addBtn.click();
            }
            
            // Ctrl+F: 検索にフォーカス
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) searchInput.focus();
            }
        });
    }

    /**
     * レスポンシブハンドラーを設定
     */
    setupResponsiveHandlers() {
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        mediaQuery.addListener((mq) => {
            this.handleResponsiveChange(mq.matches);
        });
        
        // 初期チェック
        this.handleResponsiveChange(mediaQuery.matches);
    }

    /**
     * レスポンシブ変更を処理
     */
    handleResponsiveChange(isMobile) {
        document.body.classList.toggle('mobile-view', isMobile);
        debugLog('Responsive change', { isMobile });
    }

    /**
     * ウィンドウリサイズを処理
     */
    handleWindowResize() {
        // ガントチャートなどの再描画が必要な場合
        if (this.getCurrentPageName() === 'gantt-chart') {
            this.renderGanttChart();
        }
    }

    /**
     * ページ離脱前の処理
     */
    handleBeforeUnload(event) {
        // 未保存の変更があるかチェック
        const hasUnsavedChanges = this.checkUnsavedChanges();
        
        if (hasUnsavedChanges) {
            event.preventDefault();
            event.returnValue = '未保存の変更があります。本当にページを離れますか？';
            return event.returnValue;
        }
    }

    /**
     * 未保存の変更をチェック
     */
    checkUnsavedChanges() {
        // フォームの変更状態をチェック
        const forms = document.querySelectorAll('form');
        return Array.from(forms).some(form => form.classList.contains('modified'));
    }

    /**
     * オンライン状態の変更を処理
     */
    handleOnlineStatusChange(isOnline) {
        if (isOnline) {
            projectHandler.showToast('オンラインに復帰しました', 'success');
            this.syncData();
        } else {
            projectHandler.showToast('オフラインになりました', 'warning');
        }
    }

    /**
     * ウィンドウフォーカス時の処理
     */
    handleWindowFocus() {
        // 通知を更新
        this.checkNotifications();
    }

    /**
     * ウィンドウブラー時の処理
     */
    handleWindowBlur() {
        // 自動保存など
        this.autoSave();
    }

    /**
     * 自動保存
     */
    autoSave() {
        // 現在のフォーム状態を保存
        const activeForm = document.querySelector('form.active');
        if (activeForm && projectHandler) {
            projectHandler.saveDraft(activeForm);
        }
    }

    /**
     * サービスワーカーを登録
     */
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(() => {
                debugLog('Service worker registered');
            }).catch(error => {
                debugLog('Service worker registration failed', error);
            });
        }
    }

    /**
     * アプリケーションを終了
     */
    destroy() {
        // 定期処理を停止
        this.intervalIds.forEach(id => clearInterval(id));
        this.intervalIds = [];
        
        // イベントリスナーを削除
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
        window.removeEventListener('online', this.handleOnlineStatusChange);
        window.removeEventListener('offline', this.handleOnlineStatusChange);
        
        // 最終的な自動保存
        this.autoSave();
        
        this.initialized = false;
        debugLog('App destroyed');
    }

    // =========================================================================
    // エクスポート・インポート
    // =========================================================================

    /**
     * エクスポートオプションを表示
     */
    showExportOptions() {
        const options = [
            { label: 'CSV形式でエクスポート', action: () => projectHandler.exportProjectsCSV() },
            { label: 'JSON形式でエクスポート', action: () => projectHandler.exportProjectsJSON() },
            { label: 'ガントチャートをエクスポート', action: () => this.exportGanttChart() }
        ];

        // 簡易的なオプション選択ダイアログ
        const choice = prompt(
            'エクスポート形式を選択してください:\n' +
            options.map((opt, i) => `${i + 1}. ${opt.label}`).join('\n')
        );

        const index = parseInt(choice) - 1;
        if (index >= 0 && index < options.length) {
            options[index].action();
        }
    }

    /**
     * ガントチャートをエクスポート
     */
    exportGanttChart() {
        try {
            // SVGまたはPNG形式でエクスポート（簡易実装）
            const ganttContainer = document.querySelector('.gantt-container');
            if (!ganttContainer) {
                projectHandler.showToast('ガントチャートが見つかりません', 'error');
                return;
            }

            // html2canvasライブラリがあれば使用、なければ警告
            if (typeof html2canvas !== 'undefined') {
                html2canvas(ganttContainer).then(canvas => {
                    const link = document.createElement('a');
                    link.download = `ガントチャート_${formatDate(new Date())}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                });
            } else {
                projectHandler.showToast('エクスポート機能は開発中です', 'info');
            }

        } catch (error) {
            errorLog('Failed to export gantt chart', error);
            projectHandler.showToast('ガントチャートのエクスポートに失敗しました', 'error');
        }
    }

    // =========================================================================
    // UI ヘルパーメソッド
    // =========================================================================

    /**
     * 現場管理の空の状態を表示
     */
    showSiteManagementEmptyState() {
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.style.display = 'block';
        }
    }

    /**
     * 現場テーブル行を作成
     */
    createSiteTableRow(project) {
        const progressPercent = project.progress || 0;
        const urgencyClass = this.getUrgencyClass(project);
        
        return `
            <tr onclick="siteHandler.showSiteDetail('${project.id}')">
                <td>${project.name}</td>
                <td>${project.client.name}</td>
                <td>${project.assignedTo.siteManager || '-'}</td>
                <td>${formatDateJP(project.schedule.startDate)} 〜 ${formatDateJP(project.schedule.endDate)}</td>
                <td>
                    <div class="table-progress">
                        <div class="table-progress-bar">
                            <div class="table-progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <span class="table-progress-text">${progressPercent}%</span>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${projectHandler.getStatusClass(project.status.current)}">
                        ${project.status.current}
                    </span>
                </td>
                <td>
                    <span class="table-urgency ${urgencyClass}">${this.getUrgencyLabel(project)}</span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="table-action-btn view" onclick="event.stopPropagation(); projectHandler.viewProject('${project.id}')">
                            詳細
                        </button>
                        <button class="table-action-btn update" onclick="event.stopPropagation(); statusManager.initializeStatusChangeModal('${project.id}')">
                            更新
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * 表示切り替えを処理
     */
    handleViewToggle(view) {
        const toggleBtns = document.querySelectorAll('.toggle-btn');
        toggleBtns.forEach(btn => btn.classList.remove('active'));
        
        const activeBtn = document.querySelector(`[data-view="${view}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        const gridContainer = document.getElementById('sitesGrid');
        const listContainer = document.getElementById('sitesList');

        if (view === 'cards') {
            if (gridContainer) gridContainer.style.display = 'grid';
            if (listContainer) listContainer.style.display = 'none';
        } else {
            if (gridContainer) gridContainer.style.display = 'none';
            if (listContainer) listContainer.style.display = 'block';
        }
    }

    /**
     * ガントチャートサイドバーを描画
     */
    renderGanttSidebar(projects) {
        const sidebar = document.getElementById('ganttSidebar');
        if (!sidebar) return;

        const sidebarHTML = projects.map(project => `
            <div class="project-row" data-project-id="${project.id}">
                <div class="project-cell project-name" title="${project.name}">
                    ${truncateString(project.name, 15)}
                </div>
                <div class="project-cell manager" title="${project.assignedTo.siteManager || '-'}">
                    ${truncateString(project.assignedTo.siteManager || '-', 8)}
                </div>
                <div class="project-cell status">
                    <span class="status-badge ${projectHandler.getStatusClass(project.status.current)}">
                        ${project.status.current}
                    </span>
                </div>
            </div>
        `).join('');

        sidebar.innerHTML = sidebarHTML;
    }

    /**
     * ガントチャートタイムラインを描画
     */
    renderGanttTimeline(projects, dateRange) {
        const header = document.getElementById('chartHeader');
        if (!header) return;

        const { startDate, endDate } = dateRange;
        const timeScale = document.getElementById('timeScale')?.value || 'weeks';
        
        let headerHTML = '';
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
            const isToday = formatDate(currentDate) === formatDate(new Date());
            
            let dateLabel = '';
            if (timeScale === 'days') {
                dateLabel = `${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
                currentDate.setDate(currentDate.getDate() + 1);
            } else if (timeScale === 'weeks') {
                dateLabel = `${currentDate.getMonth() + 1}月第${Math.ceil(currentDate.getDate() / 7)}週`;
                currentDate.setDate(currentDate.getDate() + 7);
            } else {
                dateLabel = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
                currentDate.setMonth(currentDate.getMonth() + 1);
            }

            headerHTML += `
                <div class="date-column ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}">
                    ${dateLabel}
                </div>
            `;
        }

        header.innerHTML = headerHTML;
    }

    /**
     * ガントチャートバーを描画
     */
    renderGanttBars(projects, dateRange) {
        const chartBody = document.getElementById('chartBody');
        if (!chartBody) return;

        const { startDate, endDate } = dateRange;
        const totalDays = calculateDaysDifference(startDate, endDate);

        const chartHTML = projects.map(project => {
            const projectStart = new Date(project.schedule.startDate);
            const projectEnd = new Date(project.schedule.endDate);
            
            // プロジェクトの表示範囲内での位置とサイズを計算
            const startOffset = Math.max(0, calculateDaysDifference(startDate, projectStart));
            const endOffset = Math.min(totalDays, calculateDaysDifference(startDate, projectEnd));
            const barWidth = ((endOffset - startOffset) / totalDays) * 100;
            const barLeft = (startOffset / totalDays) * 100;

            return `
                <div class="gantt-row" data-project-id="${project.id}">
                    <div class="gantt-bar ${this.getGanttBarClass(project.status.current)}" 
                         style="left: ${barLeft}%; width: ${barWidth}%;"
                         onclick="projectHandler.viewProject('${project.id}')"
                         title="${project.name} (${project.status.current})">
                        ${truncateString(project.name, 20)}
                    </div>
                </div>
            `;
        }).join('');

        chartBody.innerHTML = chartHTML;

        // 今日の線を更新
        this.updateTodayLine(dateRange);
    }

    /**
     * ガントバーのクラスを取得
     */
    getGanttBarClass(status) {
        const statusMap = {
            '見積': 'estimate',
            '受注': 'order',
            '施工前': 'pre-construction',
            '施工中': 'construction',
            '施工完了': 'completed',
            '案件完了': 'completed'
        };
        return statusMap[status] || 'estimate';
    }

    /**
     * 今日の線を更新
     */
    updateTodayLine(dateRange) {
        const todayLine = document.getElementById('todayLine');
        if (!todayLine) return;

        const { startDate, endDate } = dateRange;
        const today = new Date();
        
        if (today >= startDate && today <= endDate) {
            const totalDays = calculateDaysDifference(startDate, endDate);
            const todayOffset = calculateDaysDifference(startDate, today);
            const leftPercent = (todayOffset / totalDays) * 100;
            
            todayLine.style.left = `${leftPercent}%`;
            todayLine.style.display = 'block';
        } else {
            todayLine.style.display = 'none';
        }
    }

    /**
     * ガントチャートを今日にスクロール
     */
    scrollGanttToToday() {
        const todayLine = document.getElementById('todayLine');
        if (todayLine && todayLine.style.display !== 'none') {
            todayLine.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        } else {
            projectHandler.showToast('今日の日付が表示範囲にありません', 'info');
        }
    }

    /**
     * ガントチャート統計を更新
     */
    updateGanttStats(projects) {
        const stats = {
            total: projects.length,
            active: projects.filter(p => ['施工前', '施工中'].includes(p.status.current)).length,
            upcoming: projectHandler.getUpcomingDeadlines(7).length,
            delayed: projectHandler.getDelayedProjects().length
        };

        setElementText('#totalProjects', stats.total);
        setElementText('#activeProjects', stats.active);
        setElementText('#upcomingDeadlines', stats.upcoming);
        setElementText('#delayedProjects', stats.delayed);
    }

    /**
     * ガントチャートエラーを表示
     */
    showGanttChartError() {
        const chartBody = document.getElementById('chartBody');
        if (chartBody) {
            chartBody.innerHTML = `
                <div class="gantt-error">
                    <h3>⚠️ ガントチャートの表示でエラーが発生しました</h3>
                    <p>データを確認して再試行してください</p>
                    <button class="btn btn-primary" onclick="app.renderGanttChart()">再試行</button>
                </div>
            `;
        }
    }

    /**
     * 統計更新をスケジュール
     */
    scheduleStatsUpdate() {
        // 5分ごとに統計を更新
        const statsInterval = setInterval(() => {
            if (this.getCurrentPageName() === 'index') {
                projectHandler.updateSummaryCards();
            }
        }, 5 * 60 * 1000);
        
        this.intervalIds.push(statsInterval);
    }

    /**
     * 通知チェックをスケジュール
     */
    scheduleNotificationCheck() {
        // 1分ごとに通知をチェック
        const notificationInterval = setInterval(() => {
            this.checkNotifications();
        }, 60 * 1000);
        
        this.intervalIds.push(notificationInterval);
    }

    /**
     * 通知リストを描画
     */
    renderNotificationList() {
        const notificationContainer = document.getElementById('notificationList');
        if (!notificationContainer) return;

        const notifications = this.notifications.slice(0, 10); // 最新10件

        if (notifications.length === 0) {
            notificationContainer.innerHTML = '<p class="no-notifications">通知はありません</p>';
            return;
        }

        const notificationHTML = notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" 
                 onclick="app.handleNotificationClick('${notification.id}')">
                <div class="notification-header">
                    <span class="notification-title">${notification.title}</span>
                    <span class="notification-time">${formatRelativeDate(notification.createdAt)}</span>
                </div>
                <div class="notification-message">${notification.message}</div>
            </div>
        `).join('');

        notificationContainer.innerHTML = notificationHTML;
    }

    /**
     * 通知クリックを処理
     */
    handleNotificationClick(notificationId) {
        // 通知を既読にする
        statusManager.markNotificationAsRead(notificationId);
        
        // 関連する案件に遷移
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && notification.projectId) {
            projectHandler.viewProject(notification.projectId);
        }
        
        // UI更新
        this.updateNotificationUI();
    }
}

// グローバルインスタンスを作成
const app = new App();

// ========================================================================= 
// グローバル関数（HTMLから呼び出し用）
// =========================================================================

/**
 * アプリケーション初期化（HTMLから呼び出し）
 */
function initializeApp() {
    app.initialize();
}

/**
 * モーダルを開く（HTMLから呼び出し）
 */
function openModal(modalId) {
    if (typeof projectHandler !== 'undefined') {
        projectHandler.openModal(modalId);
    }
}

/**
 * モーダルを閉じる（HTMLから呼び出し）
 */
function closeModal(modalId) {
    if (typeof projectHandler !== 'undefined') {
        projectHandler.closeModal(modalId);
    }
}

/**
 * ガントチャートフィルターをクリア（HTMLから呼び出し）
 */
function clearGanttFilters() {
    const filters = ['ganttFilter', 'showWeekends', 'showMilestones'];
    filters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = true;
            } else {
                element.value = '';
            }
        }
    });
    
    app.renderGanttChart();
    projectHandler.showToast('フィルターをクリアしました', 'info');
}

// =========================================================================
// 自動初期化
// =========================================================================

// DOMContentLoadedイベントで自動初期化
document.addEventListener('DOMContentLoaded', () => {
    debugLog('DOM content loaded, initializing app');
    app.initialize();
});

// ページ離脱時のクリーンアップ
window.addEventListener('beforeunload', () => {
    app.destroy();
});
