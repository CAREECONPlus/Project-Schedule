/**
 * data-manager.js - データ管理クラス
 * ローカルストレージでのデータ操作を管理（将来Firebase移行対応）
 */

class DataManager {
    constructor() {
        this.storageKeys = {
            projects: 'construction_projects',
            users: 'construction_users',
            settings: 'construction_settings',
            statusDefinitions: 'construction_status_definitions'
        };
        
        // 初期化
        this.initializeData();
        
        debugLog('DataManager initialized');
    }

    // =========================================================================
    // 初期化・セットアップ
    // =========================================================================

    /**
     * 初期データの設定
     */
    initializeData() {
        // ステータス定義の初期化
        if (!this.getStatusDefinitions()) {
            this.initializeStatusDefinitions();
        }

        // ユーザーデータの初期化
        if (!this.getUsers().length) {
            this.initializeUsers();
        }

        // 設定の初期化
        if (!this.getSettings()) {
            this.initializeSettings();
        }

        // サンプルデータの作成（開発用）
        if (!this.getProjects().length && window.location.hostname === 'localhost') {
            this.createSampleData();
        }
    }

    /**
     * ステータス定義の初期化
     */
    initializeStatusDefinitions() {
        const statusDefinitions = {
            "見積": {
                color: "#82889D",
                order: 1,
                description: "見積書作成・提出段階",
                allowedTransitions: ["受注"]
            },
            "受注": {
                color: "#244EFF",
                order: 2,
                description: "契約締結・受注確定",
                triggerAutoTicket: true,
                allowedTransitions: ["施工前"]
            },
            "施工前": {
                color: "#0133D8",
                order: 3,
                description: "施工準備・段取り",
                allowedTransitions: ["施工中"]
            },
            "施工中": {
                color: "#FFCE2C",
                order: 4,
                description: "現場施工中",
                allowedTransitions: ["施工完了"]
            },
            "施工完了": {
                color: "#1DCE85",
                order: 5,
                description: "施工作業完了",
                allowedTransitions: ["案件完了"]
            },
            "案件完了": {
                color: "#1DCE85",
                order: 6,
                description: "引き渡し・精算完了",
                allowedTransitions: []
            }
        };

        setLocalStorage(this.storageKeys.statusDefinitions, statusDefinitions);
        debugLog('Status definitions initialized');
    }

    /**
     * ユーザーデータの初期化
     */
    initializeUsers() {
        const users = [
            {
                id: "user_001",
                name: "山田花子",
                role: "管理者",
                email: "yamada@company.com",
                phone: "090-1111-2222",
                isActive: true,
                createdAt: new Date().toISOString()
            },
            {
                id: "user_002",
                name: "佐藤次郎",
                role: "現場管理者",
                email: "sato@company.com",
                phone: "090-3333-4444",
                isActive: true,
                createdAt: new Date().toISOString()
            },
            {
                id: "user_003",
                name: "鈴木一郎",
                role: "作業員",
                email: "suzuki@company.com",
                phone: "090-5555-6666",
                isActive: true,
                createdAt: new Date().toISOString()
            }
        ];

        setLocalStorage(this.storageKeys.users, users);
        debugLog('Users initialized');
    }

    /**
     * 設定の初期化
     */
    initializeSettings() {
        const settings = {
            companyName: "株式会社サンプル建設",
            autoTicketEnabled: true,
            defaultEstimateValidDays: 30,
            workingDays: ["月", "火", "水", "木", "金", "土"],
            businessHours: {
                start: "08:00",
                end: "17:00"
            },
            notifications: {
                statusChange: true,
                deadlineAlert: true,
                emailNotifications: false
            },
            theme: "default",
            language: "ja",
            lastUpdated: new Date().toISOString()
        };

        setLocalStorage(this.storageKeys.settings, settings);
        debugLog('Settings initialized');
    }

