export async function readKeyFile(file?: File) {
  if (!file || file.size > 8192) throw new Error('VAULT_INVALID_FORMAT');
  return file.text();
}

export function downloadFile(name: string, content: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.rel = 'noopener noreferrer';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
