// The offscreen document that records speaking exercises: the microphone belongs to the extension (allowed
// once, in Options), so no page is asked for it and no page's policy can block it. The background opens it
// and sends it `OffscreenRequest`s; the clip goes back as 16 kHz mono WAV for Whisper.
import { browser } from 'wxt/browser';
import { encodeWav, isSilent, MAX_RECORD_SECS, NO_MIC_ERROR, RECORD_RATE, SILENT_ERROR, toBase64 } from '@/src/listen';
import type { OffscreenRequest, OffscreenResponseFor, Result } from '@/src/messages';

let recording: { recorder: MediaRecorder; stream: MediaStream; done: Promise<Blob>; timer: ReturnType<typeof setTimeout> } | undefined;

async function start(): Promise<Result<null>> {
  cancel();
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  } catch {
    return { ok: false, error: NO_MIC_ERROR };
  }
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);
  const done = new Promise<Blob>((resolve) => (recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }))));
  // Stopped by itself, it waits for `record-stop` to be heard.
  const timer = setTimeout(() => recorder.state === 'recording' && recorder.stop(), MAX_RECORD_SECS * 1000);
  recorder.start();
  recording = { recorder, stream, done, timer };
  return { ok: true, value: null };
}

/** The recording, resampled to `RECORD_RATE` mono. */
async function toPcm(blob: Blob): Promise<Float32Array> {
  const ctx = new AudioContext();
  try {
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    const offline = new OfflineAudioContext(1, Math.max(1, Math.ceil(decoded.duration * RECORD_RATE)), RECORD_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    return (await offline.startRendering()).getChannelData(0);
  } finally {
    void ctx.close();
  }
}

async function stop(): Promise<OffscreenResponseFor['record-stop']> {
  const r = recording;
  if (!r) return { ok: false, error: 'Nothing was being recorded.' };
  recording = undefined;
  clearTimeout(r.timer);
  if (r.recorder.state === 'recording') r.recorder.stop();
  const blob = await r.done;
  r.stream.getTracks().forEach((t) => t.stop());
  const pcm = blob.size ? await toPcm(blob) : new Float32Array();
  if (isSilent(pcm)) return { ok: false, error: SILENT_ERROR };
  return { ok: true, value: { wav: toBase64(encodeWav(pcm)), secs: pcm.length / RECORD_RATE } };
}

function cancel(): Result<null> {
  const r = recording;
  recording = undefined;
  if (r) {
    clearTimeout(r.timer);
    if (r.recorder.state === 'recording') r.recorder.stop();
    r.stream.getTracks().forEach((t) => t.stop());
  }
  return { ok: true, value: null };
}

browser.runtime.onMessage.addListener((msg: OffscreenRequest, _sender, sendResponse) => {
  // Every message the extension sends arrives here too; only the background's to this document are answered.
  if (msg?.target !== 'offscreen') return false;
  const run = msg.type === 'record-start' ? start() : msg.type === 'record-stop' ? stop() : Promise.resolve(cancel());
  run.then(sendResponse, (e) => sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) }));
  return true;
});
