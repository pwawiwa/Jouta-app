import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/utils";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob;
    const language = (formData.get("language") as "en" | "id") || "en";

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    if (!audioFile.size) {
      return NextResponse.json(
        { error: "Audio file is empty" },
        { status: 400 }
      );
    }

    console.log("Audio file details:", {
      size: audioFile.size,
      type: audioFile.type,
      language
    });

    const transcription = await transcribeAudio(audioFile, { language });
    
    if (!transcription) {
      return NextResponse.json(
        { error: "No transcription result received" },
        { status: 500 }
      );
    }

    return NextResponse.json({ text: transcription });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Transcription failed" },
      { status: 500 }
    );
  }
} 