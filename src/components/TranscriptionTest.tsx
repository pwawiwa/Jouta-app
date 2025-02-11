"use client";

import { useState, useRef } from "react";
import { testTranscription } from "@/lib/utils";

export function TranscriptionTest() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError(null);
      setResult(null);
      audioChunksRef.current = []; // Clear previous chunks
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log("Chunk added, total chunks:", audioChunksRef.current.length);
        }
      };

      recorder.onstop = async () => {
        const chunks = audioChunksRef.current;
        console.log("Processing chunks:", chunks.length);
        
        if (chunks.length === 0) {
          setError("No audio data recorded");
          return;
        }

        try {
          setIsProcessing(true);
          const audioBlob = new Blob(chunks, { type: "audio/webm" });
          
          if (audioBlob.size === 0) {
            throw new Error("Audio file is empty");
          }

          console.log("Audio blob details:", {
            size: audioBlob.size,
            type: audioBlob.type,
            chunks: chunks.length
          });

          const transcription = await testTranscription(audioBlob);
          setResult(transcription);
        } catch (err) {
          console.error("Transcription error:", err);
          setError(err instanceof Error ? err.message : "Transcription failed");
        } finally {
          setIsProcessing(false);
          audioChunksRef.current = []; // Clear the chunks after processing
        }
      };

      setMediaRecorder(recorder);
      recorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
      setError(err instanceof Error ? err.message : "Failed to start recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-center">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`px-4 py-2 rounded-full font-medium ${
            isProcessing
              ? "bg-gray-400 cursor-not-allowed"
              : isRecording
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          {isProcessing
            ? "Processing..."
            : isRecording
            ? "Stop Recording"
            : "Start Test Recording"}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="p-4 bg-green-50 text-green-800 rounded-lg">
          <p className="font-medium">Transcription Result:</p>
          <p>{result}</p>
        </div>
      )}

      {isProcessing && (
        <div className="text-center text-white/80">
          <p>Transcribing audio... This may take a few moments.</p>
        </div>
      )}
    </div>
  );
} 