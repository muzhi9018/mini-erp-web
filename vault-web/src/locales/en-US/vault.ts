export default {
  'vault.title': 'Personal vault',
  'vault.subtitle': 'Independent sign-in · encrypted in your browser',
  'vault.previewNotice':
    'TOTP, master password changes, key rotation and encrypted backup/restore are available. Real HTTPS, hardware Passkey, cross-device recovery and production security acceptance still require verification. Use test accounts first.',
  'vault.login': 'Sign in',
  'vault.username': 'Username',
  'vault.loginPassword': 'Sign-in password',
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
  'vault.recoveryReauthHint':
    'If recent authentication expires, verify your passkey here, then retry generating or confirming codes. Verification does not generate new codes, and the imported file is kept.',
  'vault.recoveryReauthComplete':
    'Passkey verified. Retry generating recovery codes or confirming them with the current file.',
  'vault.setup': 'Create your vault',
  'vault.setupHint':
    'Use a master password of at least 8 characters, preferably random words, different from your system password. Decryption requires your master password and account key, or your recovery file. If both paths are lost, administrators cannot recover the vault.',
  'vault.masterPassword': 'Master password',
  'vault.confirmPassword': 'Confirm master password',
  'vault.passwordRule':
    'Use at least 8 Unicode characters and at most 1024 UTF-8 bytes',
  'vault.passwordMismatch': 'The master passwords do not match',
  'vault.prepare': 'Generate keys and files',
  'vault.filesHint':
    'Keep these secret files separately offline. Download and reimport both before creating the vault. The files do not contain your master password.',
  'vault.downloadAccount': 'Download account key file',
  'vault.downloadRecovery': 'Download vault recovery file',
  'vault.accountKeyFilename': 'vault-account-key.json',
  'vault.recoveryKeyFilename': 'vault-recovery-key.json',
  'vault.mfaRecoveryCodesFilename': 'vault-mfa-recovery-codes.json',
  'vault.encryptedBackupFilename': 'vault-encrypted-backup.json',
  'vault.taskFilename': 'vault-task.json',
  'vault.reimportAccount': 'Reimport account key file',
  'vault.reimportRecovery': 'Reimport vault recovery file',
  'vault.filesVerified': 'Files verified',
  'vault.verifyFiles': 'Verify both files',
  'vault.finishSetup': 'Create vault',
  'vault.cancel': 'Cancel',
  'vault.unlock': 'Unlock vault',
  'vault.unlockHint':
    'The account key stays in this tab after an ordinary lock. Enter your master password to unlock again. Reloading, closing or signing out requires importing the file again. Keys and passwords are never uploaded.',
  'vault.accountFile': 'Account key file',
  'vault.recoveryFile': 'Vault recovery file',
  'vault.items': 'Password entries',
  'vault.newItem': 'Add password',
  'vault.editItem': 'Edit password',
  'vault.refresh': 'Sync again',
  'vault.loadingMeta': 'Loading vault status…',
  'vault.metaUnavailable':
    'Vault status is unavailable. Use “Sync again” to retry.',
  'vault.search': 'Search titles, usernames, websites and tags locally',
  'vault.itemTitle': 'Name',
  'vault.website': 'Website',
  'vault.urlRule': 'Use an http or https URL without embedded credentials',
  'vault.password': 'Password',
  'vault.notes': 'Notes',
  'vault.tags': 'Tags',
  'vault.generatePassword': 'Generate password',
  'vault.uncertainWrite':
    'The save result is unconfirmed. Retry sends the same ciphertext and idempotency key. You can also close and sync to check the result.',
  'vault.retrySave': 'Retry the same save',
  'vault.save': 'Save password',
  'vault.itemRule': 'An entry must fit within 16 KiB and have at most 20 tags',
  'vault.actions': 'Actions',
  'vault.reveal': 'Show password',
  'vault.copy': 'Copy password',
  'vault.edit': 'Edit',
  'vault.delete': 'Delete',
  'vault.deleteConfirm':
    'Move this password to Deleted for 30 days, then permanently delete it.',
  'vault.revealHint':
    'Hidden automatically after 20 seconds, or immediately when this tab goes into the background.',
  'vault.language': 'Language',
  'vault.switchToLight': 'Switch to light mode',
  'vault.switchToDark': 'Switch to dark mode',
  'vault.lock': 'Lock',
  'vault.logout': 'Sign out',
  'vault.copied': 'Copied. Your system clipboard history may retain a copy.',
  'vault.lockHint':
    'Locks after {idleMinutes, plural, one {# minute} other {# minutes}} of inactivity or {backgroundSeconds, plural, one {# second} other {# seconds}} in the background. Keys stay only in this page’s memory.',
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
  'vault.connectionFailed':
    'Unable to connect to the vault service. Check your network and try again. Keep your downloaded key files; you do not need to generate new ones.',
  'vault.unlockFailed':
    'Unable to unlock or decrypt. Check your master password and key file; the ciphertext may also be damaged.',
  'vault.sessionExpired':
    'The session ended or this page locked. Reconnect, sign in or unlock again.',
  'vault.invalidCredentials': 'Incorrect username or system password',
  'vault.invalidRecoveryCode':
    'The MFA recovery code is invalid or already used. Check it and try again.',
  'vault.requestRejected':
    'Origin or CSRF validation failed. Reconnect and check the vault domain configuration.',
  'vault.passkeyExists':
    'This authenticator already holds a passkey for this account. Choose another device, password manager or security key in the system dialog. Changing the label cannot register the same credential again.',
  'vault.passkeyCancelled':
    'The passkey operation was cancelled, timed out or denied. Try again and complete verification in the system dialog.',
  'vault.passkeyUnsupported':
    'This authenticator does not support the required passkey. Choose another device, password manager or security key.',
  'vault.passkeyOriginInvalid':
    'A passkey cannot be created or used on this site. Check HTTPS and the passkey domain configuration.',
  'vault.passkeyInvalid':
    'Passkey verification failed. Start the current action again and complete system verification.',
  'vault.passkeyExpired':
    'The passkey verification request is invalid or expired. Select the current action again to restart verification.',
  'vault.requestFailed':
    'The operation did not complete. Check the connection or verify your identity and try again.',
  'vault.dismiss': 'Dismiss / reconnect',
  'vault.connect': 'Connect to vault service',
  'vault.testNotice': 'Test environment · Do not store real passwords',
  'vault.viewLimitations': 'View limitations',
  'vault.welcome': 'Welcome back',
  'vault.loginIntro': 'Sign in to your personal vault.',
  'vault.usernamePlaceholder': 'Enter your system username',
  'vault.loginPasswordPlaceholder': 'Enter your sign-in password',
  'vault.continue': 'Log in and continue',
  'vault.loginFoot':
    'Sign in with your MINI ERP account. Enter your master password when unlocking.',
  'vault.brandLine1': 'Your passwords,',
  'vault.brandLine2': 'safely kept.',
  'vault.brandHint': 'Independent verification. Local unlocking.',
  'vault.progress': 'Sign-in and unlock progress',
  'vault.stepLogin': 'Sign in',
  'vault.stepVerify': 'Verify',
  'vault.stepUnlock': 'Unlock',
  'vault.stepLoginHint': 'Use your system account',
  'vault.stepVerifyHint': 'Verify with a passkey',
  'vault.stepUnlockHint': 'Decrypt locally in this tab',
  'vault.verifyTitle': 'Confirm it’s you',
  'vault.verifyIntro':
    'Use your fingerprint, face or security key to verify your passkey.',
  'vault.verifyFoot':
    'After verification, your master password and account key are still required to unlock the vault.',
  'vault.accountVerified': 'Account verified',
  'vault.enrollTitle': 'Set up your passkey',
  'vault.enrollIntro':
    'Create a passkey, then verify the new credential to finish identity setup.',
  'vault.registeredTitle': 'Verify once more to finish setup',
  'vault.registeredIntro': 'Verify with the passkey you just created.',
  'vault.passkeyCreated': 'Passkey created',
  'vault.verifyNewPasskey': 'Verify new passkey',
  'vault.devicePlaceholder': 'For example: My device',
  'vault.passkeyHelp': 'Can’t use your passkey?',
  'vault.switchAccount': 'Switch account',
  'vault.loadingIdentity': 'Checking verification options…',
  'vault.recoveryTitle': 'Recover your identity',
  'vault.recoveryIntro':
    'Enter a one-time MFA recovery code, then set up a new passkey.',
  'vault.recoveryWarning':
    'Identity recovery revokes existing passkeys. Unlocking still requires your master password and account key.',
  'vault.backVerify': 'Back to passkey verification',
  'vault.codesTitle': 'Save your identity recovery codes',
  'vault.codesFoot':
    'MFA codes recover your identity only. Store them separately from your vault recovery file.',
  'vault.chooseSavedFile': 'Select the file you just saved',
  'vault.downloadFirst': 'Save the file first, then reimport it to verify',
  'vault.unlockTitle': 'Unlock your vault',
  'vault.unlockIntro':
    'Select your account key file, then enter your master password. Neither is uploaded.',
  'vault.chooseAccountFile': 'Select account key file',
  'vault.fileRefreshHint':
    'Select again after reloading, closing or signing out',
  'vault.fileMatched': 'File matches this vault',
  'vault.chooseFile': '＋ Select',
  'vault.changeFile': 'Change',
  'vault.fileVersion':
    'Unsupported file version. Select the account key file for this vault.',
  'vault.fileMismatch':
    'This file belongs to a different account or vault. Select another file.',
  'vault.masterPlaceholder': 'Enter your vault master password',
  'vault.unlockHelp': 'Can’t unlock?',
  'vault.unlockHelpText':
    'Check that the file belongs to this account and preserve password spaces and case. If unlock materials are lost, open vault management and rotate all keys using the independent recovery file.',
  'vault.navigation': 'Vault navigation',
  'vault.allPasswords': 'All passwords',
  'vault.recent': 'Recently updated',
  'vault.recentUnavailable':
    'The current API does not provide update times, so recent sorting is unavailable.',
  'vault.security': 'Security and access',
  'vault.personalSpace': 'Personal space',
  'vault.syncing': 'Working…',
  'vault.synced': 'Synced',
  'vault.notSaved': 'Save unconfirmed',
  'vault.syncFailed': 'Sync failed. Sync again.',
  'vault.entryCount': '{count} entries',
  'vault.localSearch': 'Local search',
  'vault.filterTags': 'Filter tags',
  'vault.noAccount': 'No username',
  'vault.empty': 'No passwords saved yet',
  'vault.firstItem': 'Add your first password',
  'vault.noResults': 'No matching passwords',
  'vault.selectItem': 'Select an entry to view details',
  'vault.detailPanel': 'Password details',
  'vault.editorPanel': 'Password editor',
  'vault.backList': 'Back to passwords',
  'vault.loginAccount': 'Sign-in account',
  'vault.copyUsername': 'Copy username',
  'vault.copyWebsite': 'Copy website',
  'vault.hideNow': 'Hide now',
  'vault.hideCountdown': 'Hidden in {seconds}s',
  'vault.notesHidden': 'Notes hidden',
  'vault.notFilled': 'Not provided',
  'vault.noNotes': 'No notes',
  'vault.localOnly': 'Decrypted only in this tab',
  'vault.workspaceFoot':
    'Local decryption · passwords hidden when backgrounded',
  'vault.copyFailed':
    'The browser did not allow copying. Select the text below manually; it will be hidden after 20 seconds.',
  'vault.closeEditor': 'Close editor',
  'vault.discardConfirm': 'Discard unsaved changes?',
  'vault.discard': 'Discard changes',
  'vault.keepEditing': 'Keep editing',
  'vault.reloadWarning':
    'Reloading discards this draft. Review your changes first.',
  'vault.reloadItem': 'Discard draft and load latest',
  'vault.passwordLength': 'Password length',
  'vault.includeSymbols': 'Include symbols',
  'vault.saved': 'Password saved',
  'vault.deleted': 'Entry deleted',
  'vault.autoLock': 'Automatic lock',
  'vault.localUnlock': 'Local unlocking',
  'vault.unavailableTitle': 'Vault recovery, key rotation and encrypted backup',
  'vault.unavailable': 'Not available',
  'vault.manualCopy': 'Select text to copy',
  'vault.manageVault': 'Vault management',
  'vault.maintenanceHint':
    'Use the Passkey button above for recent authentication. Automatic locking also protects this page; backgrounding clears inputs. Keep the task file to continue later.',
  'vault.credentials': 'Login credentials and MFA recovery codes',
  'vault.credentialsHint':
    'Manage vault login credentials here. Keep a spare Passkey and MFA recovery codes outside the vault. The last credential cannot be revoked.',
  'vault.listPasskeys': 'Load Passkeys',
  'vault.revoke': 'Revoke credential',
  'vault.revokeWarning':
    'Revoking this Passkey ends existing sessions. Revoke and sign in again?',
  'vault.codesReplaced':
    'New MFA recovery codes are active. The previous batch is revoked.',
  'vault.backup': 'Encrypted backup and local verification',
  'vault.backupHint':
    'Backups contain ciphertext and require the source master password plus account key, or its recovery key. Reimport the downloaded file to check integrity. Verification does not write to the server.',
  'vault.backupFile': 'Encrypted backup file',
  'vault.backupValid':
    'Authenticated manifest and all {count} encrypted entries verified.',
  'vault.exportBackup': 'Download verified encrypted backup',
  'vault.verifyBackup': 'Verify backup locally',
  'vault.changeMaster': 'Change master password',
  'vault.masterWarning':
    'Requires the original account key and old master password. Account and recovery files remain valid. Sign in again afterwards. Old backups still accept the old password; rotate all keys if compromised. If the network result is uncertain, sign in and try the new password before generating another change.',
  'vault.newMaster': 'New master password',
  'vault.rotation': 'Rotate all keys / recover with recovery key',
  'vault.restore': 'Restore backup into an empty account',
  'vault.rotationWarning':
    'Verify the source backup, then generate and retain new key files. Uploads remain staged until every entry is downloaded and verified. Commit ends the session; unlock with the new files to confirm. Old backups remain usable. Change compromised passwords and TOTP at the original websites.',
  'vault.useRecoveryKey': 'Use vault recovery key (RK)',
  'vault.resumeTask': 'Inspect / resume a task',
  'vault.resumeHint':
    'After signing in again or reloading, import the task file to inspect its state. Pending tasks require source unlock materials, both new key files and the new master password. A revoked authentication epoch permits cancellation only.',
  'vault.taskId': 'Task ID',
  'vault.taskFile': 'Import task file',
  'vault.taskState': 'State and upload progress',
  'vault.saveTask': 'Save task file',
  'vault.queryTask': 'Check server state',
  'vault.newAccountFile': 'New account key file',
  'vault.newRecoveryFile': 'New vault recovery file',
  'vault.resumeUpload': 'Verify materials and resume upload',
  'vault.retryUpload': 'Continue upload and verify staged data',
  'vault.stagingVerified':
    'All staged entries were downloaded, decrypted and matched against the source. Ready to commit.',
  'vault.commitRotation': 'Commit and end session',
  'vault.startRotation': 'Start staging and upload',
  'vault.committedHint':
    'The server confirms commit. Return and unlock with the new files and password to check the restored contents.',
  'vault.cancelTask': 'Cancel staged task',
  'vault.cancelTaskHint':
    'Cancellation discards uncommitted staged data and retains the original vault. Tasks expire after 30 minutes.',
  'vault.confirmAction': 'Confirm action',
  'vault.upgradeRequired':
    'This client does not support the required content version. Writes are stopped. Update the client; original ciphertext can still be backed up.',
  'vault.totp': 'Authenticator code',
  'vault.totpRisk':
    'Storing passwords and TOTP together exposes both to a compromised unlocked device. Enable, confirm or revoke TOTP on the original website; changes here do not update that site.',
  'vault.totpKept':
    'Saved configuration will be preserved. Its seed is not returned to this form.',
  'vault.totpReplace': 'Replace configuration',
  'vault.totpRemove': 'Remove configuration',
  'vault.totpAdd': 'Add 2FA',
  'vault.totpURI': 'Paste otpauth URI',
  'vault.totpImport': 'Parse URI',
  'vault.totpQR':
    'Local QR image (PNG/JPEG/WebP, ≤2 MiB, ≤4096 per side, 8 MP, 5-second limit)',
  'vault.totpSecret': 'Base32 seed',
  'vault.totpIssuer': 'Service name',
  'vault.totpAccount': 'Account',
  'vault.totpAlgorithm': 'HMAC algorithm',
  'vault.totpDigits': 'Code digits',
  'vault.totpPeriod': 'Period (seconds)',
  'vault.totpChangeWarning':
    'Replace or remove this entry’s TOTP? First verify the new configuration or revoke the old one at the original website. This change takes effect when the whole entry is saved.',
  'vault.totpInvalid':
    'Unable to read this configuration. Check the setup key, service name and parameters. HOTP, unknown and duplicate parameters are unsupported.',
  'vault.totpShow': 'Show authenticator code',
  'vault.totpCopy': 'Copy current authenticator code',
  'vault.totpClock':
    'Enable automatic device time. Codes are valid only in the current time window; this vault cannot confirm website acceptance. Clipboard history may retain copied codes.',
  'vault.restoreEmptyOnly':
    'The target vault already exists or contains entries and cannot be overwritten. Restore into an uninitialized or empty account.',
  'vault.taskExpired':
    'The staged task has ended or exceeded 30 minutes. Check its server state. If uncommitted, the original vault remains usable; start a new task.',
};
