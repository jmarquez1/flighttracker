"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatNotification = formatNotification;
function formatNotification(type, flightIata, groupName, detail) {
    let subject = `[Flight Update] ${groupName} — ${flightIata} — ${type}`;
    let body = `${groupName}: `;
    switch (type) {
        case 'CANCELLED':
            body += `Flight ${flightIata} has been CANCELLED.`;
            break;
        case 'DIVERTED':
            body += `Flight ${flightIata} has been DIVERTED.`;
            break;
        case 'DELAY_30':
            body += `Flight ${flightIata} is delayed by ${detail} minutes.`;
            break;
        case 'DELAY_60':
            body += `Flight ${flightIata} is SIGNIFICANTLY delayed by ${detail} minutes.`;
            break;
        case 'GATE_CHANGE':
            body += `Gate for ${flightIata} changed to ${detail}.`;
            break;
        case 'DEPARTED':
            body += `Flight ${flightIata} has DEPARTED at ${detail}.`;
            break;
        case 'ARRIVED':
            body += `Flight ${flightIata} has ARRIVED at ${detail}.`;
            break;
        case 'STATUS_CHANGE':
            body += `Status for ${flightIata} changed to ${detail}.`;
            break;
        default:
            body += `Update for flight ${flightIata}: ${type}`;
    }
    return { subject, body };
}
