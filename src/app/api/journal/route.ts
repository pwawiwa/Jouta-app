import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { transcribeAudio } from "@/lib/utils";
import OpenAI from "openai";

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob;
    const language = (formData.get("language") as "en" | "id") || "en";
    const targetDate = new Date(formData.get("targetDate") as string);

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Validate audio file
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: "Invalid audio file format" },
        { status: 400 }
      );
    }

    // Transcribe the audio
    let transcription: string;
    try {
      transcription = await transcribeAudio(audioFile, { language });
    } catch (error) {
      console.error("Transcription error:", error);
      return NextResponse.json(
        { error: "Failed to transcribe audio. Please try again." },
        { status: 500 }
      );
    }

    if (!transcription || transcription.trim().length === 0) {
      return NextResponse.json(
        { error: "No speech detected in the recording" },
        { status: 400 }
      );
    }

    // Generate journal entry using OpenAI
    const prompt = language === "en"
      ? `Given this transcription: "${transcription}"
         Create a journal entry with the following structure:
         1. Title: A concise title summarizing the main topic
         2. Content: The full formatted content with paragraphs
         3. Summary: A brief 2-3 sentence summary
         4. Keywords: Extract 3-5 key topics or themes
         5. Timestamp references: Note any mentioned times/dates

         Output in JSON format:
         {
           "title": "...",
           "content": "...",
           "summary": "...",
           "keywords": ["..."],
           "timestamps": ["..."]
         }`
      : `Dari transkrip berikut: "${transcription}"
         Buat entri jurnal dengan struktur berikut:
         1. Judul: Judul singkat yang merangkum topik utama
         2. Konten: Konten lengkap yang diformat dengan paragraf
         3. Ringkasan: Ringkasan singkat 2-3 kalimat
         4. Kata kunci: Ekstrak 3-5 topik atau tema utama
         5. Referensi waktu: Catat waktu/tanggal yang disebutkan

         Output dalam format JSON:
         {
           "title": "...",
           "content": "...",
           "summary": "...",
           "keywords": ["..."],
           "timestamps": ["..."]
         }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates well-structured journal entries from voice transcriptions. Keep responses concise and focused."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.7
    });

    const journalData = JSON.parse(completion.choices[0].message.content || "{}");

    // Save to database
    const journal = await prisma.journal.create({
      data: {
        title: journalData.title,
        content: journalData.content,
        summary: journalData.summary,
        keywords: journalData.keywords.join(", "),
        timestamps: journalData.timestamps.join(", "),
        audioUrl: "", // TODO: Implement audio file storage
        createdAt: targetDate,
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