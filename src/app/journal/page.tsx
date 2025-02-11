"use client";

import { useState } from "react";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { LanguageSelector } from "@/components/LanguageSelector";
import { format } from "date-fns";

interface Journal {
  id: string;
  title: string;
  content: string;
  summary: string;
  createdAt: string;
}

export default function JournalPage() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState<"en" | "id">("en");

  const handleRecordingComplete = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob);
      formData.append("language", language);

      const response = await fetch("/api/journal", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create journal entry");
      }

      const journal = await response.json();
      setJournals((prev) => [journal, ...prev]);
    } catch (error) {
      console.error("Error creating journal:", error);
      alert("Failed to create journal entry. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-white">Voice Journal</h1>
        <p className="text-white/80">
          {language === "en"
            ? "Record your thoughts and let AI create a journal entry for you."
            : "Rekam pemikiranmu dan biarkan AI membuat catatan jurnal untukmu."}
        </p>
        <div className="flex flex-col items-center gap-6">
          <LanguageSelector value={language} onChange={setLanguage} />
          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            isProcessing={isProcessing}
          />
        </div>
      </div>

      <div className="space-y-6">
        {journals.map((journal) => (
          <div
            key={journal.id}
            className="bg-white/10 backdrop-blur-apple rounded-2xl p-6 shadow-lg animate-scale-in"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-white">{journal.title}</h2>
              <time className="text-sm text-white/60">
                {format(new Date(journal.createdAt), "PPP")}
              </time>
            </div>
            <p className="text-white/80 mb-4 whitespace-pre-wrap">
              {journal.content}
            </p>
            {journal.summary && (
              <div className="bg-black/20 p-4 rounded-xl">
                <h3 className="text-sm font-medium text-white/90 mb-1">
                  {language === "en" ? "Summary" : "Ringkasan"}
                </h3>
                <p className="text-sm text-white/70">{journal.summary}</p>
              </div>
            )}
          </div>
        ))}

        {journals.length === 0 && (
          <div className="text-center py-12 text-white/40">
            {language === "en"
              ? "No journal entries yet. Start by recording your thoughts!"
              : "Belum ada catatan jurnal. Mulai dengan merekam pemikiranmu!"}
          </div>
        )}
      </div>
    </div>
  );
} 