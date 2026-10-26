export default {
  'actions.auth.retryAfter':
    'Wait at least {seconds} seconds before confirming again.',
  'actions.generate.title': 'Generate and replace the current password?',
  'actions.generate.warning':
    'Generating a password will replace the current field. After saving, the previous password may no longer be recoverable from this vault. This does not change the password on the website. Make sure you have kept the previous password safely before continuing.',
  'actions.generate.confirm': 'Generate and replace',
  'actions.generate.pending': 'Generating…',
  'actions.generate.draftOnly':
    'The new password is filled in but not saved. Change the password on the website separately.',
  'actions.generate.failure':
    'Could not generate a password. Your previous input is unchanged. Please try again.',
  'actions.delete.title': 'Delete this password?',
  'actions.delete.consequence':
    'This password will move to Deleted and can be restored for 30 days. It will then be permanently deleted.',
  'actions.delete.confirm': 'Verify and delete',
  'actions.purge.title': 'Permanently delete this password?',
  'actions.purge.consequence':
    'This password will be permanently deleted immediately and cannot be restored.',
  'actions.purge.confirm': 'Verify and permanently delete',
  'actions.group.title': 'Delete this account group?',
  'actions.group.consequence':
    'This group will be deleted directly and cannot be restored. Its member passwords will be kept.',
  'actions.auth.required': 'Continuing requires Passkey verification.',
  'actions.auth.preparing':
    'Preparing Passkey verification for this operation…',
  'actions.auth.waiting':
    "Complete Passkey verification in your browser or device's system prompt.",
  'actions.auth.boundTo':
    'This verification applies only to {action}: “{name}”.',
  'actions.auth.submitting':
    'Passkey verification is complete. Submitting this operation. Please wait for the result.',
  'actions.auth.canceled':
    'You canceled Passkey verification. This operation was not submitted.',
  'actions.auth.failed':
    'Passkey verification failed. This operation was not submitted.',
  'actions.auth.expired':
    'This verification has expired. Please confirm and verify again.',
  'actions.auth.unavailable':
    'No Passkey is available. Use a registered backup Passkey, or recover your identity in Security & Management first.',
  'actions.auth.unsupported':
    'This browser does not support Passkey verification. Try again in a browser that supports Passkeys.',
  'actions.auth.preserveDraft':
    'Your password and unsaved edits have been kept.',
  'actions.auth.preserveDeleted':
    'The password remains in Deleted with its original retention deadline.',
  'actions.auth.unknownTitle': 'Deletion result not yet confirmed',
  'actions.auth.unknown':
    'The request was sent, but the result is not yet confirmed. Check the result before attempting another deletion.',
  'actions.auth.noUndoRequest':
    'Closing this window will not withdraw a request that has already been sent.',
  'actions.auth.reconfirm': 'Confirm again',
  'actions.auth.query': 'Check operation result',
  'actions.auth.cancelOperation': 'Cancel operation',
  'actions.common.cancel': 'Cancel',
  'actions.common.backToEditor': 'Back to editing',
  'actions.common.backToDetail': 'Back to details',
  'actions.auth.title': 'Verify this deletion',
  'actions.auth.stopped': 'Deletion has not completed',
  'actions.auth.querying':
    'Checking the original operation for a success receipt…',
  'actions.auth.conflict':
    'The item or batch version has changed. This operation did not complete. Go back and sync again; review your preserved edits first.',
  'actions.auth.missing':
    'The record no longer exists or is inaccessible. This does not prove this deletion succeeded. Go back and refresh.',
  'actions.auth.locked':
    'Key rotation is in progress. Sync and confirm again after maintenance completes.',
  'actions.auth.service':
    'The service is unavailable. This operation was not submitted. Confirm and verify again later.',
  'actions.auth.rateLimited':
    'Too many requests. Wait before starting the operation again.',
  'actions.auth.noReceipt':
    'No success receipt was obtained for the original operation. Success cannot be assumed. Confirm and verify again to retry with the original request and idempotency key.',
  'actions.auth.preserveGroup':
    'The account group and its member passwords have been kept.',
  'actions.auth.tooLarge':
    'The group updates and deletion exceed the atomic request limit. No data was changed. Remove the password from some groups first, then try again.',
  'actions.group.deleted':
    'The account group was deleted. Its member passwords were kept.',
};
