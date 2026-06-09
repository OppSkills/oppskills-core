/** Capture a JPEG poster frame from a local video file for chat thumbnails. */
export async function captureVideoPosterUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(objectUrl);
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Failed to load video for poster"));
    };

    video.onloadeddata = () => {
      const seekTo = Number.isFinite(video.duration)
        ? Math.min(0.5, video.duration * 0.05)
        : 0;
      video.currentTime = seekTo;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("No canvas context");
        ctx.drawImage(video, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (!blob) {
              reject(new Error("Failed to encode video poster"));
              return;
            }
            resolve(URL.createObjectURL(blob));
          },
          "image/jpeg",
          0.85,
        );
      } catch (e) {
        cleanup();
        reject(e);
      }
    };

    video.src = objectUrl;
  });
}
