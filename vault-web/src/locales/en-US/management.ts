export default {
  'manage.title': 'Security & management',
  'manage.credentials': 'Sign-in & recovery codes',
  'manage.backup': 'Backup & verification',
  'manage.master': 'Change master password',
  'manage.rotation': 'Key rotation & recovery',
  'manage.restore': 'Restore from backup',
  'manage.tasks': 'Ongoing tasks',
  'manage.credentialsHint':
    'Manage sign-in credentials separately from local unlocking materials.',
  'manage.backupHint':
    'Save a complete encrypted backup and regularly verify it.',
  'manage.masterHint':
    'Update your unlocking password. Account and recovery keys remain valid.',
  'manage.rotationHint':
    'Replace all unlocking materials or recover decryption using your recovery file.',
  'manage.restoreHint':
    'Re-encrypt a verified source backup into this empty account. Existing items cannot be merged or overwritten.',
  'manage.taskHint':
    'After refreshing, signing in again or changing devices, query the original task before continuing.',
  'manage.navigation': 'Management navigation',
  'manage.accountGroup': 'Account & protection',
  'manage.recoveryGroup': 'Recovery & tasks',
  'manage.localNote':
    'Account and recovery keys are used locally for unlocking.',
  'manage.backVault': 'Back to vault',
  'manage.progress': 'Operation progress',
  'manage.previous': 'Previous',
  'manage.parsing': 'Reading and checking file…',
  'manage.fileLimit': 'JSON, up to 8 KiB; processed locally',
  'manage.backupLimit':
    'Encrypted JSON backup, up to 48 MiB; processed locally',
  'manage.choose': 'Choose',
  'manage.unlockMethod': 'Unlocking method',
  'manage.normalMethod': 'Master password + account key',
  'manage.sourceRecovery': 'Source vault recovery file',
  'manage.sourceAccount': 'Source account key file',
  'manage.sourcePassword': 'Source master password',
  'manage.recoveryDistinct':
    'Decrypts the vault; this is not an MFA recovery code file',
  'manage.fileVerified': 'Reimport verified',
  'manage.exportReimport': 'Export, then reimport from the saved location',
  'manage.export': 'Export',
  'manage.reimport': 'Reimport',
  'manage.newFilesHint':
    'Export and reimport both secret files separately. The master password is not included. Changing it requires generating and verifying a new set.',
  'manage.codesGenerate': 'Generate a new batch',
  'manage.codesSave': 'Save file',
  'manage.codesConfirm': 'Reimport and activate batch',
  'manage.backCredentials': 'Back to sign-in & codes',
  'manage.codesSaveTitle': 'Keep recovery codes outside the vault',
  'manage.codesDistinct':
    'MFA recovery codes recover sign-in identity when Passkey is unavailable. They cannot decrypt your vault. Store them separately from account and vault recovery keys.',
  'manage.codesExpired':
    'The pending batch expired. The previous active batch is retained. Generate, save and confirm a new batch.',
  'manage.codesPending':
    'The old batch remains active until confirmation. Generating or downloading a batch does not activate it.',
  'manage.codesTime':
    'Eight single-use codes. Reimport and confirm within 10 minutes of issue. Only confirmation invalidates the old batch.',
  'manage.passkeyCount': '{count} registered',
  'manage.addPasskey': 'Add Passkey',
  'manage.lastUsed': 'Last used: {time}',
  'manage.lastPasskey':
    'Keep at least one valid Passkey. The last Passkey cannot be revoked; add a backup credential.',
  'manage.revokeTitle': 'Revoke this Passkey?',
  'manage.addPasskeyHint':
    'The label only identifies the passkey. Save a backup passkey on another device or in another password manager. Recent verification is required before creation.',
  'manage.mfaCodes': 'MFA recovery codes',
  'manage.codesTitle': 'Keep an independent way to recover your identity',
  'manage.updateCodes': 'Update recovery codes',
  'manage.backupUnlock': 'Unlock and check vault',
  'manage.backupExport': 'Export encrypted backup',
  'manage.backupRoundtrip': 'Reimport and verify',
  'manage.existingValid': 'This backup can be decrypted',
  'manage.backupComplete': 'Backup saved and verified',
  'manage.verifyAnother': 'Verify another backup',
  'manage.backupLocal': 'Verification ran locally without server writes.',
  'manage.existingTitle': 'Choose backup and source unlocking materials',
  'manage.backupUnlockTitle': 'Confirm unlocking materials for this backup',
  'manage.localMaterials':
    'Master passwords and key files are used only in this browser.',
  'manage.backupExcludes':
    'Excludes deleted passwords, the master password, account key, recovery key, vault Passkeys and MFA recovery codes.',
  'manage.snapshotChecked': 'Backup contents checked',
  'manage.snapshotAuth':
    'Reading a consistent snapshot requires recent authentication. Each ciphertext has been verified locally.',
  'manage.content': 'Contents',
  'manage.backupContents':
    '{count} items, including existing TOTP configurations',
  'manage.excludes': 'Excluded',
  'manage.backupScope':
    'The authenticated manifest detects changes after export. It cannot prove the server did not omit records or roll back the vault before creating the snapshot.',
  'manage.roundtripTitle': 'Check the backup you just saved',
  'manage.roundtripHint':
    'Select the exported file to authenticate its manifest and verify every item.',
  'manage.exportedBackup': 'Just-exported encrypted backup',
  'manage.exportedUnverified':
    'Exported, awaiting reimport verification. Keep the original data and matching unlocking materials.',
  'manage.verifyFinish': 'Verify and finish backup',
  'manage.backupOperation': 'Backup operation',
  'manage.verifyExisting': 'Verify existing backup',
  'manage.createBackup': 'Create encrypted backup',
  'manage.goRotation': 'Go to rotation & recovery',
  'manage.masterVerify': 'Verify current materials',
  'manage.masterNew': 'Set new master password',
  'manage.masterConfirm': 'Review change',
  'manage.masterVerifyTitle': 'Verify current unlocking materials',
  'manage.masterOnlyNormal':
    'This operation requires the original account key file and current master password.',
  'manage.masterRecoveryHint':
    'If these materials are unavailable, use a vault recovery file for a full key rotation.',
  'manage.verifyContinue': 'Verify materials and continue',
  'manage.masterHistory':
    'Old backups still use their original unlocking materials. Rotate all keys if those materials may have been exposed.',
  'manage.masterSession':
    'This session will end. Sign in again, then unlock with your existing account key and new master password.',
  'manage.changes': 'Changes',
  'manage.staysValid': 'Remains valid; no replacement needed',
  'manage.history': 'Historical backups',
  'manage.historyMaterials': 'Use their original matching materials',
  'manage.masterUncertain':
    'The result is uncertain. Query the current key slot first. If signed out, sign in and try the new master password. The original request is retained.',
  'manage.checkMasterResult': 'Check change result',
  'manage.loginNewMaster': 'Sign in and verify new password',
  'manage.masterCommit': 'Confirm change and sign in again',
  'manage.committed': 'Committed',
  'manage.cancelled': 'Cancelled',
  'manage.expired': 'Expired',
  'manage.uploading': 'In progress; not committed',
  'manage.taskDeadline': 'Absolute deadline',
  'manage.deadlineValue':
    'About {minutes} min left · {time}; authentication does not extend it',
  'manage.itemProgress': 'Item progress',
  'manage.progressAfterTakeover':
    '{count} items; uploaded contents checked after takeover',
  'manage.liveData': 'Active data',
  'manage.newDataActive': 'New vault is active',
  'manage.targetUncommitted':
    'Target uncommitted; original empty vault retained',
  'manage.oldDataReadable': 'Old vault remains readable; editing is paused',
  'manage.restoreSource': 'Verify source backup',
  'manage.restoreNew': 'Set target materials',
  'manage.filesStep': 'Save and verify',
  'manage.restoreEncrypt': 'Restore and verify',
  'manage.restoreCommit': 'Confirm restoration commit',
  'manage.rotationSource': 'Verify old vault and backup',
  'manage.rotationNew': 'Set new unlocking materials',
  'manage.rotationEncrypt': 'Re-encrypt',
  'manage.rotationCommit': 'Confirm switch',
  'manage.targetAccount': 'Target: currently signed-in account',
  'manage.targetEmpty': 'Empty vault confirmed',
  'manage.targetNotEmpty': 'Contains items or restoration in progress',
  'manage.targetUnchecked': 'Not checked',
  'manage.emptyOnly':
    'Only an uninitialized or empty vault is eligible. The server checks this atomically at commit.',
  'manage.checkTarget': 'Check target vault',
  'manage.resumeMaterials': 'Provide the original task materials',
  'manage.originalOnly':
    'Reuse the original task, generated key files and new master password. Do not generate replacements.',
  'manage.restoreSourceHint':
    'Choose the source backup and its matching unlocking materials.',
  'manage.rotationSourceHint':
    'Use a verifiable backup matching the current vault. The old vault is retained until commit.',
  'manage.sourceBackup': 'Source encrypted backup',
  'manage.needBackup': 'Need a verifiable backup? Create one first',
  'manage.recoveryIdentity':
    'Recovery files only decrypt data. Account sign-in and MFA are still required.',
  'manage.verifyResume': 'Verify materials and continue original task',
  'manage.newMaterialsHint':
    'Your new master password and new account key protect the new vault together.',
  'manage.generateNew': 'Generate new key files',
  'manage.saveNewFiles': 'Save and verify both new files',
  'manage.continueEncrypt': 'Continue to re-encryption',
  'manage.encryptTitle': 'Re-encrypt all items with new keys',
  'manage.encryptHint':
    'After uploading, download the staged data, decrypt every item and compare with the source.',
  'manage.uploadProgress': 'Re-encryption and upload progress',
  'manage.allContent':
    'Includes passwords, notes and existing TOTP configurations',
  'manage.noSecretsUpload': 'Unlocking materials stay local',
  'manage.uncertain':
    'Result uncertain. Keep the original task file and new materials. Query server status before generating or submitting anything again.',
  'manage.later': 'Continue later',
  'manage.queryRetryStart': 'Query before retrying original request',
  'manage.readyTitle': 'New data verified; awaiting confirmation',
  'manage.readyHint':
    'Active data has not switched. Your final confirmation is required.',
  'manage.dataVerified': 'All items compared successfully',
  'manage.afterCommitUnlock': 'Unlock after commit',
  'manage.newUnlock': 'New master password + new account key',
  'manage.restoreLastCheck':
    'After commit, sign in again and unlock with the new target materials to verify all contents before restoration is complete.',
  'manage.rotationHistory':
    'Online rotation does not revoke historical backups, change website passwords or rebind third-party TOTP.',
  'manage.confirmSwitch': 'Confirm switch and sign out',
  'manage.confirmCancel': 'Verify and cancel task',
  'manage.submittedVerify': 'Data committed; final verification required',
  'manage.reloginVerify': 'Sign in and verify new materials',
  'manage.terminalHint':
    'This task cannot continue. Uncommitted tasks retain the old or empty vault. Confirm the terminal status before explicitly starting again.',
  'manage.taskFilePublic':
    'A task file locates the operation. It does not replace authentication, a backup or decryption materials.',
  'manage.takeoverRules':
    'Continuing requires recent authentication and task takeover. An authentication-epoch change blocks takeover; explicitly cancel after authenticating instead. The deadline is unchanged.',
  'manage.takeover': 'Continue original task',
  'manage.findTask': 'Find an existing task',
  'manage.findTaskHint':
    'Import a task file or enter its ID. Querying does not start a new task.',
  'manage.taskNotFound':
    'Task not found. Check the original task file or ID. An uncertain start may only be retried as the same request after querying.',
  'manage.reauthRetry':
    'Recent authentication expired. Select the current action again to verify and continue in place.',
  'manage.takeoverDenied':
    'This session cannot operate on the task. Authenticate and take over; an epoch change permits cancellation only.',
  'manage.authTitle': 'Verify this operation',
  'manage.authHint':
    'Verify with your Passkey to continue “{action}”. Verification is valid for five minutes.',
  'manage.authDistinct':
    'Identity verification does not replace local unlocking. Cancelling preserves this operation; automatic locking still clears secrets.',
  'manage.leaveTitle': 'Leave this operation?',
  'manage.leaveHint':
    'Inputs and uncommitted unlocking materials will be cleared. Save generated files first. Server tasks can be continued using the original task file.',
  'manage.leaveClear': 'Leave and clear',
  'manage.restoreVerified': 'Restoration complete and verified',
  'manage.rotationVerified': 'New keys unlocked; all items verified',
  'manage.completionMismatch':
    'This vault does not match the commit receipt. Keep the original task file and query status before generating materials.',
};
