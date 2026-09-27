"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFlight = fetchFlight;
const axios_1 = __importDefault(require("axios"));
const BASE = 'https://aerodatabox.p.rapidapi.com';
const HEADERS = {
    'X-RapidAPI-Key': process.env.AERODATA_API_KEY,
    'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com'
};
/**
 * Map AeroDataBox status strings to internal FlightStatus enum.
 * Full status list from API docs (case as returned by the API):
 * Expected, CheckIn, Boarding, GateClosed, Delayed, EnRoute,
 * Approaching, Departed, Arrived, Canceled, CanceledUncertain,
 * Diverted, Unknown (+ legacy: Scheduled, Landed)
 */
function mapStatus(s) {
    const m = {
        // Pre-departure
        'Expected': 'SCHEDULED',
        'Scheduled': 'SCHEDULED',
        'CheckIn': 'SCHEDULED',
        'Boarding': 'BOARDING',
        'GateClosed': 'BOARDING',
        'Delayed': 'SCHEDULED',
        // In-flight
        'EnRoute': 'ACTIVE',
        'Approaching': 'ACTIVE',
        'Departed': 'ACTIVE',
        // Terminal
        'Arrived': 'LANDED',
        'Landed': 'LANDED',
        'Canceled': 'CANCELLED', // US spelling
        'Cancelled': 'CANCELLED', // UK spelling
        'CanceledUncertain': 'CANCELLED',
        'Diverted': 'DIVERTED',
        'Unknown': 'UNKNOWN',
    };
    return m[s] || 'UNKNOWN';
}
/** Extract UTC string from one of several nested time objects. */
function utc(obj, ...fields) {
    for (const f of fields) {
        const v = obj?.[f]?.utc;
        if (v)
            return v;
    }
    return null;
}
/**
 * Compute delay in minutes between scheduled and revised/actual time.
 * Returns null if on-time or no data; negative values clamped to null.
 * Note: API has no dedicated delayMinutes field — must be computed.
 */
function delayMin(scheduled, revised) {
    if (!scheduled || !revised)
        return null;
    const diff = new Date(revised).getTime() - new Date(scheduled).getTime();
    return diff > 60000 ? Math.round(diff / 60000) : null; // ignore <1 min noise
}
async function fetchFlight(flightIata, date) {
    try {
        const url = `${BASE}/flights/number/${flightIata}/${date}`;
        const { data } = await axios_1.default.get(url, { headers: HEADERS, timeout: 15000 });
        const f = Array.isArray(data) ? data[0] : data;
        if (!f)
            return null;
        const dep = f.departure;
        const arr = f.arrival;
        // Time fields per API docs:
        //   scheduledTime — original planned time
        //   revisedTime   — updated forecast (what used to be called "estimated")
        //   runwayTime    — actual wheels-off (dep) or wheels-on (arr)
        //   predictedTime — undocumented but observed in real responses; use as fallback
        const depSched = utc(dep, 'scheduledTime');
        const depRevised = utc(dep, 'revisedTime', 'predictedTime');
        const depActual = utc(dep, 'runwayTime');
        const arrSched = utc(arr, 'scheduledTime');
        const arrRevised = utc(arr, 'revisedTime', 'predictedTime');
        const arrActual = utc(arr, 'runwayTime');
        return {
            flight_status: mapStatus(f.status || 'Unknown'),
            dep_scheduled: depSched,
            dep_estimated: depRevised, // revisedTime = new estimate
            dep_actual: depActual, // runwayTime  = actual wheels-off
            arr_scheduled: arrSched,
            arr_estimated: arrRevised,
            arr_actual: arrActual,
            terminal_dep: dep?.terminal ?? null,
            gate_dep: dep?.gate ?? null,
            terminal_arr: arr?.terminal ?? null,
            gate_arr: arr?.gate ?? null,
            // Computed — API has no dedicated delay field
            delay_dep_min: delayMin(depSched, depRevised ?? depActual),
            delay_arr_min: delayMin(arrSched, arrRevised ?? arrActual),
        };
    }
    catch (err) {
        if (err?.response?.status === 404)
            return null;
        throw err;
    }
}
