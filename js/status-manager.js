/**
 * status-manager.js - ステータス管理クラス
 * ステータス変更、自動起票、業務フロー制御を管理
 */

class StatusManager {
    constructor() {
        this.pendingStatusChange = null;
        this.autoTicketQueue = [];
        this.statusChangeCallbacks = [];
        
        debugLog('StatusManager initialized');
    }

    // =========================================================================
    // ステータス変更処理
    // =========================================================================

    /**
     * ステータス変更モーダルを初期化
     * @param {string} projectId - 案件ID
     */
    initializeStatusChangeModal(projectId) {
        const project = dataManager.getProjectById(projectId);
        if (!project) {
            projectHandler.showToast('案件が見つかりません', 'error');
            return;
        }

        this.setupStatusChangeForm(project);
        this.populateStatusOptions(project);
        this.setupStatusChangeListeners();
        
        debugLog('Status change modal initialized', project);
    }

    /**
     * ステータス変更フォームを設定
     * @param {Object} project - 案件データ
     */
    setupStatusChangeForm(project) {
        // 現在のステータスを表示
        const currentStatusEl = document.getElementById('currentStatusDisplay');
        if (currentStatusEl) {
            currentStatusEl.className = `status-badge ${projectHandler.getStatusClass(project.status.current)}`;
            currentStatusEl.textContent = project.status.current;
        }

        // フォームをリセット
        const form = document.getElementById('statusChangeForm');
        if (form) {
            form.reset();
            this.hideStatusChangeOptions();
        }

        // 案件IDを保存
        this.pendingStatusChange = {
            projectId: project.id,
            currentStatus: project.status.current,
            project: project
        };
    }

