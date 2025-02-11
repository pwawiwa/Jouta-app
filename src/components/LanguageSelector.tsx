"use client";

interface LanguageSelectorProps {
  value: "en" | "id";
  onChange: (language: "en" | "id") => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2 bg-black/20 backdrop-blur-apple rounded-full p-1">
      <button
        onClick={() => onChange("en")}
        className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 ${
          value === "en"
            ? "bg-white/20 text-white"
            : "text-white/70 hover:text-white"
        }`}
      >
        English
      </button>
      <button
        onClick={() => onChange("id")}
        className={`px-3 py-1.5 rounded-full text-sm transition-all duration-300 ${
          value === "id"
            ? "bg-white/20 text-white"
            : "text-white/70 hover:text-white"
        }`}
      >
        Bahasa Indonesia
      </button>
    </div>
  );
} 