/**
 * useAudioRecorder.ts
 * Wraps the browser MediaRecorder API for real microphone recording.
 * Returns start/stop/cancel controls and fires onComplete(blob) when done.
 */

import { useRef, useCallback } from "react";

interface UseAudioRecorderOptions {
  onComplete: (blob: Blob) => void;
  onError: (err: string) => void;
}

export function useAudioRecorder({ onComplete, onError }: UseAudioRecorderOptions) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      // Pick the best supported format
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
        "audio/mp4",
      ].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        // Stop all microphone tracks to release the mic indicator
        stream.getTracks().forEach((t) => t.stop());
        onComplete(blob);
      };

      recorder.start(100); // collect data every 100ms for robustness
    } catch (err: any) {
      const msg =
        err?.name === "NotAllowedError"
          ? "Microphone permission denied. Please allow microphone access and try again."
          : err?.name === "NotFoundError"
          ? "No microphone found. Please connect a microphone and try again."
          : `Could not start recording: ${err?.message ?? err}`;
      onError(msg);
    }
  }, [onComplete, onError]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    if (mediaRecorderRef.current) {
      // Remove onstop so the blob callback never fires
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    }
    // Release microphone immediately
    streamRef.current?.getTracks().forEach((t) => t.stop());
    chunksRef.current = [];
  }, []);

  return { start, stop, cancel };
}
