const API_BASE = 'http://localhost:8000'; // '/api'; // served via Nginx proxy

export async function analyzeImage(file, lang = "en") {
  const form = new FormData()
  form.append('image', file);
  form.append("lang", lang);

  const res = await fetch(`${API_BASE}/analyze?lang=${encodeURIComponent(lang)}`, {
    method: 'POST',
    body: form
  })
  if (!res.ok) throw new Error('Analysis failed')
  return await res.json()
}

export async function ttsPoem(text, voice = "verse", format = "mp3") {
  const res = await fetch(`${API_BASE}/tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, voice, format }),
  });

  if (!res.ok) {
    throw new Error("TTS request failed");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return url; // audio URL for <audio> or new Audio()
}
