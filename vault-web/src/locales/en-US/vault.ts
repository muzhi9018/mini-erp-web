export default {
  'vault.title': 'Personal vault',
  'vault.subtitle': 'Independent sign-in · encrypted in your browser',
  'vault.previewNotice':
    'Test accounts only: recovery, key rotation and encrypted backup screens are not available yet. Do not store real passwords.',
  'vault.login': 'Sign in',
  'vault.username': 'Username',
  'vault.loginPassword':
    'System sign-in password (separate from your master password)',
  'vault.required': 'This field is required',
  'vault.mfa': 'Identity verification',
  'vault.mfaHint':
    'Verify an existing passkey. For first use or identity recovery, register a passkey first, then verify it.',
  'vault.authenticate': 'Verify passkey',
  'vault.passkeyLabel': 'Passkey name',
  'vault.register': 'Register passkey',
  'vault.mfaRecoveryCode':
    'One-time MFA recovery code (separate from the decryption recovery key)',
  'vault.recoverIdentity': 'Recover identity and enroll a new passkey',
  'vault.codesHint':
    'Keep the one-time MFA codes offline, then reimport the file to verify it. These codes recover identity; they cannot decrypt your vault. Vault access is enabled after confirmation.',
  'vault.issueCodes': 'Generate MFA recovery codes',
  'vault.downloadCodes': 'Download MFA recovery codes',
  'vault.reimportCodes': 'Reimport the downloaded MFA codes file',
  'vault.confirmCodes': 'Confirm and continue',
  'vault.setup': 'Create your vault',
  'vault.setupHint':
    'Use a master password of at least 16 characters, preferably random words, different from your system password. Decryption requires your master password and account key, or your recovery file. If both paths are lost, administrators cannot recover the vault.',
  'vault.masterPassword': 'Master password',
  'vault.confirmPassword': 'Confirm master password',
  'vault.passwordRule':
    'Use at least 16 Unicode characters and at most 1024 UTF-8 bytes',
  'vault.passwordMismatch': 'The master passwords do not match',
  'vault.prepare': 'Generate keys and files',
  'vault.filesHint':
    'Keep these secret files separately offline. Download and reimport both before creating the vault. The files do not contain your master password.',
  'vault.downloadAccount': 'Download account key file',
  'vault.downloadRecovery': 'Download decryption recovery file',
  'vault.reimportAccount': 'Reimport account key file',
  'vault.reimportRecovery': 'Reimport decryption recovery file',
  'vault.filesVerified': 'Files verified',
  'vault.verifyFiles': 'Verify both files',
  'vault.finishSetup': 'Create vault',
  'vault.cancel': 'Cancel',
  'vault.unlock': 'Unlock vault',
  'vault.unlockHint':
    'Import your account key and enter your master password. Reimport after locking or refreshing this page. Neither the key nor your master password is uploaded.',
  'vault.accountFile': 'Account key file',
  'vault.items': 'Password entries',
  'vault.newItem': 'Add entry',
  'vault.editItem': 'Edit entry',
  'vault.refresh': 'Sync again',
  'vault.loadingMeta': 'Loading vault status…',
  'vault.metaUnavailable':
    'Vault status is unavailable. Use “Sync again” to retry.',
  'vault.search': 'Search titles, usernames, websites and tags locally',
  'vault.itemTitle': 'Title',
  'vault.website': 'Website',
  'vault.urlRule': 'Use an http or https URL without embedded credentials',
  'vault.password': 'Password',
  'vault.notes': 'Notes',
  'vault.tags': 'Tags',
  'vault.generatePassword': 'Generate a 24-character random password',
  'vault.uncertainWrite':
    'The save result is unconfirmed. Retry sends the same ciphertext and idempotency key. You can also close and sync to check the result.',
  'vault.retrySave': 'Retry the same save',
  'vault.save': 'Save',
  'vault.itemRule': 'An entry must fit within 16 KiB and have at most 20 tags',
  'vault.actions': 'Actions',
  'vault.reveal': 'Reveal briefly',
  'vault.copy': 'Copy password',
  'vault.edit': 'Edit',
  'vault.delete': 'Delete',
  'vault.deleteConfirm': 'Delete this entry? This cannot be undone.',
  'vault.revealHint':
    'Hidden automatically after 20 seconds, or immediately when this tab goes into the background.',
  'vault.language': 'Language',
  'vault.lock': 'Lock',
  'vault.logout': 'Sign out',
  'vault.copied':
    'Password copied. Your system clipboard history may retain a copy.',
  'vault.lockHint':
    'Locks after 5 minutes of inactivity or 60 seconds in the background. Keys stay only in this page’s memory.',
  'vault.conflict':
    'The vault changed. Sync before editing again to preserve changes from other devices.',
  'vault.writeLocked':
    'A recovery or rotation task is in progress. Writes are temporarily locked.',
  'vault.reauthRequired':
    'Use “Verify passkey” to authenticate again, then retry this operation.',
  'vault.invalidFile':
    'The file, entry or protocol format is invalid. Check it and select the file again.',
  'vault.invalidResponse':
    'The vault service returned an invalid response. Keep your downloaded key files, reconnect and try again.',
  'vault.unlockFailed':
    'Unable to unlock or decrypt. Check your master password and key file; the ciphertext may also be damaged.',
  'vault.sessionExpired':
    'The session ended or this page locked. Reconnect, sign in or unlock again.',
  'vault.invalidCredentials': 'Incorrect username or system password',
  'vault.invalidRecoveryCode':
    'The MFA recovery code is invalid or already used. Check it and try again.',
  'vault.requestRejected':
    'Origin or CSRF validation failed. Reconnect and check the vault domain configuration.',
  'vault.requestFailed':
    'The operation did not complete. Check the connection or verify your identity and try again.',
  'vault.dismiss': 'Dismiss / reconnect',
  'vault.connect': 'Connect to vault service',
};
