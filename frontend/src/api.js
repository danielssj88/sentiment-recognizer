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
