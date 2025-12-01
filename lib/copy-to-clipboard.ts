'use client';

/**
 * Attempts to copy text to the clipboard using the modern API first, falling back to
 * the deprecated execCommand strategy when available. Returns true when the copy
 * succeeds, and false otherwise without throwing in non-browser environments.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  const clipboardApi = typeof navigator !== "undefined" ? navigator.clipboard : undefined;

  if (clipboardApi?.writeText) {
    try {
      await clipboardApi.writeText(text);
      return true;
    } catch {
      // Ignore and try the legacy strategy below.
    }
  }

  if (typeof document !== "undefined") {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      textarea.setAttribute("readonly", "true");
      document.body.appendChild(textarea);

      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      const successful = document.execCommand("copy");
      document.body.removeChild(textarea);
      return successful;
    } catch {
      return false;
    }
  }

  return false;
}







