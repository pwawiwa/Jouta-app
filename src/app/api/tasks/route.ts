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

    // Generate tasks using OpenAI
    const prompt = language === "en"
      ? `Given this transcription: "${transcription}"
         Create time-blocked tasks with the following requirements:
         1. Identify specific tasks and their timing
         2. If specific times are mentioned, use them
         3. For tasks without times, schedule them reasonably starting from ${targetDate.toISOString()}
         4. Include any mentioned deadlines or priorities

         Output each task in this JSON format:
         {
           "tasks": [
             {
               "title": "Task description",
               "startTime": "ISO datetime",
               "endTime": "ISO datetime",
               "priority": "high/medium/low",
               "notes": "Additional context or requirements"
             }
           ]
         }`
      : `Dari transkrip berikut: "${transcription}"
         Buat tugas terjadwal dengan persyaratan berikut:
         1. Identifikasi tugas spesifik dan waktunya
         2. Jika waktu disebutkan, gunakan waktu tersebut
         3. Untuk tugas tanpa waktu, jadwalkan secara masuk akal mulai dari ${targetDate.toISOString()}
         4. Sertakan tenggat waktu atau prioritas yang disebutkan

         Output dalam format JSON:
         {
           "tasks": [
             {
               "title": "Deskripsi tugas",
               "startTime": "Waktu ISO",
               "endTime": "Waktu ISO",
               "priority": "high/medium/low",
               "notes": "Konteks atau persyaratan tambahan"
             }
           ]
         }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates well-structured, time-blocked tasks from voice transcriptions. Keep tasks concise and actionable."
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

    const taskData = JSON.parse(completion.choices[0].message.content || "{}");
    
    if (!taskData.tasks || taskData.tasks.length === 0) {
      return NextResponse.json(
        { error: "No tasks could be generated from the transcription" },
        { status: 400 }
      );
    }

    // Save tasks to database
    const createdTasks = await Promise.all(
      taskData.tasks.map((task: any) =>
        prisma.task.create({
          data: {
            title: task.title,
            startTime: new Date(task.startTime),
            endTime: new Date(task.endTime),
            priority: task.priority || "medium",
            notes: task.notes,
            audioUrl: "", // TODO: Implement audio file storage
          },
        })
      )
    );

    return NextResponse.json(createdTasks);
  } catch (error) {
    console.error("Error creating tasks:", error);
    return NextResponse.json(
      { error: "Failed to create tasks. Please try again." },
      { status: 500 }
    );
  }
} 