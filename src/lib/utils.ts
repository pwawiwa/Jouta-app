const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const ASSEMBLYAI_API_URL = "https://api.assemblyai.com/v2";

interface TranscriptionOptions {
  language?: "en" | "id";
}

export async function transcribeAudio(
  audioBlob: Blob,
  options: TranscriptionOptions = {}
): Promise<string> {
  try {
    // Convert audio to base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    // Create the upload request
    const uploadResponse = await fetch(`${ASSEMBLYAI_API_URL}/upload`, {
      method: "POST",
      headers: {
        "authorization": ASSEMBLYAI_API_KEY as string,
        "content-type": "application/json",
      },
      body: base64Audio
    });

    if (!uploadResponse.ok) {
      console.error("Upload failed:", await uploadResponse.text());
      throw new Error("Failed to upload audio");
    }

    const uploadResult = await uploadResponse.json();
    const audioUrl = uploadResult.upload_url;

    // Submit the transcription request
    const transcriptResponse = await fetch(`${ASSEMBLYAI_API_URL}/transcript`, {
      method: "POST",
      headers: {
        "authorization": ASSEMBLYAI_API_KEY as string,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: options.language === "id" ? "id" : "en_us",
        speech_model: options.language === "id" ? "nano" : "best"
      })
    });

    if (!transcriptResponse.ok) {
      console.error("Transcription request failed:", await transcriptResponse.text());
      throw new Error("Failed to submit transcription request");
    }

    const transcriptResult = await transcriptResponse.json();
    const transcriptId = transcriptResult.id;

    // Poll for the transcription result
    let retries = 0;
    const maxRetries = 60; // Maximum 60 seconds of polling

    while (retries < maxRetries) {
      const pollingResponse = await fetch(`${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`, {
        headers: {
          "authorization": ASSEMBLYAI_API_KEY as string,
        },
      });

      if (!pollingResponse.ok) {
        console.error("Polling failed:", await pollingResponse.text());
        throw new Error("Failed to get transcription status");
      }

      const result = await pollingResponse.json();

      if (result.status === "completed") {
        return result.text;
      } else if (result.status === "error") {
        console.error("Transcription error:", result.error);
        throw new Error(`Transcription failed: ${result.error}`);
      }

      // Wait for 2 seconds before polling again
      await new Promise(resolve => setTimeout(resolve, 2000));
      retries++;
    }

    throw new Error("Transcription timed out");
  } catch (error) {
    console.error("Transcription error details:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to transcribe audio");
  }
}

export async function generateJournalEntry(transcription: string, language: "en" | "id" = "en") {
  // Simple text processing for journal entries
  const lines = transcription.split(". ");
  const title = lines[0].trim();
  const content = transcription;
  
  // Generate a simple summary by taking the first sentence and last sentence
  const summary = lines.length > 1 
    ? `${lines[0]}. ${lines[lines.length - 1]}.`
    : lines[0];

  return { title, content, summary };
}

export async function generateTimeBlockedTasks(transcription: string, language: "en" | "id" = "en") {
  // Split into tasks using common delimiters and task-related keywords
  const taskDelimiters = language === "en" 
    ? /(?:then|after that|next|finally|and then|followed by|later|afterwards|subsequently|first|second|third|lastly)[,.]?\s+/i
    : /(?:kemudian|setelah itu|lalu|akhirnya|dan|selanjutnya|berikutnya|pertama|kedua|ketiga|terakhir)[,.]?\s+/i;

  const rawTasks = transcription
    .split(taskDelimiters)
    .map(task => task.trim())
    .filter(task => task.length > 0);

  // Get current date for time blocking
  const currentDate = new Date();
  currentDate.setMinutes(0);
  let currentHour = currentDate.getHours();

  // Ensure we don't exceed midnight
  const maxTasks = Math.min(rawTasks.length, 24 - currentHour);

  // Process each sentence into a task
  const tasks = rawTasks.slice(0, maxTasks).map((task, index) => {
    const startTime = new Date(currentDate);
    startTime.setHours(currentHour + index);
    
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1);

    // Clean up the task title
    const title = task
      .replace(/^(i need to|i have to|i must|i want to|i will)/i, "")
      .replace(/^[,.]\s*/, "")
      .trim();

    return {
      title: title.charAt(0).toUpperCase() + title.slice(1),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    };
  });

  return tasks;
} 