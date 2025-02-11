"use client";

import { useState } from "react";
import { Task } from "@prisma/client";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState<"en" | "id">("en");

  const handleTasksCreated = (newTasks: Task[]) => {
    setTasks((prevTasks) => [...prevTasks, ...newTasks]);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white">
            {language === "en" ? "Voice Task Creator" : "Pembuat Tugas Suara"}
          </h1>
          <p className="text-lg text-white/80">
            {language === "en"
              ? "Record your voice to create time-blocked tasks"
              : "Rekam suara Anda untuk membuat tugas terjadwal"}
          </p>
        </div>

        <div className="mb-8 flex justify-center">
          <LanguageSelector
            value={language}
            onChange={(value) => setLanguage(value as "en" | "id")}
          />
        </div>

        <div className="mb-12 rounded-2xl bg-white/10 p-8 backdrop-blur-lg">
          <VoiceRecorder
            onTasksCreated={handleTasksCreated}
            isProcessing={isProcessing}
            language={language}
          />
        </div>

        <div className="space-y-4">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-lg bg-white/10 p-4 backdrop-blur-lg transition-all hover:bg-white/20"
              >
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {task.title}
                </h3>
                <div className="flex justify-between text-sm text-white/80">
                  <span>
                    {new Date(task.startTime).toLocaleTimeString()} -{" "}
                    {new Date(task.endTime).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-white/60">
              {language === "en"
                ? "No tasks yet. Start recording to create some!"
                : "Belum ada tugas. Mulai merekam untuk membuatnya!"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 