import axios from 'axios';

export interface NotificationPayload {
  to: string;
  subject: string;
  body: string;
}

export class NotificationService {
  private resendKey: string;
  private twilioSid: string;
  private twilioToken: string;
  private twilioFrom: string;

  constructor() {
    this.resendKey = process.env.RESEND_API_KEY || '';
    this.twilioSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.twilioToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.twilioFrom = process.env.TWILIO_FROM_NUMBER || '';
  }

  async sendEmail(payload: NotificationPayload) {
    if (!this.resendKey) {
      console.log('Resend key not configured, skipping email to:', payload.to);
      return { status: 'SKIPPED', error: 'No API key' };
    }

    try {
      const response = await axios.post('https://api.resend.com/emails', {
        from: 'Flight Updates <onboarding@resend.dev>', // Change to verified domain in production
        to: payload.to,
        subject: payload.subject,
        text: payload.body
      }, {
        headers: { 'Authorization': `Bearer ${this.resendKey}` }
      });
      return { status: 'SENT', provider_message_id: response.data.id };
    } catch (error: any) {
      return { status: 'FAILED', error: error.message };
    }
  }

  async sendSMS(to: string, message: string) {
    if (!this.twilioSid || !this.twilioToken) {
      console.log('Twilio not configured, skipping SMS to:', to);
      return { status: 'SKIPPED', error: 'No API key' };
    }

    try {
      // Twilio uses Basic Auth
      const auth = Buffer.from(`${this.twilioSid}:${this.twilioToken}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', to);
      params.append('From', this.twilioFrom);
      params.append('Body', message);

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.twilioSid}/Messages.json`,
        params,
        { headers: { 'Authorization': `Basic ${auth}` } }
      );
      return { status: 'SENT', provider_message_id: response.data.sid };
    } catch (error: any) {
      return { status: 'FAILED', error: error.message };
    }
  }
}