    /**
     * サンプルデータの作成（開発用）
     */
    createSampleData() {
        const sampleProjects = [
            {
                id: generateUUID(),
                name: "田中邸新築工事",
                client: {
                    name: "田中太郎",
                    phone: "090-1234-5678",
                    email: "tanaka@example.com",
                    address: "東京都渋谷区○○1-2-3"
                },
                estimate: {
                    amount: 15000000,
                    date: "2024-01-15",
                    validUntil: "2024-02-15"
                },
                contract: {
                    amount: 14500000,
                    signedDate: "2024-01-20"
                },
                schedule: {
                    startDate: "2024-02-01",
                    endDate: "2024-05-31",
                    actualStartDate: "2024-02-01",
                    actualEndDate: null
                },
                assignedTo: {
                    projectManager: "山田花子",
                    siteManager: "佐藤次郎",
                    workers: ["鈴木一郎"]
                },
                status: {
                    current: "施工中",
                    history: [
                        {
                            status: "見積",
                            date: "2024-01-15",
                            changedBy: "山田花子",
                            notes: "見積書作成完了"
                        },
                        {
                            status: "受注",
                            date: "2024-01-20",
                            changedBy: "山田花子",
                            notes: "契約締結"
                        },
                        {
                            status: "施工前",
                            date: "2024-01-25",
                            changedBy: "佐藤次郎",
                            notes: "現場準備完了"
                        },
                        {
                            status: "施工中",
                            date: "2024-02-01",
                            changedBy: "佐藤次郎",
                            notes: "着工開始"
                        }
                    ]
                },
                location: {
                    address: "東京都渋谷区○○1-2-3",
                    coordinates: {
                        lat: 35.6762,
                        lng: 139.6503
                    }
                },
                notes: "2階建て木造住宅、基礎工事含む",
                priority: "normal",
                progress: 65,
                createdAt: "2024-01-15T09:00:00Z",
                updatedAt: new Date().toISOString()
            },
            {
                id: generateUUID(),
                name: "佐藤商店改装工事",
                client: {
                    name: "佐藤商店",
                    phone: "03-1234-5678",
                    email: "info@sato-shop.com",
                    address: "東京都新宿区○○2-3-4"
                },
                estimate: {
                    amount: 8000000,
                    date: "2024-02-01",
                    validUntil: "2024-03-01"
                },
                contract: {
                    amount: 7800000,
                    signedDate: "2024-02-10"
                },
                schedule: {
                    startDate: "2024-03-01",
                    endDate: "2024-04-30",
                    actualStartDate: null,
                    actualEndDate: null
                },
                assignedTo: {
                    projectManager: "山田花子",
                    siteManager: "佐藤次郎",
                    workers: []
                },
                status: {
                    current: "施工前",
                    history: [
                        {
                            status: "見積",
                            date: "2024-02-01",
                            changedBy: "山田花子",
                            notes: "改装見積書提出"
                        },
                        {
                            status: "受注",
                            date: "2024-02-10",
                            changedBy: "山田花子",
                            notes: "改装工事契約"
                        },
                        {
                            status: "施工前",
                            date: "2024-02-15",
                            changedBy: "佐藤次郎",
                            notes: "材料発注・準備中"
                        }
                    ]
                },
                location: {
                    address: "東京都新宿区○○2-3-4",
                    coordinates: {
                        lat: 35.6896,
                        lng: 139.6917
                    }
                },
                notes: "店舗内装リニューアル、営業中の施工",
                priority: "high",
                progress: 0,
                createdAt: "2024-02-01T10:30:00Z",
                updatedAt: new Date().toISOString()
            }
        ];

        setLocalStorage(this.storageKeys.projects, sampleProjects);
        debugLog('Sample data created', sampleProjects);
    }

    // =========================================================================
    // 案件データ操作
    // =========================================================================

    /**
     * 全案件を取得
     * @returns {Array} 案件配列
     */
    getProjects() {
        return getLocalStorage(this.storageKeys.projects, []);
    }

