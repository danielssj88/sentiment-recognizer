export async function analyzeImage(file) {
  const form = new FormData()
  form.append('image', file)
  const res = await fetch('http://localhost:8000/analyze', {
    method: 'POST',
    body: form
  })
  if (!res.ok) throw new Error('Analysis failed')
  return await res.json()
}
