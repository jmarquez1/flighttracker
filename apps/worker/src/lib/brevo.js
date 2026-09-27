"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEMPLATES = void 0;
exports.sendAlert = sendAlert;
exports.buildFallbackHtml = buildFallbackHtml;
const axios_1 = __importDefault(require("axios"));
const BASE = 'https://api.brevo.com/v3';
const KEY = process.env.BREVO_API_KEY;
const FROM = { email: process.env.BREVO_FROM_EMAIL, name: process.env.BREVO_FROM_NAME };
// Map event types to Brevo template IDs — created 2026-04-03
exports.TEMPLATES = {
    CANCELLED: 12,
    DIVERTED: 13,
    DELAY_30: 14,
    DELAY_60: 15,
    DELAY_120: 16,
    GATE_CHANGE: 17,
    TERMINAL_CHANGE: 18,
    SCHEDULE_CHANGE: 19,
    DEPARTED: 20,
    ARRIVED: 21,
    LANDED: null,
    STATUS_CHANGE: 22,
    BOARDING: 23,
};
async function sendAlert(opts) {
    const templateId = exports.TEMPLATES[opts.eventType];
    const payload = { sender: FROM, to: opts.to };
    if (templateId) {
        payload.templateId = templateId;
        payload.params = opts.params;
    }
    else {
        payload.subject = opts.fallbackSubject;
        payload.htmlContent = opts.fallbackHtml;
    }
    await axios_1.default.post(`${BASE}/smtp/email`, payload, {
        headers: { 'api-key': KEY, 'Content-Type': 'application/json' }
    });
}
function buildFallbackHtml(flightIata, eventType, oldValue, newValue, params) {
    const labels = {
        CANCELLED: 'Flight Cancelled', DIVERTED: 'Flight Diverted',
        DELAY_30: 'Delay: 30+ min', DELAY_60: 'Delay: 60+ min', DELAY_120: 'Delay: 2+ hours',
        GATE_CHANGE: 'Gate Changed', TERMINAL_CHANGE: 'Terminal Changed',
        SCHEDULE_CHANGE: 'Schedule Changed', DEPARTED: 'Flight Departed',
        ARRIVED: 'Flight Arrived', LANDED: 'Flight Landed', STATUS_CHANGE: 'Status Update',
    };
    const rows = Object.entries(params)
        .map(([k, v]) => `<tr><td style="padding:6px 0;color:#64748b;width:140px">${k}</td><td style="padding:6px 0;color:#1e293b;font-weight:500">${v}</td></tr>`)
        .join('');
    const oldRow = oldValue !== null ? `<tr><td style="padding:6px 0;color:#64748b">Previous</td><td style="padding:6px 0;text-decoration:line-through;color:#94a3b8">${JSON.stringify(oldValue)}</td></tr>` : '';
    const newRow = `<tr><td style="padding:6px 0;color:#64748b">Now</td><td style="padding:6px 0;color:#1e293b;font-weight:600">${JSON.stringify(newValue)}</td></tr>`;
    return `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#1e40af;color:white;padding:16px 24px;border-radius:8px 8px 0 0">
      <strong>Travel Biuro Flight Tracker</strong>
    </div>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:24px;border-radius:0 0 8px 8px">
      <h2 style="margin:0 0 8px;color:#1e293b">${labels[eventType] || eventType}</h2>
      <p style="margin:0 0 16px;color:#64748b">Flight <strong>${flightIata}</strong></p>
      <table style="width:100%;border-collapse:collapse">${rows}${oldRow}${newRow}</table>
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0">
        <a href="https://flights.travelbiuro.com" style="color:#1e40af;font-size:12px">View in Flight Control Room</a>
      </div>
    </div>
  </div>`;
}
