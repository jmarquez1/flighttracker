"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AviationstackClient = void 0;
const axios_1 = __importDefault(require("axios"));
class AviationstackClient {
    constructor(apiKey) {
        this.baseUrl = 'https://api.aviationstack.com/v1';
        this.apiKey = apiKey;
    }
    async getFlight(iata, date) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/flights`, {
                params: {
                    access_key: this.apiKey,
                    flight_iata: iata,
                    dep_scheduled_date: date, // YYYY-MM-DD
                    limit: 10
                }
            });
            return response.data;
        }
        catch (error) {
            if (error.response) {
                return { data: [], error: error.response.data.error || { code: 'HTTP_ERROR', message: error.message } };
            }
            return { data: [], error: { code: 'UNKNOWN_ERROR', message: error.message } };
        }
    }
    normalize(data) {
        return {
            flight_status: data.flight_status,
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
exports.AviationstackClient = AviationstackClient;