    /**
     * 案件をIDで取得
     * @param {string} id - 案件ID
     * @returns {Object|null} 案件データ
     */
    getProjectById(id) {
        const projects = this.getProjects();
        return projects.find(project => project.id === id) || null;
    }

    /**
     * 案件を保存（新規追加または更新）
     * @param {Object} projectData - 案件データ
     * @returns {Object} 保存された案件データ
     */
    saveProject(projectData) {
        const projects = this.getProjects();
        const now = new Date().toISOString();

        if (projectData.id) {
            // 既存案件の更新
            const index = projects.findIndex(p => p.id === projectData.id);
            if (index !== -1) {
                projects[index] = {
                    ...projectData,
                    updatedAt: now
                };
                debugLog('Project updated', projects[index]);
            } else {
                throw new Error('更新対象の案件が見つかりません');
            }
        } else {
            // 新規案件の追加
            const newProject = {
                ...projectData,
                id: generateUUID(),
                createdAt: now,
                updatedAt: now,
                progress: 0,
                priority: projectData.priority || 'normal'
            };
            projects.push(newProject);
            debugLog('New project created', newProject);
        }

        setLocalStorage(this.storageKeys.projects, projects);
        return projectData.id ? 
            projects.find(p => p.id === projectData.id) : 
            projects[projects.length - 1];
    }

    /**
     * 案件を削除
     * @param {string} id - 案件ID
     * @returns {boolean} 削除成功かどうか
     */
    deleteProject(id) {
        const projects = this.getProjects();
        const index = projects.findIndex(p => p.id === id);
        
        if (index !== -1) {
            const deletedProject = projects.splice(index, 1)[0];
            setLocalStorage(this.storageKeys.projects, projects);
            debugLog('Project deleted', deletedProject);
            return true;
        }
        
        return false;
    }

    /**
     * 案件のステータスを更新
     * @param {string} id - 案件ID
     * @param {string} newStatus - 新しいステータス
     * @param {Object} options - 追加オプション
     * @returns {Object|null} 更新された案件データ
     */
    updateProjectStatus(id, newStatus, options = {}) {
        const project = this.getProjectById(id);
        if (!project) return null;

        const now = new Date().toISOString();
        const statusHistory = [...project.status.history];

        // ステータス履歴に追加
        statusHistory.push({
            status: newStatus,
            date: now,
            changedBy: options.changedBy || 'システム',
            notes: options.notes || ''
        });

        // 実績日付の更新
        const updatedSchedule = { ...project.schedule };
        if (newStatus === '施工中' && !updatedSchedule.actualStartDate) {
            updatedSchedule.actualStartDate = options.actualDate || formatDate(new Date());
        }
        if (newStatus === '施工完了' && !updatedSchedule.actualEndDate) {
            updatedSchedule.actualEndDate = options.actualDate || formatDate(new Date());
        }

        // 契約金額の更新（受注時）
        const updatedContract = { ...project.contract };
        if (newStatus === '受注' && options.contractAmount) {
            updatedContract.amount = options.contractAmount;
            updatedContract.signedDate = options.actualDate || formatDate(new Date());
        }

        // 進捗の自動更新
        let progress = project.progress || 0;
        const statusOrder = this.getStatusDefinitions()[newStatus]?.order || 1;
        const maxOrder = Math.max(...Object.values(this.getStatusDefinitions()).map(s => s.order));
        progress = Math.round((statusOrder / maxOrder) * 100);

        const updatedProject = {
            ...project,
            status: {
                current: newStatus,
                history: statusHistory
            },
            schedule: updatedSchedule,
            contract: updatedContract,
            progress: progress,
            updatedAt: now
        };

        return this.saveProject(updatedProject);
    }

    // =========================================================================
    // 検索・フィルタリング
    // =========================================================================

