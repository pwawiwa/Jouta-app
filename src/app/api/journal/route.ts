import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generateJournalEntry, transcribeAudio } from "@/lib/utils";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Transcribe the audio
    const transcription = await transcribeAudio(audioFile);

    // Generate the journal entry
    const { title, content, summary } = await generateJournalEntry(transcription);

    // Save to database
    const journal = await prisma.journal.create({
      data: {
        title,
        content,
        summary,
        audioUrl: "", // TODO: Implement audio file storage
      },
    });

    return NextResponse.json(journal);
  } catch (error) {
    console.error("Error creating journal:", error);
    return NextResponse.json(
      { error: "Failed to create journal entry" },
      { status: 500 }
    );
  }
} 