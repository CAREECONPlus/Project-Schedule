/**
 * project-handler.js - 案件処理クラス
 * UIとデータ層をつなぐ案件関連の処理を管理
 */

class ProjectHandler {
    constructor() {
        this.currentFilters = {};
        this.currentSort = { by: 'updatedAt', order: 'desc' };
        this.editingProjectId = null;
        
        debugLog('ProjectHandler initialized');
    }

    // =========================================================================
    // ダッシュボード関連
    // =========================================================================

    /**
     * ダッシュボードを初期化・表示
     */
    initializeDashboard() {
        this.loadDashboardData();
        this.setupDashboardEventListeners();
        this.populateManagerFilters();
        debugLog('Dashboard initialized');
    }

    /**
     * ダッシュボードデータを読み込み表示
     */
    loadDashboardData() {
        // サマリーカードの更新
        this.updateSummaryCards();
        
        // 案件一覧の表示
        this.displayProjectsList();
        
        // 担当者フィルターの設定
        this.populateManagerFilters();
    }

    /**
     * サマリーカードを更新
     */
    updateSummaryCards() {
        const stats = dataManager.getDashboardStats();
        
        // 各ステータスの件数を表示
        setElementText('#estimateCount', stats.byStatus['見積'] || 0);
        setElementText('#orderCount', stats.byStatus['受注'] || 0);
        setElementText('#constructionCount', 
            (stats.byStatus['施工前'] || 0) + (stats.byStatus['施工中'] || 0));
        setElementText('#completedCount', 
            (stats.byStatus['施工完了'] || 0) + (stats.byStatus['案件完了'] || 0));
            
        debugLog('Summary cards updated', stats);
    }

