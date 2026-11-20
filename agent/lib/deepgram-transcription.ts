import { z } from "zod";

import { AppError } from "./app-error.js";

const LISTEN_URL = "https://api.deepgram.com/v1/listen?model=nova-3&language=multi&smart_format=true";
const responseSchema = z.object({
  results: z.object({
    channels: z.array(z.object({
      alternatives: z.array(z.object({ transcript: z.string() })).min(1),
    })).min(1),
  }),
});

export async function transcribeWithDeepgram(input: {
  apiKey: string;
  audio: Uint8Array;
  mediaType: "audio/ogg" | "video/mp4";
  request?: typeof fetch;
  signal: AbortSignal;
}): Promise<string> {
  try {
    const response = await (input.request ?? fetch)(LISTEN_URL, {
      method: "POST",
      headers: { authorization: `Token ${input.apiKey}`, "content-type": input.mediaType },
      body: new Uint8Array(input.audio),
      redirect: "error",
      signal: input.signal,
    });
    if (response.ok) {
      const parsed = responseSchema.parse(await response.json());
      return parsed.results.channels[0]!.alternatives[0]!.transcript;
    }
    await response.body?.cancel();
  } catch {
    input.signal.throwIfAborted();
  }
  throw new AppError("AGENT_DEEPGRAM_TRANSCRIPTION_FAILED", "Не удалось распознать голосовое сообщение");
}
