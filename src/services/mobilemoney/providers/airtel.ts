import axios, { AxiosInstance } from "axios";

export class AirtelProvider {
  private client: AxiosInstance;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.AIRTEL_BASE_URL,
      timeout: 10000,
    });
  }

  private async authenticate(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const response = await this.client.post("/auth/oauth2/token", null, {
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.AIRTEL_API_KEY}:${process.env.AIRTEL_API_SECRET}`
          ).toString("base64"),
      },
    });

    this.token = response.data.access_token;
    this.tokenExpiry = Date.now() + response.data.expires_in * 1000;

    return this.token!;
  }

  async requestPayment(phoneNumber: string, amount: string) {
    const token = await this.authenticate();
    const reference = Date.now().toString();

    const response = await this.client.post(
      "/merchant/v1/payments/",
      {
        reference,
        subscriber: {
          country: "NG",
          currency: "NGN",
          msisdn: phoneNumber,
        },
        transaction: {
          amount,
          country: "NG",
          currency: "NGN",
          id: reference,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Country": "NG",
          "X-Currency": "NGN",
        },
      }
    );

    return { success: true, data: response.data };
  }

  async sendPayout(phoneNumber: string, amount: string) {
    const token = await this.authenticate();
    const reference = Date.now().toString();

    const response = await this.client.post(
      "/standard/v1/disbursements/",
      {
        reference,
        payee: {
          msisdn: phoneNumber,
        },
        transaction: {
          amount,
          id: reference,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Country": "NG",
          "X-Currency": "NGN",
        },
      }
    );

    return { success: true, data: response.data };
  }
}