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
    // Create the upload request
    const uploadResponse = await fetch(`${ASSEMBLYAI_API_URL}/upload`, {
      method: "POST",
      headers: {
        "authorization": ASSEMBLYAI_API_KEY as string,
        "content-type": "application/octet-stream",
        "transfer-encoding": "chunked"
      },
      body: audioBlob
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Upload failed:", errorText);
      throw new Error(`Failed to upload audio: ${errorText}`);
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
      const errorText = await transcriptResponse.text();
      console.error("Transcription request failed:", errorText);
      throw new Error(`Failed to submit transcription request: ${errorText}`);
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
        const errorText = await pollingResponse.text();
        console.error("Polling failed:", errorText);
        throw new Error(`Failed to get transcription status: ${errorText}`);
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

// Test function for transcription
export async function testTranscription(audioBlob: Blob, language: "en" | "id" = "en"): Promise<string> {
  try {
    console.log("Starting transcription test...");
    console.log("Audio blob size:", audioBlob.size, "bytes");
    console.log("Audio blob type:", audioBlob.type);
    console.log("Language:", language);

    const formData = new FormData();
    formData.append("audio", audioBlob);
    formData.append("language", language);

    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || "Transcription failed");
    }

    console.log("Transcription successful!");
    console.log("Transcribed text:", responseData.text);
    return responseData.text;
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  }
} 