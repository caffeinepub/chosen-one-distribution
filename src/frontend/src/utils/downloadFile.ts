/**
 * Cross-device file download utility.
 * Uses fetch + Blob URL for Android/desktop.
 * Falls back to window.open for iOS Safari which ignores the download attribute.
 */
export async function downloadFile(
  url: string,
  filename: string,
): Promise<void> {
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIOS) {
    // iOS Safari doesn't support the download attribute; open in new tab
    window.open(url, "_blank");
    return;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network response was not ok");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch {
    // Fallback: direct anchor click
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export function getAudioExtension(track: {
  audioFileFormat?: string;
}): string {
  if (!track.audioFileFormat) return "mp3";
  const fmt = track.audioFileFormat
    .toLowerCase()
    .replace("audio/", "")
    .replace("mpeg", "mp3");
  return fmt || "mp3";
}
