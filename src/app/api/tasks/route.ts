import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generateTimeBlockedTasks, transcribeAudio } from "@/lib/utils";

const prisma = new PrismaClient();

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

    // Generate the tasks
    const tasks = await generateTimeBlockedTasks(transcription, language);

    if (!tasks || tasks.length === 0) {
      return NextResponse.json(
        { error: "No tasks could be generated from the transcription" },
        { status: 400 }
      );
    }

    // Save tasks to database
    const createdTasks = await Promise.all(
      tasks.map((task) =>
        prisma.task.create({
          data: {
            title: task.title,
            startTime: new Date(task.startTime),
            endTime: new Date(task.endTime),
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