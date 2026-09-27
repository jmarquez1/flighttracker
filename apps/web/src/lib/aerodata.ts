const BASE = 'https://aerodatabox.p.rapidapi.com';
const KEY = process.env.AERODATA_API_KEY!;

function mapStatus(s: string): string {
  const m: Record<string, string> = {
    'Expected': 'SCHEDULED', 'Scheduled': 'SCHEDULED',
    'CheckIn': 'SCHEDULED', 'Boarding': 'SCHEDULED',
    'GateClosed': 'SCHEDULED', 'Delayed': 'SCHEDULED',
    'EnRoute': 'ACTIVE', 'Approaching': 'ACTIVE', 'Departed': 'ACTIVE',
    'Arrived': 'LANDED', 'Landed': 'LANDED',
    'Canceled': 'CANCELLED', 'Cancelled': 'CANCELLED',
    'CanceledUncertain': 'CANCELLED',
    'Diverted': 'DIVERTED', 'Unknown': 'UNKNOWN',
  };
  return m[s] || 'UNKNOWN';
}

function utc(obj: any, ...fields: string[]): string | null {
  for (const f of fields) {
    const v = obj?.[f]?.utc;
    if (v) return v;
  }
  return null;
}

function delayMin(scheduled: string | null, revised: string | null): number | null {
  if (!scheduled || !revised) return null;
  const diff = new Date(revised).getTime() - new Date(scheduled).getTime();
  return diff > 60000 ? Math.round(diff / 60000) : null;
}

export async function previewFlight(flightIata: string, date: string) {
  const res = await fetch(`${BASE}/flights/number/${flightIata}/${date}`, {
    headers: { 'X-RapidAPI-Key': KEY, 'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com' },
    next: { revalidate: 0 }
  });
  if (!res.ok) return null;
  const data = await res.json();
  const f = Array.isArray(data) ? data[0] : data;
  if (!f) return null;

  const dep = f.departure;
  const arr = f.arrival;
  const depSched   = utc(dep, 'scheduledTime');
  const depRevised = utc(dep, 'revisedTime', 'predictedTime');
  const arrSched   = utc(arr, 'scheduledTime');
  const arrRevised = utc(arr, 'revisedTime', 'predictedTime');

  return {
    flightIata:      f.number        || flightIata,
    airline:         f.airline?.name || null,
    origin:          dep?.airport?.iata  || null,
    destination:     arr?.airport?.iata  || null,
    originCity:      dep?.airport?.name  || null,
    destinationCity: arr?.airport?.name  || null,
    status:          mapStatus(f.status || 'Unknown'),
    depScheduled:    depSched,
    depEstimated:    depRevised,
    arrScheduled:    arrSched,
    arrEstimated:    arrRevised,
    gateDep:         dep?.gate         ?? null,
    terminalDep:     dep?.terminal     ?? null,
    terminalArr:     arr?.terminal     ?? null,
    checkInDesk:     dep?.checkInDesk  ?? null,
    baggageBelt:     arr?.baggageBelt  ?? null,
    delayDepMin:     delayMin(depSched, depRevised),
    delayArrMin:     delayMin(arrSched, arrRevised),
  };
}
