import axios from 'axios';
import { FlightState } from '@flight-tracker/shared';

export interface AviationstackResponse {
  data: Array<{
    flight_status: string;
    departure: {
      scheduled: string;
      estimated: string | null;
      actual: string | null;
      terminal: string | null;
      gate: string | null;
      delay: number | null;
    };
    arrival: {
      scheduled: string;
      estimated: string | null;
      actual: string | null;
      terminal: string | null;
      gate: string | null;
      delay: number | null;
    };
  }>;
  error?: {
    code: string;
    message: string;
  };
}

export class AviationstackClient {
  private apiKey: string;
  private baseUrl = 'https://api.aviationstack.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getFlight(iata: string, date: string): Promise<AviationstackResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/flights`, {
        params: {
          access_key: this.apiKey,
          flight_iata: iata,
          dep_scheduled_date: date, // YYYY-MM-DD
          limit: 10
        }
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return { data: [], error: error.response.data.error || { code: 'HTTP_ERROR', message: error.message } };
      }
      return { data: [], error: { code: 'UNKNOWN_ERROR', message: error.message } };
    }
  }

  normalize(data: AviationstackResponse['data'][0]): FlightState {
    return {
      flight_status: data.flight_status as any,
      dep_scheduled: data.departure.scheduled,
      dep_estimated: data.departure.estimated,
      dep_actual: data.departure.actual,
      arr_scheduled: data.arrival.scheduled,
      arr_estimated: data.arrival.estimated,
      arr_actual: data.arrival.actual,
      terminal_dep: data.departure.terminal,
      gate_dep: data.departure.gate,
      terminal_arr: data.arrival.terminal,
      gate_arr: data.arrival.gate,
      delay_dep_min: data.departure.delay,
      delay_arr_min: data.arrival.delay,
    };
  }
}
