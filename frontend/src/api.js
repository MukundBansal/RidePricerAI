const BASE = 'http://localhost:8000'

export async function predictPrice(formData) {
  const body = {
    pickup_location: formData.pickup_location,
    dropoff_location: formData.dropoff_location,
    cab_type: formData.cab_type,
  }
  if (formData.simulated_hour !== null && formData.simulated_hour !== undefined) {
    body.simulated_hour = formData.simulated_hour
  }

  const res = await fetch(`${BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Prediction failed')
  return res.json()
}

export async function explainPrice(payload) {
  const res = await fetch(`${BASE}/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Explain failed')
  return res.json()
}

export async function getMetrics() {
  const res = await fetch(`${BASE}/metrics`)
  if (!res.ok) throw new Error('Metrics failed')
  return res.json()
}

export async function getSimulation() {
  const res = await fetch(`${BASE}/simulate`)
  if (!res.ok) throw new Error('Simulation failed')
  return res.json()
}
