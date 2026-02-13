/**
 * useAudioRecorder.ts
 * Wraps the browser MediaRecorder API for real microphone recording.
 * Returns start/stop/cancel controls and fires onComplete(blob) when done.
 *
 * IMPORTANT: start/stop/cancel have stable identities (never change) so they
 * are safe to use in useEffect dependency arrays without causing re-runs.
 */

import { useRef, useCallback, useEffect } from "react";

interface UseAudioRecorderOptions {
  onComplete: (blob: Blob) => void;
  onError: (err: string) => void;
}

export function useAudioRecorder({ onComplete, onError }: UseAudioRecorderOptions) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Keep callback refs up to date without changing the identity of start/stop/cancel
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  // start has NO deps — stable identity forever
  const start = useCallback(async () => {
    // Guard against double-start
    if (mediaRecorderRef.current) return;

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
        // Release mic indicator
        stream.getTracks().forEach((t) => t.stop());
        // Use the ref so we always call the latest version of onComplete
        onCompleteRef.current(blob);
      };

      recorder.start(250); // collect chunks every 250ms
    } catch (err: any) {
      const msg =
        err?.name === "NotAllowedError"
          ? "Microphone permission denied. Please allow microphone access and try again."
          : err?.name === "NotFoundError"
          ? "No microphone found. Please connect a microphone and try again."
          : `Could not start recording: ${err?.message ?? err}`;
      onErrorRef.current(msg);
    }
  }, []); // intentionally empty — stable forever

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    if (mediaRecorderRef.current) {
      // Null out onstop so the blob callback never fires
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    chunksRef.current = [];
  }, []);

  return { start, stop, cancel };
}
