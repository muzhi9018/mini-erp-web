export default {
  'actions.auth.retryAfter': '请等待至少 {seconds} 秒后再重新确认。',
  'actions.generate.title': '生成并替换当前密码？',
  'actions.generate.warning':
    '随机生成将替换当前填写的密码。保存后，原密码可能无法从密码库找回。此操作不会修改对应网站的密码，请确认已妥善保管原密码后再继续。',
  'actions.generate.confirm': '确认生成并替换',
  'actions.generate.pending': '生成中…',
  'actions.generate.draftOnly':
    '新密码已填入，尚未保存。请自行到对应网站修改密码。',
  'actions.generate.failure': '生成失败，原输入已保留，请重试。',
  'actions.delete.title': '删除此密码？',
  'actions.delete.consequence':
    '删除后将移入“已删除”，可在 30 天内恢复；到期后自动永久删除。',
  'actions.delete.confirm': '验证并删除',
  'actions.purge.title': '永久删除此密码？',
  'actions.purge.consequence': '此密码将立即永久删除，无法恢复。',
  'actions.purge.confirm': '验证并永久删除',
  'actions.group.title': '删除此账号组？',
  'actions.group.consequence':
    '此账号组将被直接删除，无法恢复；成员密码仍保留。',
  'actions.auth.required': '继续后需使用 Passkey 验证。',
  'actions.auth.preparing': '正在准备本次 Passkey 验证…',
  'actions.auth.waiting': '请在浏览器或设备的系统弹窗中完成 Passkey 验证。',
  'actions.auth.boundTo': '本次验证仅用于{action}「{name}」。',
  'actions.auth.submitting':
    'Passkey 验证已完成，正在提交本次操作。请等待结果。',
  'actions.auth.canceled': '你已取消 Passkey 验证，本次操作未提交。',
  'actions.auth.failed': 'Passkey 验证未通过，本次操作未提交。',
  'actions.auth.expired': '本次验证已过期，请重新确认并验证。',
  'actions.auth.unavailable':
    '没有可用的 Passkey。请使用已注册的备用 Passkey，或先到“安全与管理”恢复身份。',
  'actions.auth.unsupported':
    '此浏览器不支持 Passkey 验证。请使用支持 Passkey 的浏览器重新操作。',
  'actions.auth.preserveDraft': '密码和未保存的编辑内容均已保留。',
  'actions.auth.preserveDeleted': '密码仍保留在已删除中，原保留期限不变。',
  'actions.auth.unknownTitle': '删除结果待确认',
  'actions.auth.unknown':
    '请求已发出，暂未确认操作结果。请先查询结果，避免重复删除。',
  'actions.auth.noUndoRequest': '关闭此窗口不会撤回已发出的请求。',
  'actions.auth.reconfirm': '重新确认',
  'actions.auth.query': '查询操作结果',
  'actions.auth.cancelOperation': '取消操作',
  'actions.common.cancel': '取消',
  'actions.common.backToEditor': '返回编辑',
  'actions.common.backToDetail': '返回详情',
  'actions.auth.title': '验证本次删除操作',
  'actions.auth.stopped': '尚未完成删除',
  'actions.auth.querying': '正在查询原操作的成功回执…',
  'actions.auth.conflict':
    '条目或批次版本已变化，本次操作未完成。请返回并重新同步，保留的编辑内容可先核对。',
  'actions.auth.missing':
    '记录已不存在或不可访问；这不能证明本次删除成功。请返回并刷新。',
  'actions.auth.locked':
    '密钥轮换正在进行，暂不能删除。请在维护完成后重新同步并确认。',
  'actions.auth.service':
    '服务暂不可用，本次操作未提交。请稍后重新确认并验证。',
  'actions.auth.rateLimited': '请求过于频繁，请等待后再重新发起操作。',
  'actions.auth.noReceipt':
    '未取得原操作的成功回执，本次不能认定成功。请重新确认并验证，将使用原请求和原幂等键重试。',
  'actions.auth.preserveGroup': '账号组与成员密码均已保留。',
  'actions.auth.tooLarge':
    '关联组更新与删除超过单次原子请求上限。未修改任何数据，请先手动移出部分账号组后重新操作。',
  'actions.group.deleted': '账号组已删除，成员密码仍保留。',
};