    /**
     * 案件一覧を表示
     */
    displayProjectsList() {
        const projects = dataManager.searchProjects({
            ...this.currentFilters,
            sortBy: this.currentSort.by,
            sortOrder: this.currentSort.order
        });

        const tableBody = document.getElementById('projectsTableBody');
        const emptyState = document.getElementById('emptyState');

        if (!tableBody) return;

        if (projects.length === 0) {
            tableBody.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        tableBody.innerHTML = projects.map(project => this.createProjectTableRow(project)).join('');
        
        debugLog('Projects list displayed', { count: projects.length });
    }

    /**
     * 案件テーブル行を作成
     * @param {Object} project - 案件データ
     * @returns {string} HTMLテーブル行
     */
    createProjectTableRow(project) {
        const statusBadge = this.createStatusBadge(project.status.current);
        const amount = project.contract.amount || project.estimate.amount || 0;
        const schedule = this.formatScheduleDisplay(project.schedule);
        
        return `
            <tr data-project-id="${project.id}">
                <td>
                    <div class="project-name">${project.name}</div>
                </td>
                <td>
                    <div class="project-client">${project.client.name}</div>
                </td>
                <td>${project.assignedTo.projectManager || '-'}</td>
                <td class="project-amount">${formatCurrency(project.estimate.amount || 0)}</td>
                <td class="project-amount">${formatCurrency(amount)}</td>
                <td>
                    <div class="project-schedule">${schedule}</div>
                </td>
                <td>${statusBadge}</td>
                <td>${formatRelativeDate(project.updatedAt)}</td>
                <td>
                    <div class="project-actions">
                        <button class="action-btn view" onclick="projectHandler.viewProject('${project.id}')">
                            詳細
                        </button>
                        <button class="action-btn edit" onclick="projectHandler.editProject('${project.id}')">
                            編集
                        </button>
                        <button class="action-btn delete" onclick="projectHandler.confirmDeleteProject('${project.id}')">
                            削除
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * ステータスバッジを作成
     * @param {string} status - ステータス
     * @returns {string} ステータスバッジHTML
     */
    createStatusBadge(status) {
        const statusClass = this.getStatusClass(status);
        return `<span class="status-badge ${statusClass}">${status}</span>`;
    }

    /**
     * ステータスに対応するCSSクラスを取得
     * @param {string} status - ステータス
     * @returns {string} CSSクラス名
     */
    getStatusClass(status) {
        const statusMap = {
            '見積': 'status-estimate',
            '受注': 'status-order',
            '施工前': 'status-pre-construction',
            '施工中': 'status-construction',
            '施工完了': 'status-completed',
            '案件完了': 'status-finished'
        };
        return statusMap[status] || 'status-estimate';
    }

    /**
     * スケジュール表示をフォーマット
     * @param {Object} schedule - スケジュールデータ
     * @returns {string} フォーマットされたスケジュール
     */
    formatScheduleDisplay(schedule) {
        if (!schedule.startDate || !schedule.endDate) return '-';
        
        const start = formatDateJP(schedule.startDate);
        const end = formatDateJP(schedule.endDate);
        return `${start}<br>〜 ${end}`;
    }

    /**
     * 担当者フィルターを設定
     */
    populateManagerFilters() {
        const users = dataManager.getActiveUsers();
        const managerFilter = document.getElementById('managerFilter');
        const editManagerSelects = document.querySelectorAll('#projectManager, #siteManager, #editProjectManager, #editSiteManager');
        
        if (managerFilter) {
            managerFilter.innerHTML = '<option value="">全ての担当者</option>' +
                users.map(user => `<option value="${user.name}">${user.name}</option>`).join('');
        }

        // 編集フォームの担当者選択肢も更新
        editManagerSelects.forEach(select => {
            if (select) {
                select.innerHTML = '<option value="">選択してください</option>' +
                    users.map(user => `<option value="${user.name}">${user.name}</option>`).join('');
            }
        });
    }

    // =========================================================================
    // 案件詳細関連
    // =========================================================================

    /**
     * 案件詳細を表示
     * @param {string} projectId - 案件ID
     */
    loadProjectDetail(projectId) {
        const project = dataManager.getProjectById(projectId);
        if (!project) {
            this.showToast('案件が見つかりません', 'error');
            window.location.href = 'index.html';
            return;
        }

        this.displayProjectDetail(project);
        this.setupProjectDetailEventListeners(projectId);
        debugLog('Project detail loaded', project);
    }

    /**
     * 案件詳細を画面に表示
     * @param {Object} project - 案件データ
     */
    displayProjectDetail(project) {
        // ページタイトル更新
        document.title = `${project.name} - 案件詳細`;
        setElementText('#projectTitle', project.name);

        // 基本情報
        setElementText('#projectName', project.name);
        setElementText('#clientName', project.client.name);
        setElementText('#clientPhone', project.client.phone || '-');
        setElementText('#clientEmail', project.client.email || '-');
        setElementText('#clientAddress', project.client.address || '-');
        setElementText('#projectManager', project.assignedTo.projectManager || '-');
        setElementText('#siteManager', project.assignedTo.siteManager || '-');
        setElementText('#projectNotes', project.notes || '-');

        // 金額・スケジュール
        setElementText('#estimateAmount', formatCurrency(project.estimate.amount || 0));
        setElementText('#contractAmount', formatCurrency(project.contract.amount || 0));
        setElementText('#startDate', formatDateJP(project.schedule.startDate) || '-');
        setElementText('#endDate', formatDateJP(project.schedule.endDate) || '-');
        setElementText('#actualStartDate', formatDateJP(project.schedule.actualStartDate) || '-');
        setElementText('#actualEndDate', formatDateJP(project.schedule.actualEndDate) || '-');

        // ステータス
        this.updateStatusDisplay(project);

        // ステータス履歴
        this.displayStatusHistory(project.status.history);

        // チームメンバー
        this.displayTeamMembers(project);
    }

    /**
     * ステータス表示を更新
     * @param {Object} project - 案件データ
     */
    updateStatusDisplay(project) {
        const currentStatusEl = document.getElementById('currentStatus');
        if (currentStatusEl) {
            currentStatusEl.className = `status-badge ${this.getStatusClass(project.status.current)}`;
            currentStatusEl.textContent = project.status.current;
        }

        // ステータス進捗バーを更新
        this.updateStatusProgress(project.status.current);
    }

    /**
     * ステータス進捗バーを更新
     * @param {string} currentStatus - 現在のステータス
     */
    updateStatusProgress(currentStatus) {
        const progressContainer = document.getElementById('statusProgress');
        if (!progressContainer) return;

        const statusDefinitions = dataManager.getStatusDefinitions();
        const statuses = Object.keys(statusDefinitions).sort((a, b) => 
            statusDefinitions[a].order - statusDefinitions[b].order
        );

        const currentOrder = statusDefinitions[currentStatus]?.order || 1;

        const progressHTML = statuses.map(status => {
            const statusOrder = statusDefinitions[status].order;
            const isCompleted = statusOrder < currentOrder;
            const isActive = statusOrder === currentOrder;
            
            return `
                <div class="progress-step">
                    <div class="progress-circle ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
                        ${statusOrder}
                    </div>
                    <div class="progress-label">${status}</div>
                    ${statusOrder < statuses.length ? `<div class="progress-line ${isCompleted ? 'completed' : ''}"></div>` : ''}
                </div>
            `;
        }).join('');

        progressContainer.innerHTML = progressHTML;
    }

    /**
     * ステータス履歴を表示
     * @param {Array} history - ステータス履歴
     */
    displayStatusHistory(history) {
        const historyContainer = document.getElementById('statusHistory');
        if (!historyContainer) return;

        const historyHTML = history.map(item => `
            <div class="timeline-item">
                <div class="timeline-header">
                    <span class="timeline-status">${item.status}</span>
                    <span class="timeline-date">${formatDateJP(item.date)}</span>
                </div>
                <div class="timeline-user">変更者: ${item.changedBy}</div>
                ${item.notes ? `<div class="timeline-notes">${item.notes}</div>` : ''}
            </div>
        `).join('');

        historyContainer.innerHTML = historyHTML;
    }

    /**
     * チームメンバーを表示
     * @param {Object} project - 案件データ
     */
    displayTeamMembers(project) {
        const teamContainer = document.getElementById('teamMembers');
        if (!teamContainer) return;

        const members = [];
        
        if (project.assignedTo.projectManager) {
            members.push({
                name: project.assignedTo.projectManager,
                role: 'プロジェクトマネージャー'
            });
        }
        
        if (project.assignedTo.siteManager) {
            members.push({
                name: project.assignedTo.siteManager,
                role: '現場管理者'
            });
        }

        if (project.assignedTo.workers) {
            project.assignedTo.workers.forEach(worker => {
                members.push({
                    name: worker,
                    role: '作業員'
                });
            });
        }

        const membersHTML = members.map(member => `
            <div class="team-member">
                <div class="member-avatar">${member.name.charAt(0)}</div>
                <div class="member-info">
                    <div class="member-name">${member.name}</div>
                    <div class="member-role">${member.role}</div>
                </div>
            </div>
        `).join('');

        teamContainer.innerHTML = membersHTML || '<p>チームメンバーが設定されていません</p>';
    }

    // =========================================================================
    // 案件操作（CRUD）
    // =========================================================================

    /**
     * 案件詳細を表示（ページ遷移）
     * @param {string} projectId - 案件ID
     */
    viewProject(projectId) {
        window.location.href = `project-detail.html?id=${projectId}`;
    }

    /**
     * 案件編集フォームを開く
     * @param {string} projectId - 案件ID
     */
    editProject(projectId) {
        const project = dataManager.getProjectById(projectId);
        if (!project) {
            this.showToast('案件が見つかりません', 'error');
            return;
        }

        this.editingProjectId = projectId;
        this.populateEditForm(project);
        this.openModal('editProjectModal');
    }

    /**
     * 編集フォームにデータを設定
     * @param {Object} project - 案件データ
     */
    populateEditForm(project) {
        setElementValue('#editProjectName', project.name);
        setElementValue('#editClientName', project.client.name);
        setElementValue('#editClientPhone', project.client.phone);
        setElementValue('#editClientEmail', project.client.email);
        setElementValue('#editClientAddress', project.client.address);
        setElementValue('#editEstimateAmount', project.estimate.amount);
        setElementValue('#editStartDate', project.schedule.startDate);
        setElementValue('#editEndDate', project.schedule.endDate);
        setElementValue('#editProjectManager', project.assignedTo.projectManager);
        setElementValue('#editSiteManager', project.assignedTo.siteManager);
        setElementValue('#editProjectNotes', project.notes);
    }

    /**
     * 新規案件を追加
     * @param {Object} formData - フォームデータ
     */
    addNewProject(formData = null) {
        const data = formData || this.getFormData('addProjectForm');
        
        // バリデーション
        const validation = this.validateProjectForm(data);
        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            return;
        }

        try {
            // 案件データを構築
            const projectData = this.buildProjectData(data);
            
            // データ保存
            const savedProject = dataManager.saveProject(projectData);
            
            // UI更新
            this.closeModal('addProjectModal');
            this.loadDashboardData();
            this.showToast('案件を追加しました', 'success');
            
            debugLog('New project added', savedProject);
            
        } catch (error) {
            errorLog('Failed to add project', error);
            this.showToast('案件の追加に失敗しました', 'error');
        }
    }

    /**
     * 案件を更新
     */
    updateProject() {
        if (!this.editingProjectId) return;

        const data = this.getFormData('editProjectForm');
        
        // バリデーション
        const validation = this.validateProjectForm(data);
        if (!validation.isValid) {
            this.showValidationErrors(validation.errors);
            return;
        }

        try {
            // 既存データを取得
            const existingProject = dataManager.getProjectById(this.editingProjectId);
            
            // 更新データを構築
            const updatedData = this.buildProjectData(data, existingProject);
            updatedData.id = this.editingProjectId;
            
            // データ保存
            const savedProject = dataManager.saveProject(updatedData);
            
            // UI更新
            this.closeModal('editProjectModal');
            
            if (window.location.pathname.includes('project-detail.html')) {
                this.displayProjectDetail(savedProject);
            } else {
                this.loadDashboardData();
            }
            
            this.showToast('案件を更新しました', 'success');
            this.editingProjectId = null;
            
            debugLog('Project updated', savedProject);
            
        } catch (error) {
            errorLog('Failed to update project', error);
            this.showToast('案件の更新に失敗しました', 'error');
        }
    }

    /**
     * 案件削除の確認
     * @param {string} projectId - 案件ID
     */
    confirmDeleteProject(projectId) {
        const project = dataManager.getProjectById(projectId);
        if (!project) return;

        this.showConfirmDialog(
            '案件削除の確認',
            `「${project.name}」を削除してもよろしいですか？この操作は取り消せません。`,
            () => this.deleteProject(projectId)
        );
    }

    /**
     * 案件を削除
     * @param {string} projectId - 案件ID
     */
    deleteProject(projectId) {
        try {
            const success = dataManager.deleteProject(projectId);
            
            if (success) {
                this.showToast('案件を削除しました', 'success');
                
                if (window.location.pathname.includes('project-detail.html')) {
                    window.location.href = 'index.html';
                } else {
                    this.loadDashboardData();
                }
            } else {
                this.showToast('案件の削除に失敗しました', 'error');
            }
            
        } catch (error) {
            errorLog('Failed to delete project', error);
            this.showToast('案件の削除に失敗しました', 'error');
        }
    }

    // =========================================================================
    // フォーム処理・バリデーション
    // =========================================================================

    /**
     * フォームデータを取得
     * @param {string} formId - フォームID
     * @returns {Object} フォームデータ
     */
    getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return {};

        const formData = new FormData(form);
        const data = {};

        // 通常の入力要素
        for (const [key, value] of formData.entries()) {
            data[key] = value.trim();
        }

        // 個別の要素（FormDataで取得できない場合）
        const elements = form.querySelectorAll('input, select, textarea');
        elements.forEach(element => {
            if (element.name || element.id) {
                const key = element.name || element.id;
                if (!data[key]) {
                    data[key] = element.value.trim();
                }
            }
        });

        return data;
    }

    /**
     * 案件フォームをバリデーション
     * @param {Object} data - フォームデータ
     * @returns {Object} バリデーション結果
     */
    validateProjectForm(data) {
        const rules = {
            projectName: {
                required: true,
                requiredMessage: '案件名は必須です'
            },
            clientName: {
                required: true,
                requiredMessage: '顧客名は必須です'
            },
            clientEmail: {
                email: true,
                emailMessage: 'メールアドレスの形式が正しくありません'
            },
            clientPhone: {
                phone: true,
                phoneMessage: '電話番号の形式が正しくありません'
            },
            estimateAmount: {
                min: 0,
                minMessage: '見積金額は0以上で入力してください'
            },
            startDate: {
                date: true,
                dateMessage: '着工予定日の形式が正しくありません'
            },
            endDate: {
                date: true,
                dateMessage: '完了予定日の形式が正しくありません'
            }
        };

        const validation = validateForm(data, rules);

        // 日付の順序チェック
        if (data.startDate && data.endDate) {
            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            
            if (startDate >= endDate) {
                validation.isValid = false;
                validation.errors.endDate = '完了予定日は着工予定日より後の日付を入力してください';
            }
        }

        return validation;
    }

    /**
     * バリデーションエラーを表示
     * @param {Object} errors - エラーオブジェクト
     */
    showValidationErrors(errors) {
        // 既存のエラー表示をクリア
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        document.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));

        // エラーを表示
        for (const [field, message] of Object.entries(errors)) {
            const input = document.querySelector(`[name="${field}"], #${field}`);
            if (input) {
                input.classList.add('error');
                
                const errorEl = document.createElement('div');
                errorEl.className = 'error-message';
                errorEl.textContent = message;
                errorEl.style.color = 'var(--pink)';
                errorEl.style.fontSize = '0.875rem';
                errorEl.style.marginTop = '0.25rem';
                
                input.parentNode.appendChild(errorEl);
            }
        }

        this.showToast('入力内容を確認してください', 'error');
    }

