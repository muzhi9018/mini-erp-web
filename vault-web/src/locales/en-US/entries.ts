export default {
  'entries.with2fa': 'With 2FA',
  'entries.has2fa': '2FA configured',
  'entries.groupSelector': 'Password group',
  'entries.loginInfo': 'Login details',
  'entries.otherInfo': 'Other information',
  'entries.optional': 'Optional',
  'entries.period': 'Updates every {seconds}s',
  'entries.currentCode': 'Current authenticator code',
  'entries.hiddenCode': 'Authenticator code hidden',
  'entries.codeCountdown': 'Updates in {update}s · Hides in {hide}s',
  'entries.codeHint': 'Hidden after 20s. Copy always gets the latest code.',
  'entries.codeWindow': 'Time remaining in the current code window',
  'entries.factorSaved': '2FA configured',
  'entries.factorEmpty': 'No authenticator configuration yet',
  'entries.factorHint':
    'Import from the website’s security settings. You can also add it later.',
  'entries.addedDraft': 'Added to draft. Save the entry to apply.',
  'entries.removedDraft': 'Removed from draft. Save the entry to apply.',
  'entries.generatorHint': 'Use a random password for a new account',
  'entries.generatorOptions': 'Password generator options',
  'entries.saveEntry': 'Save entry',
  'entries.saveHint':
    'Saves the whole entry, including added, replaced or removed 2FA configuration.',
  'entries.discardTitle': 'Discard unsaved changes?',
  'entries.deleteTitle': 'Delete this entry?',
  'entries.deleteWarning':
    'Deletes this entry’s password and authenticator configuration. The original website’s password and 2FA stay unchanged. This vault has no trash recovery.',
  'entries.manage': 'Manage',
  'entries.manageTitle': 'Manage authenticator configuration',
  'entries.removeTitle': 'Remove 2FA from this entry?',
  'entries.replaceTitle': 'Replace authenticator configuration?',
  'entries.removeWarning':
    'Only removes this vault’s record. It does not disable 2FA at the website. Keep another authenticator available or disable 2FA on the website first. This changes the draft until you save the entry.',
  'entries.replaceWarning':
    'The saved configuration stays until you save the entry. Confirm the new configuration at the original website before saving the replacement.',
  'entries.closeImport': 'Close authenticator import',
  'entries.importSteps': 'Add 2FA steps',
  'entries.importStep': 'Import configuration',
  'entries.reviewStep': 'Review and add',
  'entries.importHint':
    'Open the website’s security or two-step verification settings and find its QR code or setup key.',
  'entries.imageTab': 'QR image',
  'entries.keyTab': 'Setup key',
  'entries.uriTab': 'Import URI',
  'entries.chooseImageTitle': 'Choose a QR screenshot from the website',
  'entries.imageHint':
    'PNG, JPEG or WebP · Up to 2 MiB. Read only on this device.',
  'entries.chooseImage': 'Choose QR image',
  'entries.imageLimitsTitle': 'Image limits',
  'entries.imageLimits':
    'PNG, JPEG or WebP only; at most 2 MiB, 4096 pixels per side and 8 million pixels total. Decoding times out after 5 seconds. Use a website QR screenshot within these limits.',
  'entries.imageError':
    'No authenticator configuration found. Choose the QR code from the website’s security settings and check the image limits.',
  'entries.setupKey': 'Setup key',
  'entries.keyHint':
    'Use the setup key from the website, not the six-digit code that changes every 30 seconds.',
  'entries.advanced': 'Advanced parameters',
  'entries.readContinue': 'Read configuration and continue',
  'entries.shortCodeError':
    'Enter the website’s setup key, not its current six-digit code.',
  'entries.uriError': 'This URI is not a TOTP configuration.',
  'entries.issuerError':
    'Service names do not match. Get the configuration from the website again.',
  'entries.parametersError':
    'These configuration parameters are unsupported and will not be changed automatically.',
  'entries.formatReady': 'Format accepted · Review the configuration',
  'entries.codeRule': 'Code settings',
  'entries.rule': '{digits} digits · Every {seconds}s',
  'entries.websiteConfirm':
    'If you are enabling 2FA at the website, enter the code there to confirm. An accepted format does not confirm activation at the website.',
  'entries.reimport': 'Import again',
  'entries.addToEntry': 'Add to this entry',
  'entries.backEditor': 'Back to entry editor',
  'entries.qrScan': 'Scan to add configuration',
  'entries.qrLabel': 'QR code containing this account’s setup key',
  'entries.qrCountdown':
    'Hides in {seconds}s · Hidden immediately in the background',
  'entries.compare': 'Compare a new device’s code (optional)',
  'entries.compareHint':
    'Compares the current code locally. It does not verify website activation, device identity or a secure handoff.',
  'entries.deviceCode': 'Code from the new device',
  'entries.compareAction': 'Compare',
  'entries.compareMatch':
    'Current codes match. This only checks configuration consistency.',
  'entries.done': 'Done',
  'entries.transfer': 'Add to another authenticator',
  'entries.transferStep1':
    'Open the authenticator on another device and choose to add an account.',
  'entries.transferStep2': 'Scan the QR code displayed here.',
  'entries.transferStep3': 'Check the account and code to finish adding it.',
  'entries.transferWarning':
    'The QR code contains the setup key. The scanning device will hold the same configuration. Scan only on devices you own.',
  'entries.transferHint':
    'This vault can still generate codes. This does not synchronize the configuration or the vault.',
  'entries.transferRevoke':
    'Both devices can generate codes. Deleting this vault record does not revoke the other device; replace or disable 2FA at the website to revoke it. Check that the target authenticator supports any custom parameters.',
  'entries.authenticateQR': 'Verify identity and show QR code',
  'entries.qrAuthFailed':
    'Unable to show the QR code. Complete identity verification and retry. The configuration needs a valid service label and account.',
  'entries.selectItem': 'Select an entry to view its details',
  'entries.showNotes': 'Show',
  'entries.hideNotes': 'Hide',
  'entries.qrTooLong':
    'The service or account label is too long for a scannable QR code. Edit the configuration labels and try again.',
  'entries.moreActions': 'More actions',
  'entries.copy': 'Copy',
  'entries.closeDialog': 'Close dialog',
};
