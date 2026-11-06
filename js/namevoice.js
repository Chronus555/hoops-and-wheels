// A grown-up can record the child's name, so the recorded voice can say it.
// Stored in localStorage as a data URL (a couple of seconds of audio).

const KEY = 'hoops-and-wheels-name-audio';

export function hasNameRecording() {
  try { return !!localStorage.getItem(KEY); } catch { return false; }
}

export function deleteNameRecording() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function recordingSupported() {
  return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
}

// Records for `ms`, saves the result and resolves when done.
export async function recordName(ms = 2500) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const type = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find(t => MediaRecorder.isTypeSupported?.(t));
  const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
  const chunks = [];
  rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  const stopped = new Promise(r => { rec.onstop = r; });
  rec.start();
  setTimeout(() => rec.stop(), ms);
  await stopped;
  stream.getTracks().forEach(t => t.stop());
  const blob = new Blob(chunks, { type: rec.mimeType || type || 'audio/mp4' });
  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
  localStorage.setItem(KEY, dataUrl);
}

function decode(ac, buf) {
  return new Promise((res, rej) => ac.decodeAudioData(buf, res, rej));
}

// Cut the silence before and after the name so it slots into sentences.
function trim(ac, buffer) {
  const data = buffer.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
  const limit = peak * 0.08;
  let start = 0;
  let end = data.length - 1;
  while (start < end && Math.abs(data[start]) < limit) start++;
  while (end > start && Math.abs(data[end]) < limit) end--;
  const pad = Math.floor(buffer.sampleRate * 0.04);
  start = Math.max(0, start - pad);
  end = Math.min(data.length, end + pad);
  const out = ac.createBuffer(1, Math.max(1, end - start), buffer.sampleRate);
  const o = out.getChannelData(0);
  const gain = peak ? 0.89 / peak : 1;
  for (let i = 0; i < o.length; i++) o[i] = data[start + i] * gain;
  return out;
}

export async function loadNameBuffer(ac) {
  let url = null;
  try { url = localStorage.getItem(KEY); } catch { /* ignore */ }
  if (!url || !ac) return null;
  try {
    const buf = await (await fetch(url)).arrayBuffer();
    return trim(ac, await decode(ac, buf));
  } catch {
    return null;
  }
}
