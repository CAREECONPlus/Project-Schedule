/**
 * utils.js - 共通ユーティリティ関数
 * 日付処理、バリデーション、フォーマット等の汎用関数を提供
 */

// =============================================================================
// 日付関連ユーティリティ
// =============================================================================

/**
 * 日付をYYYY-MM-DD形式の文字列に変換
 * @param {Date|string} date - 変換する日付
 * @returns {string} YYYY-MM-DD形式の文字列
 */
function formatDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    return d.toISOString().split('T')[0];
}

/**
 * 日付を日本語形式で表示（YYYY年M月D日）
 * @param {Date|string} date - 変換する日付
 * @returns {string} YYYY年M月D日形式の文字列
 */
function formatDateJP(date) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    
    return `${year}年${month}月${day}日`;
}

/**
 * 日付を相対的な表現で表示（今日、昨日、○日前など）
 * @param {Date|string} date - 変換する日付
 * @returns {string} 相対的な日付表現
 */
function formatRelativeDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const today = new Date();
    const diffTime = today.getTime() - d.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今日';
    if (diffDays === 1) return '昨日';
    if (diffDays === -1) return '明日';
    if (diffDays > 0) return `${diffDays}日前`;
    if (diffDays < 0) return `${Math.abs(diffDays)}日後`;
    
    return formatDateJP(date);
}

/**
 * 2つの日付間の日数を計算
 * @param {Date|string} startDate - 開始日
 * @param {Date|string} endDate - 終了日
 * @returns {number} 日数（負の値の場合は過去）
 */
