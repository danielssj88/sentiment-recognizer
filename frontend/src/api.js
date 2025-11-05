const API_BASE = '/api'; // served via Nginx proxy

export async function analyzeImage(file) {
  const form = new FormData()
  form.append('image', file)
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: form
  })
  if (!res.ok) throw new Error('Analysis failed')
  return await res.json()
}
