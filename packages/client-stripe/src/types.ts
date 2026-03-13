import Stripe from "stripe";

export interface StripeClientParams {
  apiKey: string; 
  webhookSecret?: string;
  successCheckoutUrl?: string;
  cancelCheckoutUrl?: string;
  redirectUrl?: string;
  accountLinkReturnUrl?: string;
  accountLinkRefreshUrl?: string;
}

export interface CreateCustomerParams {
  email: string;
  name?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreateProductParams {
  name: string;
  description?: string;
  metadata?: Record<string, string>;
  images?: string[];
}

export interface UpdateProductParams {
  productId: string;
  name?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreatePriceParams {
  productId: string;
  amount: number;
  currency: string;
  type: "one_time" | "recurring";
  interval?: "month" | "year" | "week" | "day";
  intervalCount?: number;
  metadata?: Record<string, string>;
}

export interface UpdatePriceParams {
  priceId: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionParams {
  customerId?: string;
  customerEmail?: string;
  lineItems: Array<{
    priceId: string;
    quantity: number;
  }>;
  successUrlParams?: Record<string, string>;
  cancelUrlParams?: Record<string, string>;
  mode?: "payment" | "subscription" | "setup";
  metadata?: Record<string, string>;
}

export interface GetCheckoutSessionParams {
  sessionId: string;
}

export interface CreateAccountParams {
  email: string;
  country: string;
  type: "standard" | "express" | "custom";
  businessType?: string;
  metadata?: Record<string, string>;
}

export interface CreateAccountLinkParams {
  accountId: string;
  type: "account_onboarding" | "account_update";
  redirectUrlParams?: Record<string, string>;
}

export interface CreateLoginLinkParams {
  accountId: string;
  redirectUrlParams?: Record<string, string>;
}

export interface ConstructWebhookEventParams {
  body: string | Buffer;
  signature: string;
}

export interface TransferFundsParams {
  accountId: string;
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface ClientStripe {
  createCustomer: (
    params: CreateCustomerParams
  ) => Promise<Stripe.Customer>;
  createProduct: (params: CreateProductParams) => Promise<Stripe.Product>;
  updateProduct: (params: UpdateProductParams) => Promise<Stripe.Product>;
  createPrice: (params: CreatePriceParams) => Promise<Stripe.Price>;
  updatePrice: (params: UpdatePriceParams) => Promise<Stripe.Price>;
  createCheckoutSession: (
    params: CreateCheckoutSessionParams
  ) => Promise<Stripe.Checkout.Session>;
  getCheckoutSession: (
    params: GetCheckoutSessionParams
  ) => Promise<Stripe.Checkout.Session>;
  createAccount: (
    params: CreateAccountParams
  ) => Promise<Stripe.Account>;
  createAccountLink: (
    params: CreateAccountLinkParams
  ) => Promise<Stripe.AccountLink>;
  createLoginLink: (
    params: CreateLoginLinkParams
  ) => Promise<Stripe.LoginLink>;
  constructWebhookEvent: (
    params: ConstructWebhookEventParams
  ) => Stripe.Event;
  transferFunds: (params: TransferFundsParams) => Promise<Stripe.Transfer>;
}
