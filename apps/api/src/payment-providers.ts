import type { PaymentProvider } from "@lider/types";

export type PaymentIntentInput = {
  provider: PaymentProvider;
  amount: number;
  currency: "UAH";
  studentId: string;
};

export type PaymentIntentResult = {
  provider: PaymentProvider;
  redirectUrl: string;
  externalId: string;
};

type ProviderAdapter = {
  createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
};

function buildDemoIntent(provider: PaymentProvider): ProviderAdapter {
  return {
    async createIntent(input) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(`${provider} payment adapter is not configured`);
      }

      return {
        provider,
        externalId: `${provider}_${Date.now()}`,
        redirectUrl: `https://payments.example/${provider}?student=${encodeURIComponent(input.studentId)}&amount=${input.amount}`
      };
    }
  };
}

export const paymentProviders: Record<PaymentProvider, ProviderAdapter> = {
  liqpay: buildDemoIntent("liqpay"),
  fondy: buildDemoIntent("fondy"),
  monobank: buildDemoIntent("monobank")
};