    /**
     * 案件データオブジェクトを構築
     * @param {Object} formData - フォームデータ
     * @param {Object} existingProject - 既存案件データ（更新時）
     * @returns {Object} 案件データ
     */
    buildProjectData(formData, existingProject = null) {
        const data = {
            name: formData.projectName || formData.editProjectName,
            client: {
                name: formData.clientName || formData.editClientName,
                phone: formData.clientPhone || formData.editClientPhone || '',
                email: formData.clientEmail || formData.editClientEmail || '',
                address: formData.clientAddress || formData.editClientAddress || ''
            },
            estimate: {
                amount: Number(formData.estimateAmount || formData.editEstimateAmount) || 0,
                date: existingProject?.estimate.date || formatDate(new Date()),
                validUntil: existingProject?.estimate.validUntil || formatDate(addDays(30))
            },
            contract: existingProject?.contract || {
                amount: null,
                signedDate: null
            },
            schedule: {
                startDate: formData.startDate || formData.editStartDate || '',
                endDate: formData.endDate || formData.editEndDate || '',
                actualStartDate: existingProject?.schedule.actualStartDate || null,
                actualEndDate: existingProject?.schedule.actualEndDate || null
            },
            assignedTo: {
                projectManager: formData.projectManager || formData.editProjectManager || '',
                siteManager: formData.siteManager || formData.editSiteManager || '',
                workers: existingProject?.assignedTo.workers || []
            },
            status: existingProject?.status || {
                current: '見積',
                history: [{
                    status: '見積',
                    date: new Date().toISOString(),
                    changedBy: 'システム',
                    notes: '案件作成'
                }]
            },
            location: {
                address: formData.clientAddress || formData.editClientAddress || '',
                coordinates: existingProject?.location.coordinates || { lat: null, lng: null }
            },
            notes: formData.projectNotes || formData.editProjectNotes || '',
            priority: existingProject?.priority || 'normal'
        };

        return data;
    }

