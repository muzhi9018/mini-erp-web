export default {
  'actions.auth.retryAfter': '請等候至少 {seconds} 秒後再重新確認。',
  'actions.generate.title': '產生並取代目前密碼？',
  'actions.generate.warning':
    '隨機產生將取代目前填寫的密碼。儲存後，原密碼可能無法從密碼庫找回。此操作不會修改對應網站的密碼，請確認已妥善保管原密碼後再繼續。',
  'actions.generate.confirm': '確認產生並取代',
  'actions.generate.pending': '產生中…',
  'actions.generate.draftOnly':
    '新密碼已填入，尚未儲存。請自行到對應網站修改密碼。',
  'actions.generate.failure': '產生失敗，原輸入已保留，請重試。',
  'actions.delete.title': '刪除此密碼？',
  'actions.delete.consequence':
    '刪除後將移入「已刪除」，可在 30 天內還原；到期後自動永久刪除。',
  'actions.delete.confirm': '驗證並刪除',
  'actions.purge.title': '永久刪除此密碼？',
  'actions.purge.consequence': '此密碼將立即永久刪除，無法還原。',
  'actions.purge.confirm': '驗證並永久刪除',
  'actions.group.title': '刪除此帳號群組？',
  'actions.group.consequence':
    '此帳號群組將被直接刪除，無法還原；成員密碼仍會保留。',
  'actions.auth.required': '繼續後需使用 Passkey 驗證。',
  'actions.auth.preparing': '正在準備本次 Passkey 驗證…',
  'actions.auth.waiting': '請在瀏覽器或裝置的系統對話框中完成 Passkey 驗證。',
  'actions.auth.boundTo': '本次驗證僅用於{action}「{name}」。',
  'actions.auth.submitting':
    'Passkey 驗證已完成，正在提交本次操作。請等候結果。',
  'actions.auth.canceled': '你已取消 Passkey 驗證，本次操作尚未提交。',
  'actions.auth.failed': 'Passkey 驗證未通過，本次操作尚未提交。',
  'actions.auth.expired': '本次驗證已過期，請重新確認並驗證。',
  'actions.auth.unavailable':
    '沒有可用的 Passkey。請使用已註冊的備用 Passkey，或先到「安全與管理」恢復身分。',
  'actions.auth.unsupported':
    '此瀏覽器不支援 Passkey 驗證。請使用支援 Passkey 的瀏覽器重新操作。',
  'actions.auth.preserveDraft': '密碼與尚未儲存的編輯內容均已保留。',
  'actions.auth.preserveDeleted': '密碼仍保留在已刪除中，原保留期限不變。',
  'actions.auth.unknownTitle': '刪除結果待確認',
  'actions.auth.unknown':
    '請求已送出，尚未確認操作結果。請先查詢結果，避免重複刪除。',
  'actions.auth.noUndoRequest': '關閉此視窗不會撤回已送出的請求。',
  'actions.auth.reconfirm': '重新確認',
  'actions.auth.query': '查詢操作結果',
  'actions.auth.cancelOperation': '取消操作',
  'actions.common.cancel': '取消',
  'actions.common.backToEditor': '返回編輯',
  'actions.common.backToDetail': '返回詳情',
  'actions.auth.title': '驗證本次刪除操作',
  'actions.auth.stopped': '尚未完成刪除',
  'actions.auth.querying': '正在查詢原操作的成功回執…',
  'actions.auth.conflict':
    '條目或批次版本已變更，本次操作未完成。請返回並重新同步，可先核對保留的編輯內容。',
  'actions.auth.missing':
    '記錄已不存在或無法存取；這不能證明本次刪除成功。請返回並重新整理。',
  'actions.auth.locked':
    '金鑰輪替正在進行，暫時無法刪除。請在維護完成後重新同步並確認。',
  'actions.auth.service':
    '服務暫時無法使用，本次操作尚未提交。請稍後重新確認並驗證。',
  'actions.auth.rateLimited': '請求過於頻繁，請等候後再重新發起操作。',
  'actions.auth.noReceipt':
    '未取得原操作的成功回執，目前無法認定成功。請重新確認並驗證，將使用原請求與原冪等鍵重試。',
  'actions.auth.preserveGroup': '帳號群組與成員密碼均已保留。',
  'actions.auth.tooLarge':
    '關聯群組更新與刪除超過單次原子請求上限。尚未修改任何資料，請先手動移出部分群組後重新操作。',
  'actions.group.deleted': '帳號群組已刪除，成員密碼仍會保留。',
};
