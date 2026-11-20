import { expect, it, vi } from "vitest";

import { transcribeWithDeepgram } from "./deepgram-transcription.js";

it("sends the original voice bytes to Deepgram and reads the transcript", async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({
    results: { channels: [{ alternatives: [{ transcript: "Проверка связи" }] }] },
  }));
  await expect(transcribeWithDeepgram({
    apiKey: "test-token",
    audio: Uint8Array.of(1, 2, 3),
    mediaType: "audio/ogg",
    request,
    signal: new AbortController().signal,
  })).resolves.toBe("Проверка связи");
  expect(request).toHaveBeenCalledWith(
    "https://api.deepgram.com/v1/listen?model=nova-3&language=multi&smart_format=true",
    expect.objectContaining({
      method: "POST",
      headers: { authorization: "Token test-token", "content-type": "audio/ogg" },
      body: Uint8Array.of(1, 2, 3),
    }),
  );
});

it("discards provider response details when transcription fails", async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response("provider details", { status: 401 }));
  await expect(transcribeWithDeepgram({
    apiKey: "test-token",
    audio: Uint8Array.of(1),
    mediaType: "audio/ogg",
    request,
    signal: new AbortController().signal,
  })).rejects.toMatchObject({ code: "AGENT_DEEPGRAM_TRANSCRIPTION_FAILED" });
});
