import { TranscriptionTest } from "@/components/TranscriptionTest";

export default function TestPage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-center mb-8 text-white">
        Transcription Test
      </h1>
      <div className="bg-white/10 backdrop-blur-apple rounded-2xl p-6">
        <TranscriptionTest />
      </div>
    </div>
  );
} 