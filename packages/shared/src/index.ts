import { z } from 'zod';

export const FlightStatusSchema = z.enum([
  'scheduled',
  'active',
  'landed',
  'cancelled',
  'incident',
  'diverted'
]);

export type FlightStatus = z.infer<typeof FlightStatusSchema>;

export interface FlightState {
  flight_status: FlightStatus;
  dep_scheduled: string | null;
  dep_estimated: string | null;
  dep_actual: string | null;
  arr_scheduled: string | null;
  arr_estimated: string | null;
  arr_actual: string | null;
  terminal_dep: string | null;
  gate_dep: string | null;
  terminal_arr: string | null;
  gate_arr: string | null;
  delay_dep_min: number | null;
  delay_arr_min: number | null;
}

export const EventTypeSchema = z.enum([
  'CANCELLED',
  'DIVERTED',
  'DELAY_30',
  'DELAY_60',
  'GATE_CHANGE',
  'DEPARTED',
  'ARRIVED',
  'STATUS_CHANGE'
]);

export type EventType = z.infer<typeof EventTypeSchema>;
