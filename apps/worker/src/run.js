"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("@flight-tracker/db");
const shared_1 = require("@flight-tracker/shared");
const aerodata_1 = require("./lib/aerodata");
const brevo_1 = require("./lib/brevo");
const prisma = new db_1.PrismaClient();
const POLL_INTERVAL_MS = 60 * 1000;
function hash(obj) {
    return crypto_1.default.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}
function formatDt(dt) {
    if (!dt)
        return '—';
    const d = dt instanceof Date ? dt : new Date(dt);
    // e.g. "Mon, 07 Apr 2026 14:30 UTC"
    return d.toUTCString().replace(/:\d\d GMT$/, ' UTC').replace(/\s+/, ' ');
}
function formatVal(val) {
    if (val === null || val === undefined || val === '')
        return '—';
    if (typeof val === 'string')
        return val;
    if (typeof val === 'number')
        return `${val} min`;
    return JSON.stringify(val);
}
async function processFlight(flight) {
    if (flight.pollingPaused || flight.status === 'LANDED' || flight.status === 'CANCELLED')
        return;
    const now = new Date();
    if (flight.nextPollAt && flight.nextPollAt > now)
        return;
    if (flight.pollingLocked)
        return;
    await prisma.flight.update({ where: { id: flight.id }, data: { pollingLocked: true } });
    try {
        const liveData = await (0, aerodata_1.fetchFlight)(flight.flightIata, flight.flightDate);
        if (!liveData) {
            console.log(`[worker] No data for ${flight.flightIata} ${flight.flightDate}`);
            const nextMs = (0, shared_1.getNextPollMs)(flight.depScheduled ? new Date(flight.depScheduled) : null, now);
            const nextPollAt = nextMs === 0 ? null : new Date(now.getTime() + nextMs);
            await prisma.flight.update({
                where: { id: flight.id },
                data: { lastPolledAt: now, nextPollAt, pollingLocked: false }
            });
            return;
        }
        const newHash = hash(liveData);
        const lastSnapshot = await prisma.flightSnapshot.findFirst({
            where: { flightId: flight.id }, orderBy: { createdAt: 'desc' }
        });
        await prisma.flightSnapshot.create({ data: { flightId: flight.id, hash: newHash, payload: liveData } });
        const oldState = lastSnapshot ? lastSnapshot.payload : null;
        if (!lastSnapshot || lastSnapshot.hash !== newHash) {
            const events = (0, shared_1.detectEvents)(flight.id, oldState, liveData);
            console.log(`[worker] ${flight.flightIata}: ${events.length} event(s) detected (status=${liveData.flight_status})`);
            for (const evt of events) {
                const created = await prisma.flightEvent.upsert({
                    where: { eventKey: evt.key },
                    create: { flightId: flight.id, eventType: evt.type, eventKey: evt.key, oldValue: evt.oldValue, newValue: evt.newValue },
                    update: {}
                });
                await fireNotifications(flight, created, evt.type);
            }
            await prisma.flight.update({
                where: { id: flight.id },
                data: {
                    status: liveData.flight_status,
                    depScheduled: liveData.dep_scheduled ? new Date(liveData.dep_scheduled) : undefined,
                    depEstimated: liveData.dep_estimated ? new Date(liveData.dep_estimated) : undefined,
                    depActual: liveData.dep_actual ? new Date(liveData.dep_actual) : undefined,
                    arrScheduled: liveData.arr_scheduled ? new Date(liveData.arr_scheduled) : undefined,
                    arrEstimated: liveData.arr_estimated ? new Date(liveData.arr_estimated) : undefined,
                    arrActual: liveData.arr_actual ? new Date(liveData.arr_actual) : undefined,
                    terminalDep: liveData.terminal_dep,
                    gateDep: liveData.gate_dep,
                    terminalArr: liveData.terminal_arr,
                    gateArr: liveData.gate_arr,
                    delayDepMin: liveData.delay_dep_min,
                    delayArrMin: liveData.delay_arr_min,
                }
            });
        }
        else {
            console.log(`[worker] ${flight.flightIata}: no change (hash match)`);
        }
        const nextMs = (0, shared_1.getNextPollMs)(flight.depScheduled ? new Date(flight.depScheduled) : null, now);
        const nextPollAt = nextMs === 0 ? null : new Date(now.getTime() + nextMs);
        await prisma.flight.update({
            where: { id: flight.id },
            data: { lastPolledAt: now, nextPollAt, pollingLocked: false, pollingPaused: nextMs === 0 }
        });
    }
    catch (err) {
        console.error(`[worker] Error polling ${flight.flightIata}:`, err.message);
        await prisma.flight.update({ where: { id: flight.id }, data: { pollingLocked: false } });
    }
}
async function fireNotifications(flight, event, eventType) {
    const rule = await prisma.alertRule.findUnique({
        where: { workspaceId_eventType: { workspaceId: flight.workspaceId, eventType: eventType } }
    });
    const staffEnabled = rule ? rule.staffEnabled : true;
    const customerEnabled = rule ? rule.customerEnabled : false;
    // Get linked orders for this flight
    const orderFlights = await prisma.orderFlight.findMany({
        where: { flightId: flight.id },
        include: { order: true }
    });
    const orderRef = orderFlights.length > 0
        ? orderFlights.map((of) => of.order.reference).join(', ')
        : '—';
    if (staffEnabled) {
        const recipients = await prisma.notificationRecipient.findMany({
            where: { workspaceId: flight.workspaceId, type: { in: ['STAFF', 'OPS'] }, isActive: true }
        });
        for (const r of recipients) {
            await sendAndLog(flight, event, r.email, r.name, eventType, orderRef);
        }
    }
    if (customerEnabled && !flight.holdCustomerNotifications) {
        const recipients = await prisma.notificationRecipient.findMany({
            where: { workspaceId: flight.workspaceId, type: 'CUSTOMER', isActive: true }
        });
        for (const r of recipients) {
            await sendAndLog(flight, event, r.email, r.name, eventType, orderRef);
        }
    }
}
async function sendAndLog(flight, event, email, name, eventType, orderRef) {
    const params = {
        flightIata: flight.flightIata,
        airline: flight.airline || '—',
        origin: flight.origin || '—',
        destination: flight.destination || '—',
        originCity: flight.originCity || '',
        destCity: flight.destinationCity || '',
        depScheduled: formatDt(flight.depScheduled),
        arrScheduled: formatDt(flight.arrScheduled),
        depEstimated: formatDt(flight.depEstimated),
        oldValue: formatVal(event.oldValue),
        newValue: formatVal(event.newValue),
        orderRef,
        dashboardUrl: 'https://flights.travelbiuro.com/dashboard/flights/' + flight.id,
    };
    const fallbackSubject = `[${flight.flightIata}] ${eventType.replace(/_/g, ' ')}`;
    const fallbackHtml = (0, brevo_1.buildFallbackHtml)(flight.flightIata, eventType, event.oldValue, event.newValue, params);
    try {
        await (0, brevo_1.sendAlert)({ to: [{ email, name: name ?? undefined }], eventType, params, fallbackSubject, fallbackHtml });
        await prisma.notification.create({
            data: {
                flightId: flight.id, eventId: event.id, recipientEmail: email, recipientName: name,
                subject: fallbackSubject, body: fallbackHtml, status: 'SENT', sentAt: new Date(), provider: 'brevo'
            }
        });
        console.log(`[worker] Email SENT to ${email} for ${eventType}`);
    }
    catch (err) {
        await prisma.notification.create({
            data: {
                flightId: flight.id, eventId: event.id, recipientEmail: email, recipientName: name,
                subject: fallbackSubject, body: fallbackHtml, status: 'FAILED', error: err.message, provider: 'brevo'
            }
        });
        console.error(`[worker] Email FAILED to ${email}:`, err.message);
    }
}
async function mainLoop() {
    console.log('[worker] Starting poll cycle...');
    const flights = await prisma.flight.findMany({
        where: { pollingPaused: false, status: { notIn: ['LANDED', 'CANCELLED'] } }
    });
    console.log(`[worker] ${flights.length} active flights to check`);
    await Promise.all(flights.map(processFlight));
}
async function start() {
    console.log('[worker] Flight Tracker Worker started');
    await mainLoop();
    setInterval(mainLoop, POLL_INTERVAL_MS);
}
start().catch(console.error);