function calculateDaysDifference(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 現在日付から指定日数後の日付を取得
 * @param {number} days - 日数
 * @returns {Date} 指定日数後の日付
 */
function addDays(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}

/**
 * 週の開始日（月曜日）を取得
 * @param {Date|string} date - 基準日付
 * @returns {Date} 週の開始日
 */
function getWeekStart(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

/**
 * 月の開始日を取得
 * @param {Date|string} date - 基準日付
 * @returns {Date} 月の開始日
 */
function getMonthStart(date = new Date()) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

// =============================================================================
// 数値・金額フォーマット
// =============================================================================

/**
 * 数値を金額形式でフォーマット（カンマ区切り + 円マーク）
 * @param {number} amount - 金額
 * @returns {string} フォーマットされた金額文字列
 */
function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return '¥0';
    
    return '¥' + Number(amount).toLocaleString('ja-JP');
}

/**
 * 数値を3桁区切りでフォーマット
 * @param {number} number - 数値
 * @returns {string} フォーマットされた数値文字列
 */
function formatNumber(number) {
    if (number === null || number === undefined || isNaN(number)) return '0';
    
    return Number(number).toLocaleString('ja-JP');
}

/**
 * パーセンテージをフォーマット
 * @param {number} value - 値（0-1 または 0-100）
 * @param {boolean} isDecimal - 小数点形式（0-1）かどうか
 * @returns {string} パーセンテージ文字列
 */
function formatPercentage(value, isDecimal = true) {
    if (value === null || value === undefined || isNaN(value)) return '0%';
    
    const percentage = isDecimal ? value * 100 : value;
    return Math.round(percentage) + '%';
}

// =============================================================================
// バリデーション関数
// =============================================================================

/**
 * メールアドレスの形式をチェック
 * @param {string} email - メールアドレス
 * @returns {boolean} 有効かどうか
 */
function isValidEmail(email) {
    if (!email) return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * 電話番号の形式をチェック（日本の形式）
 * @param {string} phone - 電話番号
 * @returns {boolean} 有効かどうか
 */
function isValidPhone(phone) {
    if (!phone) return false;
    
    // ハイフンありなしどちらも対応
    const phoneRegex = /^(\d{2,4})-?(\d{2,4})-?(\d{4})$|^(\d{10,11})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * 日付の有効性をチェック
 * @param {string|Date} date - 日付
 * @returns {boolean} 有効かどうか
 */
function isValidDate(date) {
    if (!date) return false;
    
    const d = new Date(date);
    return !isNaN(d.getTime());
}

/**
 * 必須フィールドのチェック
 * @param {any} value - チェックする値
 * @returns {boolean} 値が存在するかどうか
 */
function isRequired(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
}

/**
 * フォームデータをバリデーション
 * @param {Object} data - バリデーションするデータ
 * @param {Object} rules - バリデーションルール
 * @returns {Object} {isValid: boolean, errors: Object}
 */
function validateForm(data, rules) {
    const errors = {};
    let isValid = true;
    
    for (const field in rules) {
        const value = data[field];
        const fieldRules = rules[field];
        
        // 必須チェック
        if (fieldRules.required && !isRequired(value)) {
            errors[field] = fieldRules.requiredMessage || `${field}は必須です`;
            isValid = false;
            continue;
        }
        
        // 値が存在する場合のみ追加バリデーション
        if (value) {
            // メールアドレスチェック
            if (fieldRules.email && !isValidEmail(value)) {
                errors[field] = fieldRules.emailMessage || 'メールアドレスの形式が正しくありません';
                isValid = false;
            }
            
            // 電話番号チェック
            if (fieldRules.phone && !isValidPhone(value)) {
                errors[field] = fieldRules.phoneMessage || '電話番号の形式が正しくありません';
                isValid = false;
            }
            
            // 日付チェック
            if (fieldRules.date && !isValidDate(value)) {
                errors[field] = fieldRules.dateMessage || '日付の形式が正しくありません';
                isValid = false;
            }
            
            // 最小値チェック
            if (fieldRules.min !== undefined && Number(value) < fieldRules.min) {
                errors[field] = fieldRules.minMessage || `${fieldRules.min}以上で入力してください`;
                isValid = false;
            }
            
            // 最大値チェック
            if (fieldRules.max !== undefined && Number(value) > fieldRules.max) {
                errors[field] = fieldRules.maxMessage || `${fieldRules.max}以下で入力してください`;
                isValid = false;
            }
        }
    }
    
    return { isValid, errors };
}

// =============================================================================
// DOM操作ユーティリティ
// =============================================================================

/**
 * 要素の表示/非表示を切り替え
 * @param {string|Element} element - 要素またはセレクタ
 * @param {boolean} show - 表示するかどうか
 */
function toggleElement(element, show) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) {
        el.style.display = show ? 'block' : 'none';
    }
}

/**
 * 要素にクラスを追加/削除
 * @param {string|Element} element - 要素またはセレクタ
 * @param {string} className - クラス名
 * @param {boolean} add - 追加するかどうか
 */
function toggleClass(element, className, add) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) {
        if (add) {
            el.classList.add(className);
        } else {
            el.classList.remove(className);
        }
    }
}

/**
 * 要素のテキストを安全に設定
 * @param {string|Element} element - 要素またはセレクタ
 * @param {string} text - 設定するテキスト
 */
function setElementText(element, text) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) {
        el.textContent = text || '';
    }
}

/**
 * 要素の値を安全に設定
 * @param {string|Element} element - 要素またはセレクタ
 * @param {string} value - 設定する値
 */
function setElementValue(element, value) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) {
        el.value = value || '';
    }
}

// =============================================================================
// 配列・オブジェクト操作
// =============================================================================

/**
 * 配列から重複を除去
 * @param {Array} array - 元の配列
 * @returns {Array} 重複を除去した配列
 */
function uniqueArray(array) {
    return [...new Set(array)];
}

/**
 * オブジェクトの深いコピーを作成
 * @param {Object} obj - コピーするオブジェクト
 * @returns {Object} コピーされたオブジェクト
 */
function deepCopy(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepCopy(item));
    
    const copy = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            copy[key] = deepCopy(obj[key]);
        }
    }
    return copy;
}

