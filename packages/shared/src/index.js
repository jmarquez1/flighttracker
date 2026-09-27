"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventTypeSchema = exports.FlightStatusSchema = void 0;
exports.detectEvents = detectEvents;
exports.getNextPollMs = getNextPollMs;
const zod_1 = require("zod");
exports.FlightStatusSchema = zod_1.z.enum([
    'SCHEDULED', 'BOARDING', 'ACTIVE', 'LANDED', 'CANCELLED', 'DIVERTED', 'INCIDENT', 'UNKNOWN'
]);
exports.EventTypeSchema = zod_1.z.enum([
    'CANCELLED', 'DIVERTED', 'DELAY_30', 'DELAY_60', 'DELAY_120',
    'GATE_CHANGE', 'TERMINAL_CHANGE', 'SCHEDULE_CHANGE',
    'DEPARTED', 'ARRIVED', 'LANDED', 'STATUS_CHANGE', 'BOARDING'
]);
function detectEvents(flightId, oldState, newState) {
    const events = [];
    if (!oldState) {
        events.push({ type: 'STATUS_CHANGE', key: `${flightId}:INIT:${newState.flight_status}`, oldValue: null, newValue: newState.flight_status });
        return events;
    }
    if (oldState.flight_status !== newState.flight_status) {
        events.push({ type: 'STATUS_CHANGE', key: `${flightId}:STATUS:${newState.flight_status}`, oldValue: oldState.flight_status, newValue: newState.flight_status });
        if (newState.flight_status === 'CANCELLED')
            events.push({ type: 'CANCELLED', key: `${flightId}:CANCELLED`, oldValue: oldState.flight_status, newValue: 'CANCELLED' });
        if (newState.flight_status === 'DIVERTED')
            events.push({ type: 'DIVERTED', key: `${flightId}:DIVERTED`, oldValue: oldState.flight_status, newValue: 'DIVERTED' });
        if (newState.flight_status === 'BOARDING' && oldState.flight_status !== 'BOARDING')
            events.push({ type: 'BOARDING', key: `${flightId}:BOARDING`, oldValue: oldState.flight_status, newValue: 'BOARDING' });
    }
    if (oldState.gate_dep !== newState.gate_dep && newState.gate_dep)
        events.push({ type: 'GATE_CHANGE', key: `${flightId}:GATE:${newState.gate_dep}`, oldValue: oldState.gate_dep, newValue: newState.gate_dep });
    if (oldState.terminal_dep !== newState.terminal_dep && newState.terminal_dep)
        events.push({ type: 'TERMINAL_CHANGE', key: `${flightId}:TERMINAL:${newState.terminal_dep}`, oldValue: oldState.terminal_dep, newValue: newState.terminal_dep });
    const oldDelay = oldState.delay_dep_min || 0;
    const newDelay = newState.delay_dep_min || 0;
    if (oldDelay < 30 && newDelay >= 30)
        events.push({ type: 'DELAY_30', key: `${flightId}:DELAY30`, oldValue: oldDelay, newValue: newDelay });
    if (oldDelay < 60 && newDelay >= 60)
        events.push({ type: 'DELAY_60', key: `${flightId}:DELAY60`, oldValue: oldDelay, newValue: newDelay });
    if (oldDelay < 120 && newDelay >= 120)
        events.push({ type: 'DELAY_120', key: `${flightId}:DELAY120`, oldValue: oldDelay, newValue: newDelay });
    const oldDep = oldState.dep_scheduled || oldState.dep_estimated;
    const newDep = newState.dep_scheduled || newState.dep_estimated;
    if (oldDep && newDep && oldDep !== newDep)
        events.push({ type: 'SCHEDULE_CHANGE', key: `${flightId}:SCHED:${newDep}`, oldValue: oldDep, newValue: newDep });
    if (!oldState.dep_actual && newState.dep_actual)
        events.push({ type: 'DEPARTED', key: `${flightId}:DEPARTED`, oldValue: null, newValue: newState.dep_actual });
    if (!oldState.arr_actual && newState.arr_actual)
        events.push({ type: 'ARRIVED', key: `${flightId}:ARRIVED`, oldValue: null, newValue: newState.arr_actual });
    return events;
}
function getNextPollMs(depScheduled, now = new Date()) {
    if (!depScheduled)
        return 6 * 60 * 60 * 1000; // 6h default
    const msUntilDep = depScheduled.getTime() - now.getTime();
    const msAfterDep = now.getTime() - depScheduled.getTime();
    if (msUntilDep > 30 * 24 * 60 * 60 * 1000)
        return 24 * 60 * 60 * 1000; // >30d: daily
    if (msUntilDep > 7 * 24 * 60 * 60 * 1000)
        return 6 * 60 * 60 * 1000; // 7-30d: 6h
    if (msUntilDep > 48 * 60 * 60 * 1000)
        return 2 * 60 * 60 * 1000; // 2-7d: 2h
    if (msUntilDep > 0 || msAfterDep < 3 * 60 * 60 * 1000)
        return 10 * 60 * 1000; // ±3h: 10min
    return 0; // landed window passed — stop
}