    /**
     * 案件を検索
     * @param {Object} criteria - 検索条件
     * @returns {Array} 検索結果
     */
    searchProjects(criteria = {}) {
        let projects = this.getProjects();

        // テキスト検索
        if (criteria.query) {
            const query = criteria.query.toLowerCase();
            projects = projects.filter(project => 
                project.name.toLowerCase().includes(query) ||
                project.client.name.toLowerCase().includes(query) ||
                (project.notes && project.notes.toLowerCase().includes(query))
            );
        }

        // ステータスフィルター
        if (criteria.status) {
            projects = projects.filter(project => 
                project.status.current === criteria.status
            );
        }

        // 担当者フィルター
        if (criteria.manager) {
            projects = projects.filter(project => 
                project.assignedTo.projectManager === criteria.manager ||
                project.assignedTo.siteManager === criteria.manager
            );
        }

        // 期間フィルター
        if (criteria.startDate && criteria.endDate) {
            projects = projects.filter(project => {
                const projectStart = new Date(project.schedule.startDate);
                const projectEnd = new Date(project.schedule.endDate);
                const filterStart = new Date(criteria.startDate);
                const filterEnd = new Date(criteria.endDate);
                
                return (projectStart <= filterEnd && projectEnd >= filterStart);
            });
        }

        // 優先度フィルター
        if (criteria.priority) {
            projects = projects.filter(project => 
                project.priority === criteria.priority
            );
        }

        // ソート
        if (criteria.sortBy) {
            projects = this.sortProjects(projects, criteria.sortBy, criteria.sortOrder);
        }

        debugLog('Search results', { criteria, count: projects.length });
        return projects;
    }

