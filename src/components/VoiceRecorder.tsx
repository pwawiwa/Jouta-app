"use client";

import { useState, useEffect, useCallback } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Task } from "@prisma/client";

interface VoiceRecorderProps {
  onTasksCreated: (tasks: Task[]) => void;
  isProcessing?: boolean;
  language: "en" | "id";
}

export function VoiceRecorder({
  onTasksCreated,
  isProcessing = false,
  language,
}: VoiceRecorderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<BlobPart[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize recorder
  useEffect(() => {
    let mounted = true;
    let stream: MediaStream | null = null;

    const initializeRecorder = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            setChunks(prev => [...prev, e.data]);
          }
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: "audio/webm" });
          setChunks([]); // Clear the chunks
          if (mounted) {
            setIsSubmitting(true);
            try {
              await handleRecordingComplete(audioBlob);
            } finally {
              setIsSubmitting(false);
            }
          }
        };

        if (mounted) {
          setMediaRecorder(recorder);
        }
      } catch (error) {
        console.error("Error initializing recorder:", error);
      }
    };

    initializeRecorder();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
    };
  }, [onTasksCreated]);

  const startRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === "inactive" && !isSubmitting && !isProcessing) {
      setChunks([]); // Clear any existing chunks
      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
    }
  }, [mediaRecorder, isSubmitting, isProcessing]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  }, [mediaRecorder]);

  // Handle spacebar press
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (
        event.code === "Space" &&
        !["INPUT", "TEXTAREA"].includes((event.target as HTMLElement).tagName)
      ) {
        event.preventDefault();
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isRecording, startRecording, stopRecording]);

  const handleRecordingComplete = async (audioBlob: Blob) => {
    try {
      setError(null);
      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("language", language);

      const response = await fetch("/api/tasks", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create tasks");
      }

      onTasksCreated(data);
    } catch (error) {
      console.error("Error creating tasks:", error);
      setError(error instanceof Error ? error.message : "Failed to create tasks");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-4">
      {error && (
        <div className="w-full max-w-md rounded-lg bg-red-50 p-4 text-red-800">
          <p className="text-sm">{error}</p>
        </div>
      )}
      <div className="flex flex-col items-center space-y-2">
        {isRecording ? (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg transition-all hover:bg-red-600">
              <button
                onClick={stopRecording}
                className="h-8 w-8 rounded-full bg-white"
                aria-label="Stop recording"
              />
            </div>
            <p className="text-sm text-gray-600">
              {language === "en" ? "Press space or click to stop" : "Tekan spasi atau klik untuk berhenti"}
            </p>
          </>
        ) : (
          <>
            <button
              onClick={startRecording}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 shadow-lg transition-all hover:bg-blue-600"
              aria-label="Start recording"
            >
              <div className="h-8 w-8 rounded-full bg-white" />
            </button>
            <p className="text-sm text-gray-600">
              {language === "en" ? "Press space or click to start" : "Tekan spasi atau klik untuk mulai"}
            </p>
          </>
        )}
      </div>
    </div>
  );
} 