    // =========================================================================
    // 検索・フィルタリング
    // =========================================================================

    /**
     * 案件を検索・フィルタリング
     */
    filterProjects() {
        const searchQuery = document.getElementById('searchInput')?.value.trim();
        const statusFilter = document.getElementById('statusFilter')?.value;
        const managerFilter = document.getElementById('managerFilter')?.value;

        this.currentFilters = removeEmptyValues({
            query: searchQuery,
            status: statusFilter,
            manager: managerFilter
        });

        this.displayProjectsList();
        debugLog('Projects filtered', this.currentFilters);
    }

    /**
     * フィルターをクリア
     */
    clearFilters() {
        // フィルター入力をクリア
        setElementValue('#searchInput', '');
        setElementValue('#statusFilter', '');
        setElementValue('#managerFilter', '');

        // フィルター状態をリセット
        this.currentFilters = {};

        // 表示を更新
        this.displayProjectsList();
        
        this.showToast('フィルターをクリアしました', 'info');
    }

    // =========================================================================
    // イベントリスナー設定
    // =========================================================================

    /**
     * ダッシュボードのイベントリスナーを設定
     */
    setupDashboardEventListeners() {
        // 新規案件追加フォーム
        const addForm = document.getElementById('addProjectForm');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addNewProject();
            });
        }

        // 検索・フィルター
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const managerFilter = document.getElementById('managerFilter');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterProjects());
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterProjects());
        }
        if (managerFilter) {
            managerFilter.addEventListener('change', () => this.filterProjects());
        }
    }

    /**
     * 案件詳細のイベントリスナーを設定
     * @param {string} projectId - 案件ID
     */
    setupProjectDetailEventListeners(projectId) {
        // 編集フォーム
        const editForm = document.getElementById('editProjectForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProject();
            });
        }

        // クイックアクション
        const callBtn = document.getElementById('callClientBtn');
        const emailBtn = document.getElementById('emailClientBtn');

        if (callBtn) {
            callBtn.addEventListener('click', () => this.callClient(projectId));
        }
        if (emailBtn) {
            emailBtn.addEventListener('click', () => this.emailClient(projectId));
        }
    }

    // =========================================================================
    // ユーティリティ・ヘルパー
    // =========================================================================

    /**
     * 顧客に電話をかける（電話アプリを起動）
     * @param {string} projectId - 案件ID
     */
    callClient(projectId) {
        const project = dataManager.getProjectById(projectId);
        if (project && project.client.phone) {
            window.location.href = `tel:${project.client.phone}`;
        } else {
            this.showToast('電話番号が設定されていません', 'warning');
        }
    }

    /**
     * 顧客にメールを送信（メールアプリを起動）
     * @param {string} projectId - 案件ID
     */
    emailClient(projectId) {
        const project = dataManager.getProjectById(projectId);
        if (project && project.client.email) {
            const subject = `【${dataManager.getSettings().companyName}】${project.name}について`;
            window.location.href = `mailto:${project.client.email}?subject=${encodeURIComponent(subject)}`;
        } else {
            this.showToast('メールアドレスが設定されていません', 'warning');
        }
    }

    /**
     * モーダルを開く
     * @param {string} modalId - モーダルID
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * モーダルを閉じる
     * @param {string} modalId - モーダルID
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // フォームをリセット
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
                // エラー表示をクリア
                modal.querySelectorAll('.error-message').forEach(el => el.remove());
                modal.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));
            }
        }
        
        // 編集状態をクリア
        this.editingProjectId = null;
    }

    /**
     * 確認ダイアログを表示
     * @param {string} title - タイトル
     * @param {string} message - メッセージ
     * @param {Function} onConfirm - 確認時のコールバック
     */
    showConfirmDialog(title, message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmTitle');
        const messageEl = document.getElementById('confirmMessage');
        const confirmBtn = document.getElementById('confirmButton');
        
        if (modal && titleEl && messageEl && confirmBtn) {
            titleEl.textContent = title;
            messageEl.textContent = message;
            
            // 既存のイベントリスナーを削除
            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            
            // 新しいイベントリスナーを追加
            newConfirmBtn.addEventListener('click', () => {
                onConfirm();
                this.closeModal('confirmModal');
            });
            
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * トースト通知を表示
     * @param {string} message - メッセージ
     * @param {string} type - タイプ (success, error, warning, info)
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;

        container.appendChild(toast);

        // アニメーション表示
        setTimeout(() => toast.classList.add('show'), 100);

        // 自動削除
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    // =========================================================================
    // データエクスポート
    // =========================================================================

    /**
     * 案件データをCSV形式でエクスポート
     */
    exportProjectsCSV() {
        try {
            const projects = dataManager.searchProjects(this.currentFilters);
            const headers = [
                '案件名', '顧客名', '電話番号', 'メールアドレス', '住所',
                'プロジェクトマネージャー', '現場管理者',
                '見積金額', '契約金額', '着工予定日', '完了予定日',
                'ステータス', '進捗率', '備考', '作成日', '更新日'
            ];

            const csvData = projects.map(project => [
                project.name,
                project.client.name,
                project.client.phone || '',
                project.client.email || '',
                project.client.address || '',
                project.assignedTo.projectManager || '',
                project.assignedTo.siteManager || '',
                project.estimate.amount || 0,
                project.contract.amount || 0,
                project.schedule.startDate || '',
                project.schedule.endDate || '',
                project.status.current,
                project.progress || 0,
                project.notes || '',
                formatDate(project.createdAt),
                formatDate(project.updatedAt)
            ]);

            const csvContent = [headers, ...csvData]
                .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                .join('\n');

            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `案件一覧_${formatDate(new Date())}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showToast('案件データをエクスポートしました', 'success');
            debugLog('Projects exported to CSV', { count: projects.length });

        } catch (error) {
            errorLog('Failed to export CSV', error);
            this.showToast('エクスポートに失敗しました', 'error');
        }
    }

    /**
     * 案件データをJSON形式でエクスポート
     */
    exportProjectsJSON() {
        try {
            const exportData = dataManager.exportAllData();
            const jsonContent = JSON.stringify(exportData, null, 2);
            
            const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `案件管理データ_${formatDate(new Date())}.json`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showToast('全データをエクスポートしました', 'success');
            debugLog('All data exported to JSON');

        } catch (error) {
            errorLog('Failed to export JSON', error);
            this.showToast('エクスポートに失敗しました', 'error');
        }
    }

    // =========================================================================
    // 進捗管理
    // =========================================================================

    /**
     * 案件の進捗率を更新
     * @param {string} projectId - 案件ID
     * @param {number} progress - 進捗率（0-100）
     */
    updateProjectProgress(projectId, progress) {
        try {
            const project = dataManager.getProjectById(projectId);
            if (!project) return;

            const updatedProject = {
                ...project,
                progress: Math.max(0, Math.min(100, progress)),
                updatedAt: new Date().toISOString()
            };

            dataManager.saveProject(updatedProject);
            
            // UI更新
            if (window.location.pathname.includes('project-detail.html')) {
                this.displayProjectDetail(updatedProject);
            } else {
                this.displayProjectsList();
            }

            this.showToast('進捗を更新しました', 'success');

        } catch (error) {
            errorLog('Failed to update progress', error);
            this.showToast('進捗の更新に失敗しました', 'error');
        }
    }

    /**
     * 期限が近い案件を取得
     * @param {number} days - 何日以内か
     * @returns {Array} 期限が近い案件リスト
     */
    getUpcomingDeadlines(days = 7) {
        const projects = dataManager.getProjects();
        const targetDate = addDays(days);
        
        return projects.filter(project => {
            if (!project.schedule.endDate) return false;
            
            const endDate = new Date(project.schedule.endDate);
            const today = new Date();
            
            return endDate >= today && endDate <= targetDate && 
                   !['施工完了', '案件完了'].includes(project.status.current);
        }).sort((a, b) => new Date(a.schedule.endDate) - new Date(b.schedule.endDate));
    }

    /**
     * 遅延している案件を取得
     * @returns {Array} 遅延案件リスト
     */
    getDelayedProjects() {
        const projects = dataManager.getProjects();
        const today = new Date();
        
        return projects.filter(project => {
            if (!project.schedule.endDate) return false;
            
            const endDate = new Date(project.schedule.endDate);
            return endDate < today && 
                   !['施工完了', '案件完了'].includes(project.status.current);
        }).sort((a, b) => new Date(a.schedule.endDate) - new Date(b.schedule.endDate));
    }

    // =========================================================================
    // 初期化・セットアップ
    // =========================================================================

    /**
     * ページ固有の初期化を実行
     */
    initializePage() {
        const currentPage = window.location.pathname.split('/').pop();
        
        switch (currentPage) {
            case 'index.html':
            case '':
                this.initializeDashboard();
                break;
                
            case 'project-detail.html':
                const urlParams = new URLSearchParams(window.location.search);
                const projectId = urlParams.get('id');
                if (projectId) {
                    this.loadProjectDetail(projectId);
                } else {
                    window.location.href = 'index.html';
                }
                break;
                
            default:
                debugLog('Unknown page, basic initialization only');
        }
    }

    /**
     * 全体的なイベントリスナーを設定
     */
    setupGlobalEventListeners() {
        // モーダル背景クリックで閉じる
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            }
        });

        // ESCキーでモーダルを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal[style*="flex"]');
                if (openModal) {
                    this.closeModal(openModal.id);
                }
            }
        });

        // フォームの自動保存（下書き機能）
        document.addEventListener('input', (e) => {
            if (e.target.form && e.target.form.id === 'addProjectForm') {
                this.saveDraft(e.target.form);
            }
        });
    }

    /**
     * フォームの下書きを保存
     * @param {HTMLFormElement} form - フォーム要素
     */
    saveDraft(form) {
        if (!form) return;
        
        const formData = this.getFormData(form.id);
        setLocalStorage('project_form_draft', {
            data: formData,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * フォームの下書きを復元
     * @param {string} formId - フォームID
     */
    restoreDraft(formId) {
        const draft = getLocalStorage('project_form_draft');
        if (!draft || !draft.data) return;

        // 1時間以内の下書きのみ復元
        const draftTime = new Date(draft.timestamp);
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        if (draftTime < hourAgo) {
            removeLocalStorage('project_form_draft');
            return;
        }

        // フォームに値を設定
        const form = document.getElementById(formId);
        if (form) {
            Object.entries(draft.data).forEach(([key, value]) => {
                const input = form.querySelector(`[name="${key}"], #${key}`);
                if (input && value) {
                    input.value = value;
                }
            });
            
            this.showToast('下書きを復元しました', 'info');
        }
    }
}

// グローバルインスタンスを作成
const projectHandler = new ProjectHandler();

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
    projectHandler.setupGlobalEventListeners();
    projectHandler.initializePage();
});