    /**
     * ステータス選択肢を設定
     * @param {Object} project - 案件データ
     */
    populateStatusOptions(project) {
        const statusSelect = document.getElementById('newStatus');
        if (!statusSelect) return;

        const statusDefinitions = dataManager.getStatusDefinitions();
        const currentStatus = project.status.current;
        const allowedTransitions = this.getAllowedStatusTransitions(currentStatus);

        // オプションをクリア
        statusSelect.innerHTML = '<option value="">選択してください</option>';

        // 許可されたステータスのみを追加
        allowedTransitions.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status;
            statusSelect.appendChild(option);
        });

        debugLog('Status options populated', { currentStatus, allowedTransitions });
    }

    /**
     * 許可されたステータス遷移を取得
     * @param {string} currentStatus - 現在のステータス
     * @returns {Array} 許可されたステータス配列
     */
    getAllowedStatusTransitions(currentStatus) {
        const statusDefinitions = dataManager.getStatusDefinitions();
        const current = statusDefinitions[currentStatus];
        
        if (!current || !current.allowedTransitions) {
            // フォールバック: 順序に基づく遷移
            return this.getSequentialTransitions(currentStatus);
        }

        return current.allowedTransitions;
    }

    /**
     * 順序に基づくステータス遷移を取得（フォールバック）
     * @param {string} currentStatus - 現在のステータス
     * @returns {Array} 次のステータス配列
     */
    getSequentialTransitions(currentStatus) {
        const statusDefinitions = dataManager.getStatusDefinitions();
        const currentOrder = statusDefinitions[currentStatus]?.order || 1;
        
        const nextStatuses = Object.entries(statusDefinitions)
            .filter(([status, def]) => def.order > currentOrder)
            .sort((a, b) => a[1].order - b[1].order)
            .map(([status]) => status);

        // 最低限、次のステータスと完了ステータスは許可
        if (nextStatuses.length === 0 && currentStatus !== '案件完了') {
            return ['案件完了'];
        }

        return nextStatuses.slice(0, 2); // 最大2つまで
    }

    /**
     * ステータス変更フォームのイベントリスナーを設定
     */
    setupStatusChangeListeners() {
        const newStatusSelect = document.getElementById('newStatus');
        if (newStatusSelect) {
            newStatusSelect.addEventListener('change', (e) => {
                this.handleStatusSelectChange(e.target.value);
            });
        }

        const form = document.getElementById('statusChangeForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processStatusChange();
            });
        }
    }

    /**
     * ステータス選択変更時の処理
     * @param {string} selectedStatus - 選択されたステータス
     */
    handleStatusSelectChange(selectedStatus) {
        this.hideStatusChangeOptions();

        if (!selectedStatus) return;

        // 受注時の処理
        if (selectedStatus === '受注') {
            this.showContractAmountInput();
            this.showAutoTicketAlert();
        }

        // 着工・完了時の処理
        if (['施工中', '施工完了', '案件完了'].includes(selectedStatus)) {
            this.showActualDateInput(selectedStatus);
        }

        // 進捗に基づく確認
        this.validateStatusTransition(selectedStatus);
    }

    /**
     * 契約金額入力を表示
     */
    showContractAmountInput() {
        const contractGroup = document.getElementById('contractAmountGroup');
        if (contractGroup) {
            contractGroup.style.display = 'block';
            
            // 見積金額があれば初期値として設定
            if (this.pendingStatusChange && this.pendingStatusChange.project.estimate.amount) {
                const contractInput = document.getElementById('statusContractAmount');
                if (contractInput && !contractInput.value) {
                    contractInput.value = this.pendingStatusChange.project.estimate.amount;
                }
            }
        }
    }

    /**
     * 実績日付入力を表示
     * @param {string} status - ステータス
     */
    showActualDateInput(status) {
        const actualDateGroup = document.getElementById('actualDateGroup');
        const actualDateInput = document.getElementById('actualDate');
        
        if (actualDateGroup && actualDateInput) {
            actualDateGroup.style.display = 'block';
            
            // ラベルを動的に変更
            const label = actualDateGroup.querySelector('label');
            if (label) {
                const labelText = {
                    '施工中': '実着工日',
                    '施工完了': '実完了日',
                    '案件完了': '引き渡し日'
                };
                label.textContent = labelText[status] || '実績日付';
            }
            
            // 今日の日付を初期値として設定
            if (!actualDateInput.value) {
                actualDateInput.value = formatDate(new Date());
            }
        }
    }

    /**
     * 自動起票アラートを表示
     */
    showAutoTicketAlert() {
        const alertBox = document.getElementById('autoTicketAlert');
        if (alertBox) {
            alertBox.style.display = 'block';
        }
    }

    /**
     * ステータス変更オプションを隠す
     */
    hideStatusChangeOptions() {
        const optionGroups = [
            'contractAmountGroup',
            'actualDateGroup',
            'autoTicketAlert'
        ];

        optionGroups.forEach(groupId => {
            const group = document.getElementById(groupId);
            if (group) {
                group.style.display = 'none';
            }
        });
    }

    /**
     * ステータス遷移の妥当性を検証
     * @param {string} newStatus - 新しいステータス
     */
    validateStatusTransition(newStatus) {
        if (!this.pendingStatusChange) return;

        const project = this.pendingStatusChange.project;
        const issues = [];

        // 必要な情報のチェック
        if (newStatus === '受注' && !project.estimate.amount) {
            issues.push('見積金額が設定されていません');
        }

        if (['施工前', '施工中'].includes(newStatus) && !project.schedule.startDate) {
            issues.push('着工予定日が設定されていません');
        }

        if (['施工中', '施工完了'].includes(newStatus) && !project.assignedTo.siteManager) {
            issues.push('現場管理者が設定されていません');
        }

        // 警告を表示
        if (issues.length > 0) {
            const warningHtml = `
                <div class="status-warning">
                    <strong>⚠️ 注意事項：</strong>
                    <ul>
                        ${issues.map(issue => `<li>${issue}</li>`).join('')}
                    </ul>
                    <p>続行してもよろしいですか？</p>
                </div>
            `;
            
            this.showStatusWarning(warningHtml);
        }
    }

    /**
     * ステータス変更警告を表示
     * @param {string} warningHtml - 警告HTML
     */
    showStatusWarning(warningHtml) {
        // 既存の警告を削除
        const existingWarning = document.querySelector('.status-warning');
        if (existingWarning) {
            existingWarning.remove();
        }

        // 新しい警告を追加
        const form = document.getElementById('statusChangeForm');
        if (form) {
            const warningDiv = document.createElement('div');
            warningDiv.innerHTML = warningHtml;
            warningDiv.className = 'alert-box warning';
            warningDiv.style.marginTop = '1rem';
            form.appendChild(warningDiv);
        }
    }

    // =========================================================================
    // ステータス変更実行
    // =========================================================================

    /**
     * ステータス変更を処理
     */
    async processStatusChange() {
        if (!this.pendingStatusChange) {
            projectHandler.showToast('ステータス変更情報が不正です', 'error');
            return;
        }

        const formData = this.getStatusChangeFormData();
        const validation = this.validateStatusChangeForm(formData);
        
        if (!validation.isValid) {
            this.showStatusChangeErrors(validation.errors);
            return;
        }

        try {
            // ステータス変更を実行
            const result = await this.executeStatusChange(formData);
            
            if (result.success) {
                // 自動起票処理
                if (formData.newStatus === '受注') {
                    await this.triggerAutoTicket(result.project);
                }

                // UI更新
                this.updateUIAfterStatusChange(result.project);
                
                // 成功メッセージ
                projectHandler.showToast(
                    `ステータスを「${formData.newStatus}」に変更しました`, 
                    'success'
                );

                // モーダルを閉じる
                projectHandler.closeModal('statusChangeModal');

                // コールバック実行
                this.executeStatusChangeCallbacks(result.project, formData.newStatus);

            } else {
                projectHandler.showToast('ステータスの変更に失敗しました', 'error');
            }

        } catch (error) {
            errorLog('Status change failed', error);
            projectHandler.showToast('ステータス変更中にエラーが発生しました', 'error');
        }
    }

    /**
     * ステータス変更フォームデータを取得
     * @returns {Object} フォームデータ
     */
    getStatusChangeFormData() {
        return {
            projectId: this.pendingStatusChange.projectId,
            currentStatus: this.pendingStatusChange.currentStatus,
            newStatus: document.getElementById('newStatus')?.value,
            contractAmount: document.getElementById('statusContractAmount')?.value,
            actualDate: document.getElementById('actualDate')?.value,
            notes: document.getElementById('statusNotes')?.value?.trim(),
            changedBy: this.getCurrentUser()
        };
    }

    /**
     * ステータス変更フォームをバリデーション
     * @param {Object} formData - フォームデータ
     * @returns {Object} バリデーション結果
     */
    validateStatusChangeForm(formData) {
        const errors = {};
        let isValid = true;

        // 新しいステータスは必須
        if (!formData.newStatus) {
            errors.newStatus = '新しいステータスを選択してください';
            isValid = false;
        }

        // 受注時は契約金額をチェック
        if (formData.newStatus === '受注' && formData.contractAmount) {
            const amount = Number(formData.contractAmount);
            if (isNaN(amount) || amount <= 0) {
                errors.contractAmount = '契約金額は正の数値で入力してください';
                isValid = false;
            }
        }

        // 実績日付のチェック
        if (formData.actualDate && !isValidDate(formData.actualDate)) {
            errors.actualDate = '日付の形式が正しくありません';
            isValid = false;
        }

        return { isValid, errors };
    }

    /**
     * ステータス変更を実行
     * @param {Object} formData - フォームデータ
     * @returns {Object} 実行結果
     */
    async executeStatusChange(formData) {
        try {
            const updatedProject = dataManager.updateProjectStatus(
                formData.projectId,
                formData.newStatus,
                {
                    changedBy: formData.changedBy,
                    notes: formData.notes,
                    contractAmount: formData.contractAmount ? Number(formData.contractAmount) : undefined,
                    actualDate: formData.actualDate
                }
            );

            if (updatedProject) {
                debugLog('Status changed successfully', {
                    projectId: formData.projectId,
                    from: formData.currentStatus,
                    to: formData.newStatus
                });

                return { success: true, project: updatedProject };
            } else {
                return { success: false, error: 'Project not found' };
            }

        } catch (error) {
            errorLog('Failed to execute status change', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * ステータス変更後のUI更新
     * @param {Object} updatedProject - 更新された案件データ
     */
    updateUIAfterStatusChange(updatedProject) {
        const currentPage = window.location.pathname.split('/').pop();

        if (currentPage === 'project-detail.html') {
            // 案件詳細ページの更新
            projectHandler.displayProjectDetail(updatedProject);
        } else {
            // ダッシュボードの更新
            projectHandler.loadDashboardData();
        }

        // リセット
        this.pendingStatusChange = null;
    }

    // =========================================================================
    // 自動起票機能
    // =========================================================================

    /**
     * 自動起票を実行
     * @param {Object} project - 案件データ
     */
    async triggerAutoTicket(project) {
        const settings = dataManager.getSettings();
        
        if (!settings.autoTicketEnabled) {
            debugLog('Auto ticket is disabled');
            return;
        }

        try {
            // 起票データを作成
            const ticketData = this.createAutoTicketData(project);
            
            // 起票キューに追加
            this.autoTicketQueue.push(ticketData);
            
            // 起票処理を実行
            await this.processAutoTicketQueue();
            
            debugLog('Auto ticket triggered', ticketData);
            
        } catch (error) {
            errorLog('Auto ticket failed', error);
            projectHandler.showToast('自動起票でエラーが発生しました', 'warning');
        }
    }

    /**
     * 自動起票データを作成
     * @param {Object} project - 案件データ
     * @returns {Object} 起票データ
     */
    createAutoTicketData(project) {
        return {
            id: generateUUID(),
            projectId: project.id,
            projectName: project.name,
            clientName: project.client.name,
            siteManager: project.assignedTo.siteManager,
            contractAmount: project.contract.amount,
            startDate: project.schedule.startDate,
            endDate: project.schedule.endDate,
            location: project.location.address,
            notes: project.notes,
            ticketedAt: new Date().toISOString(),
            status: 'pending'
        };
    }

    /**
     * 自動起票キューを処理
     */
    async processAutoTicketQueue() {
        while (this.autoTicketQueue.length > 0) {
            const ticketData = this.autoTicketQueue.shift();
            
            try {
                await this.executeAutoTicket(ticketData);
                ticketData.status = 'completed';
                
            } catch (error) {
                errorLog('Auto ticket execution failed', error);
                ticketData.status = 'failed';
                ticketData.error = error.message;
            }
            
            // 処理結果をログに記録
            this.logAutoTicketResult(ticketData);
        }
    }

    /**
     * 自動起票を実行
     * @param {Object} ticketData - 起票データ
     */
    async executeAutoTicket(ticketData) {
        // 現場管理者への通知を送信
        await this.notifySiteManager(ticketData);
        
        // 起票ログを記録
        this.recordAutoTicketLog(ticketData);
        
        // 成功通知
        projectHandler.showToast(
            `現場管理者「${ticketData.siteManager}」に自動起票しました`,
            'success'
        );
    }

    /**
     * 現場管理者への通知を送信
     * @param {Object} ticketData - 起票データ
     */
    async notifySiteManager(ticketData) {
        // 実際の実装では、メール送信やプッシュ通知などを行う
        // 現在はローカル通知のみ
        
        const notification = {
            id: generateUUID(),
            type: 'auto_ticket',
            title: '新規案件起票',
            message: `案件「${ticketData.projectName}」が起票されました`,
            projectId: ticketData.projectId,
            targetUser: ticketData.siteManager,
            createdAt: new Date().toISOString(),
            read: false
        };

        // 通知をローカルストレージに保存
        const notifications = getLocalStorage('site_notifications', []);
        notifications.unshift(notification);
        setLocalStorage('site_notifications', notifications.slice(0, 100)); // 最新100件まで保持

        debugLog('Site manager notified', notification);
    }

    /**
     * 自動起票ログを記録
     * @param {Object} ticketData - 起票データ
     */
    recordAutoTicketLog(ticketData) {
        const logEntry = {
            ...ticketData,
            loggedAt: new Date().toISOString()
        };

        const logs = getLocalStorage('auto_ticket_logs', []);
        logs.unshift(logEntry);
        setLocalStorage('auto_ticket_logs', logs.slice(0, 1000)); // 最新1000件まで保持
    }

    /**
     * 自動起票結果をログに記録
     * @param {Object} ticketData - 起票データ
     */
    logAutoTicketResult(ticketData) {
        const resultLog = {
            ticketId: ticketData.id,
            projectId: ticketData.projectId,
            status: ticketData.status,
            error: ticketData.error,
            processedAt: new Date().toISOString()
        };

        debugLog('Auto ticket result', resultLog);
    }

    // =========================================================================
    // 通知・アラート機能
    // =========================================================================

    /**
     * 期限アラートを取得
     * @returns {Array} アラート配列
     */
    getDeadlineAlerts() {
        const upcomingProjects = projectHandler.getUpcomingDeadlines(7);
        const delayedProjects = projectHandler.getDelayedProjects();

        const alerts = [];

        // 期限が近い案件
        upcomingProjects.forEach(project => {
            const daysUntilDeadline = calculateDaysDifference(new Date(), project.schedule.endDate);
            alerts.push({
                type: 'deadline_warning',
                priority: daysUntilDeadline <= 3 ? 'high' : 'medium',
                projectId: project.id,
                projectName: project.name,
                message: `完了予定日まで${daysUntilDeadline}日です`,
                dueDate: project.schedule.endDate
            });
        });

        // 遅延している案件
        delayedProjects.forEach(project => {
            const delayedDays = Math.abs(calculateDaysDifference(new Date(), project.schedule.endDate));
            alerts.push({
                type: 'deadline_overdue',
                priority: 'critical',
                projectId: project.id,
                projectName: project.name,
                message: `完了予定日を${delayedDays}日過ぎています`,
                dueDate: project.schedule.endDate
            });
        });

        return alerts.sort((a, b) => {
            const priorityOrder = { critical: 3, high: 2, medium: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    /**
     * ステータス変更推奨を取得
     * @returns {Array} 推奨配列
     */
    getStatusChangeRecommendations() {
        const projects = dataManager.getProjects();
        const recommendations = [];
        const today = new Date();

        projects.forEach(project => {
            const status = project.status.current;
            const startDate = project.schedule.startDate ? new Date(project.schedule.startDate) : null;
            const endDate = project.schedule.endDate ? new Date(project.schedule.endDate) : null;

            // 着工予定日が過ぎているのに「施工前」のまま
            if (status === '施工前' && startDate && startDate <= today) {
                recommendations.push({
                    type: 'status_update_suggested',
                    priority: 'high',
                    projectId: project.id,
                    projectName: project.name,
                    currentStatus: status,
                    suggestedStatus: '施工中',
                    reason: '着工予定日が過ぎています'
                });
            }

            // 完了予定日が過ぎているのに「施工中」のまま
            if (status === '施工中' && endDate && endDate <= today) {
                recommendations.push({
                    type: 'status_update_suggested',
                    priority: 'high',
                    projectId: project.id,
                    projectName: project.name,
                    currentStatus: status,
                    suggestedStatus: '施工完了',
                    reason: '完了予定日が過ぎています'
                });
            }

            // 長期間ステータスが変更されていない
            const lastStatusChange = project.status.history[project.status.history.length - 1];
            if (lastStatusChange) {
                const daysSinceLastChange = calculateDaysDifference(
                    new Date(lastStatusChange.date), 
                    today
                );

                if (daysSinceLastChange > 30 && !['案件完了'].includes(status)) {
                    recommendations.push({
                        type: 'status_update_suggested',
                        priority: 'medium',
                        projectId: project.id,
                        projectName: project.name,
                        currentStatus: status,
                        suggestedStatus: null,
                        reason: `${daysSinceLastChange}日間ステータスが更新されていません`
                    });
                }
            }
        });

        return recommendations;
    }

    // =========================================================================
    // ユーティリティ
    // =========================================================================

    /**
     * 現在のユーザーを取得
     * @returns {string} ユーザー名
     */
    getCurrentUser() {
        // 実際の実装では認証システムから取得
        // 現在は固定値
        return '山田花子';
    }

    /**
     * ステータス変更エラーを表示
     * @param {Object} errors - エラーオブジェクト
     */
    showStatusChangeErrors(errors) {
        // 既存のエラー表示をクリア
        document.querySelectorAll('.status-error-message').forEach(el => el.remove());

        // エラーを表示
        for (const [field, message] of Object.entries(errors)) {
            const input = document.getElementById(field === 'newStatus' ? 'newStatus' : `status${field.charAt(0).toUpperCase() + field.slice(1)}`);
            if (input) {
                const errorEl = document.createElement('div');
                errorEl.className = 'status-error-message';
                errorEl.textContent = message;
                errorEl.style.color = 'var(--pink)';
                errorEl.style.fontSize = '0.875rem';
                errorEl.style.marginTop = '0.25rem';
                
                input.parentNode.appendChild(errorEl);
            }
        }

        projectHandler.showToast('入力内容を確認してください', 'error');
    }

    /**
     * ステータス変更コールバックを追加
     * @param {Function} callback - コールバック関数
     */
    addStatusChangeCallback(callback) {
        if (typeof callback === 'function') {
            this.statusChangeCallbacks.push(callback);
        }
    }

    /**
     * ステータス変更コールバックを実行
     * @param {Object} project - 案件データ
     * @param {string} newStatus - 新しいステータス
     */
    executeStatusChangeCallbacks(project, newStatus) {
        this.statusChangeCallbacks.forEach(callback => {
            try {
                callback(project, newStatus);
            } catch (error) {
                errorLog('Status change callback failed', error);
            }
        });
    }

    /**
     * 自動起票ログを取得
     * @param {number} limit - 取得件数
     * @returns {Array} ログ配列
     */
    getAutoTicketLogs(limit = 50) {
        return getLocalStorage('auto_ticket_logs', []).slice(0, limit);
    }

    /**
     * 通知を取得
     * @param {string} targetUser - 対象ユーザー
     * @param {boolean} unreadOnly - 未読のみ
     * @returns {Array} 通知配列
     */
    getNotifications(targetUser = null, unreadOnly = false) {
        let notifications = getLocalStorage('site_notifications', []);

        if (targetUser) {
            notifications = notifications.filter(n => n.targetUser === targetUser);
        }

        if (unreadOnly) {
            notifications = notifications.filter(n => !n.read);
        }

        return notifications;
    }

    /**
     * 通知を既読にする
     * @param {string} notificationId - 通知ID
     */
    markNotificationAsRead(notificationId) {
        const notifications = getLocalStorage('site_notifications', []);
        const notification = notifications.find(n => n.id === notificationId);
        
        if (notification) {
            notification.read = true;
            notification.readAt = new Date().toISOString();
            setLocalStorage('site_notifications', notifications);
        }
    }
}

// グローバルインスタンスを作成
const statusManager = new StatusManager();