/**
 * オブジェクトから空の値を除去
 * @param {Object} obj - 処理するオブジェクト
 * @returns {Object} 空の値を除去したオブジェクト
 */
function removeEmptyValues(obj) {
    const result = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (value !== null && value !== undefined && value !== '') {
                result[key] = value;
            }
        }
    }
    return result;
}

// =============================================================================
// 文字列操作
// =============================================================================

/**
 * 文字列を省略表示
 * @param {string} str - 元の文字列
 * @param {number} maxLength - 最大文字数
 * @returns {string} 省略された文字列
 */
function truncateString(str, maxLength = 50) {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}

/**
 * 文字列をケバブケースに変換
 * @param {string} str - 元の文字列
 * @returns {string} ケバブケースの文字列
 */
function toKebabCase(str) {
    if (!str) return '';
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/\s+/g, '-')
        .toLowerCase();
}

/**
 * 文字列をキャメルケースに変換
 * @param {string} str - 元の文字列
 * @returns {string} キャメルケースの文字列
 */
function toCamelCase(str) {
    if (!str) return '';
    return str
        .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
        .replace(/^[A-Z]/, char => char.toLowerCase());
}

// =============================================================================
// ローカルストレージ操作
// =============================================================================

/**
 * ローカルストレージにJSONデータを保存
 * @param {string} key - キー
 * @param {any} data - 保存するデータ
 */
function setLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('ローカルストレージへの保存に失敗:', error);
    }
}

/**
 * ローカルストレージからJSONデータを取得
 * @param {string} key - キー
 * @param {any} defaultValue - デフォルト値
 * @returns {any} 取得したデータ
 */
function getLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('ローカルストレージからの取得に失敗:', error);
        return defaultValue;
    }
}

/**
 * ローカルストレージからデータを削除
 * @param {string} key - キー
 */
function removeLocalStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('ローカルストレージからの削除に失敗:', error);
    }
}

// =============================================================================
// デバッグ・ログ
// =============================================================================

/**
 * デバッグログを出力（開発環境のみ）
 * @param {string} message - ログメッセージ
 * @param {any} data - ログデータ
 */
function debugLog(message, data = null) {
    if (window.DEBUG_MODE || window.location.hostname === 'localhost') {
        console.log(`[DEBUG] ${message}`, data);
    }
}

/**
 * エラーログを出力
 * @param {string} message - エラーメッセージ
 * @param {Error} error - エラーオブジェクト
 */
function errorLog(message, error = null) {
    console.error(`[ERROR] ${message}`, error);
}

// =============================================================================
// UUID生成
// =============================================================================

/**
 * 簡易UUID（v4形式）を生成
 * @returns {string} UUID
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * 短いID（8文字）を生成
 * @returns {string} 短いID
 */
function generateShortId() {
    return Math.random().toString(36).substring(2, 10);
}

// =============================================================================
// エクスポート（グローバル関数として利用可能）
// =============================================================================

// 必要に応じてモジュール形式でエクスポートすることも可能
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // 日付関連
        formatDate,
        formatDateJP,
        formatRelativeDate,
        calculateDaysDifference,
        addDays,
        getWeekStart,
        getMonthStart,
        
        // 数値・金額フォーマット
        formatCurrency,
        formatNumber,
        formatPercentage,
        
        // バリデーション
        isValidEmail,
        isValidPhone,
        isValidDate,
        isRequired,
        validateForm,
        
        // DOM操作
        toggleElement,
        toggleClass,
        setElementText,
        setElementValue,
        
        // 配列・オブジェクト操作
        uniqueArray,
        deepCopy,
        removeEmptyValues,
        
        // 文字列操作
        truncateString,
        toKebabCase,
        toCamelCase,
        
        // ローカルストレージ
        setLocalStorage,
        getLocalStorage,
        removeLocalStorage,
        
        // デバッグ・ログ
        debugLog,
        errorLog,
        
        // ID生成
        generateUUID,
        generateShortId
    };
}