    /**
     * 案件をソート
     * @param {Array} projects - 案件配列
     * @param {string} sortBy - ソート項目
     * @param {string} sortOrder - ソート順（asc/desc）
     * @returns {Array} ソートされた案件配列
     */
    sortProjects(projects, sortBy, sortOrder = 'asc') {
        const sortedProjects = [...projects];

        sortedProjects.sort((a, b) => {
            let valueA, valueB;

            switch (sortBy) {
                case 'name':
                    valueA = a.name;
                    valueB = b.name;
                    break;
                case 'client':
                    valueA = a.client.name;
                    valueB = b.client.name;
                    break;
                case 'status':
                    valueA = this.getStatusDefinitions()[a.status.current]?.order || 0;
                    valueB = this.getStatusDefinitions()[b.status.current]?.order || 0;
                    break;
                case 'startDate':
                    valueA = new Date(a.schedule.startDate);
                    valueB = new Date(b.schedule.startDate);
                    break;
                case 'endDate':
                    valueA = new Date(a.schedule.endDate);
                    valueB = new Date(b.schedule.endDate);
                    break;
                case 'amount':
                    valueA = a.contract.amount || a.estimate.amount || 0;
                    valueB = b.contract.amount || b.estimate.amount || 0;
                    break;
                case 'updatedAt':
                    valueA = new Date(a.updatedAt);
                    valueB = new Date(b.updatedAt);
                    break;
                default:
                    return 0;
            }

            if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
            if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return sortedProjects;
    }

    /**
     * 現場管理用の案件を取得（受注以降のステータス）
     * @param {Object} filters - フィルター条件
     * @returns {Array} 現場管理用案件配列
     */
    getSiteManagementProjects(filters = {}) {
        const activeStatuses = ['受注', '施工前', '施工中', '施工完了'];
        
        return this.searchProjects({
            ...filters,
            status: filters.status && activeStatuses.includes(filters.status) ? 
                filters.status : undefined
        }).filter(project => activeStatuses.includes(project.status.current));
    }

    // =========================================================================
    // 統計・分析
    // =========================================================================

    /**
     * ダッシュボード用の統計情報を取得
     * @returns {Object} 統計データ
     */
    getDashboardStats() {
        const projects = this.getProjects();
        const statusDefinitions = this.getStatusDefinitions();
        
        const stats = {
            total: projects.length,
            byStatus: {},
            byManager: {},
            totalAmount: 0,
            avgProgress: 0
        };

        // ステータス別カウント
        Object.keys(statusDefinitions).forEach(status => {
            stats.byStatus[status] = projects.filter(p => p.status.current === status).length;
        });

        // 担当者別カウント
        projects.forEach(project => {
            const manager = project.assignedTo.projectManager;
            stats.byManager[manager] = (stats.byManager[manager] || 0) + 1;
        });

        // 合計金額・平均進捗
        const totalAmount = projects.reduce((sum, project) => {
            return sum + (project.contract.amount || project.estimate.amount || 0);
        }, 0);
        
        const totalProgress = projects.reduce((sum, project) => {
            return sum + (project.progress || 0);
        }, 0);

        stats.totalAmount = totalAmount;
        stats.avgProgress = projects.length > 0 ? Math.round(totalProgress / projects.length) : 0;

        return stats;
    }

    // =========================================================================
    // ユーザー・設定データ操作
    // =========================================================================

    /**
     * 全ユーザーを取得
     * @returns {Array} ユーザー配列
     */
    getUsers() {
        return getLocalStorage(this.storageKeys.users, []);
    }

    /**
     * アクティブなユーザーを取得
     * @returns {Array} アクティブユーザー配列
     */
    getActiveUsers() {
        return this.getUsers().filter(user => user.isActive);
    }

    /**
     * ステータス定義を取得
     * @returns {Object} ステータス定義
     */
    getStatusDefinitions() {
        return getLocalStorage(this.storageKeys.statusDefinitions, {});
    }

    /**
     * 設定を取得
     * @returns {Object} 設定データ
     */
    getSettings() {
        return getLocalStorage(this.storageKeys.settings, {});
    }

    /**
     * 設定を更新
     * @param {Object} newSettings - 新しい設定
     * @returns {Object} 更新された設定
     */
    updateSettings(newSettings) {
        const currentSettings = this.getSettings();
        const updatedSettings = {
            ...currentSettings,
            ...newSettings,
            lastUpdated: new Date().toISOString()
        };
        
        setLocalStorage(this.storageKeys.settings, updatedSettings);
        debugLog('Settings updated', updatedSettings);
        return updatedSettings;
    }

    // =========================================================================
    // データインポート・エクスポート
    // =========================================================================

    /**
     * 全データをエクスポート
     * @returns {Object} エクスポートデータ
     */
    exportAllData() {
        return {
            projects: this.getProjects(),
            users: this.getUsers(),
            settings: this.getSettings(),
            statusDefinitions: this.getStatusDefinitions(),
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
    }

    /**
     * データをインポート
     * @param {Object} data - インポートデータ
     * @returns {boolean} インポート成功かどうか
     */
    importData(data) {
        try {
            if (data.projects) {
                setLocalStorage(this.storageKeys.projects, data.projects);
            }
            if (data.users) {
                setLocalStorage(this.storageKeys.users, data.users);
            }
            if (data.settings) {
                setLocalStorage(this.storageKeys.settings, data.settings);
            }
            if (data.statusDefinitions) {
                setLocalStorage(this.storageKeys.statusDefinitions, data.statusDefinitions);
            }
            
            debugLog('Data imported successfully', data);
            return true;
        } catch (error) {
            errorLog('Data import failed', error);
            return false;
        }
    }

    /**
     * 全データを削除（リセット）
     */
    resetAllData() {
        Object.values(this.storageKeys).forEach(key => {
            removeLocalStorage(key);
        });
        
        this.initializeData();
        debugLog('All data reset');
    }
}

// グローバルインスタンスを作成
const dataManager = new DataManager();

// Firebase移行用のアダプターインターフェース（将来実装）
class FirebaseDataAdapter {
    constructor() {
        // Firebase設定
    }

    // 同じインターフェースを実装してFirebaseと連携
    // getProjects(), saveProject(), etc...
}
