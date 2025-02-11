"use client";

import { useState, useEffect, useCallback } from "react";
import { Mic, Square, Calendar } from "lucide-react";
import { Task } from "@prisma/client";
import { format, addDays } from "date-fns";

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
  const [targetDate, setTargetDate] = useState(new Date());

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
        setError("Please allow microphone access to record");
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
      // Reset target date to today when starting new recording
      setTargetDate(new Date());
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
      formData.append("targetDate", targetDate.toISOString());

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

  const getButtonLabel = () => {
    const isToday = targetDate.toDateString() === new Date().toDateString();
    const isTomorrow = targetDate.toDateString() === addDays(new Date(), 1).toDateString();
    
    if (language === "en") {
      return isToday ? "Record for Today" : 
             isTomorrow ? "Record for Tomorrow" :
             `Record for ${format(targetDate, "MMM d")}`;
    } else {
      return isToday ? "Rekam untuk Hari Ini" :
             isTomorrow ? "Rekam untuk Besok" :
             `Rekam untuk ${format(targetDate, "d MMM")}`;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-4">
      {error && (
        <div className="w-full max-w-md rounded-lg bg-red-50 p-4 text-red-800">
          <p className="text-sm">{error}</p>
        </div>
      )}
      <div className="flex flex-col items-center space-y-4">
        <div className="text-sm font-medium text-white/80">
          {getButtonLabel()}
        </div>
        {isRecording ? (
          <>
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500 shadow-lg transition-all hover:bg-red-600 group">
              <button
                onClick={stopRecording}
                className="h-12 w-12 rounded-full bg-white group-hover:scale-95 transition-all"
                aria-label="Stop recording"
              />
            </div>
            <p className="text-sm text-white/60">
              {language === "en" ? "Press space or click to stop" : "Tekan spasi atau klik untuk berhenti"}
            </p>
          </>
        ) : (
          <>
            <button
              onClick={startRecording}
              className="group relative flex h-24 w-24 items-center justify-center rounded-full bg-blue-500 shadow-lg transition-all hover:bg-blue-600"
              aria-label="Start recording"
            >
              <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping" />
              <div className="relative flex items-center justify-center h-12 w-12 rounded-full bg-white group-hover:scale-95 transition-all">
                <Mic className="h-6 w-6 text-blue-500" />
              </div>
            </button>
            <p className="text-sm text-white/60">
              {language === "en" ? "Press space or click to start" : "Tekan spasi atau klik untuk mulai"}
            </p>
          </>
        )}
      </div>
    </div>
  );
} 