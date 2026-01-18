import { FlightState, EventType } from '@flight-tracker/shared';

export interface DetectedEvent {
  type: EventType;
  key: string;
  oldState: any;
  newState: any;
}

export function detectEvents(flightId: string, oldState: FlightState | null, newState: FlightState): DetectedEvent[] {
  const events: DetectedEvent[] = [];

  if (!oldState) {
    // Initial event or no previous state to compare
    events.push({
      type: 'STATUS_CHANGE',
      key: `${flightId}:STATUS_CHANGE:${newState.flight_status}`,
      oldState: null,
      newState: newState.flight_status
    });
    return events;
  }

  // Status Change
  if (oldState.flight_status !== newState.flight_status) {
    events.push({
      type: 'STATUS_CHANGE',
      key: `${flightId}:STATUS_CHANGE:${newState.flight_status}`,
      oldState: oldState.flight_status,
      newState: newState.flight_status
    });

    if (newState.flight_status === 'cancelled') {
      events.push({
        type: 'CANCELLED',
        key: `${flightId}:CANCELLED`,
        oldState: oldState.flight_status,
        newState: 'cancelled'
      });
    }

    if (newState.flight_status === 'diverted') {
      events.push({
        type: 'DIVERTED',
        key: `${flightId}:DIVERTED`,
        oldState: oldState.flight_status,
        newState: 'diverted'
      });
    }
  }

  // Gate Change (Departure)
  if (oldState.gate_dep !== newState.gate_dep && newState.gate_dep) {
    events.push({
      type: 'GATE_CHANGE',
      key: `${flightId}:GATE_CHANGE:${newState.gate_dep}`,
      oldState: oldState.gate_dep,
      newState: newState.gate_dep
    });
  }

  // Delay
  const oldDelay = oldState.delay_dep_min || 0;
  const newDelay = newState.delay_dep_min || 0;

  if (oldDelay < 30 && newDelay >= 30) {
    events.push({
      type: 'DELAY_30',
      key: `${flightId}:DELAY_30:${newDelay}`,
      oldState: oldDelay,
      newState: newDelay
    });
  }

  if (oldDelay < 60 && newDelay >= 60) {
    events.push({
      type: 'DELAY_60',
      key: `${flightId}:DELAY_60:${newDelay}`,
      oldState: oldDelay,
      newState: newDelay
    });
  }

  // Departure
  if (!oldState.dep_actual && newState.dep_actual) {
    events.push({
      type: 'DEPARTED',
      key: `${flightId}:DEPARTED:${newState.dep_actual}`,
      oldState: null,
      newState: newState.dep_actual
    });
  }

  // Arrival
  if (!oldState.arr_actual && newState.arr_actual) {
    events.push({
      type: 'ARRIVED',
      key: `${flightId}:ARRIVED:${newState.arr_actual}`,
      oldState: null,
      newState: newState.arr_actual
    });
  }

  return events;
}
