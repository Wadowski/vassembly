import Stripe from "stripe";
import { InternalError } from "@vassembly/errors";
import {
  StripeClientParams,
  CreateCustomerParams,
  CreateProductParams,
  UpdateProductParams,
  CreatePriceParams,
  UpdatePriceParams,
  CreateCheckoutSessionParams,
  GetCheckoutSessionParams,
  CreateAccountParams,
  CreateAccountLinkParams,
  CreateLoginLinkParams,
  ConstructWebhookEventParams,
  TransferFundsParams,
  ClientStripe,
} from "./types";

const CONSOLE_LOG_PREFIX = "client-stripe ::";

const buildUrlWithParams = (
  baseUrl: string,
  params?: Record<string, string>
): string => {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }

  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  return url.toString();
};

export const StripeClient = ({
  apiKey,
  webhookSecret,
  successCheckoutUrl,
  cancelCheckoutUrl,
  redirectUrl,
  accountLinkReturnUrl,
  accountLinkRefreshUrl,
}: StripeClientParams): ClientStripe => {
  const stripe = new Stripe(apiKey);

  const createCustomer = async ({
    email,
    name,
    description,
    metadata,
  }: CreateCustomerParams): Promise<Stripe.Customer> => {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        description,
        metadata,
      });
      return customer;
    } catch (err) {
      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to create customer with email ${email}`
      );
    }
  };

  const createProduct = async ({
    name,
    description,
    metadata,
    images,
  }: CreateProductParams): Promise<Stripe.Product> => {
    try {
      const product = await stripe.products.create({
        name,
        description,
        metadata,
        images,
      });
      return product;
    } catch (err) {
      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to create product with name ${name}`
      );
    }
  };

  const updateProduct = async ({
    productId,
    name,
    description,
    metadata,
  }: UpdateProductParams): Promise<Stripe.Product> => {
    try {
      const product = await stripe.products.update(productId, {
        name,
        description,
        metadata,
      });
      return product;
    } catch (err) {
      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to update product with id ${productId}`
      );
    }
  };

  const createPrice = async ({
    productId,
    amount,
    currency,
    type,
    interval,
    intervalCount,
    metadata,
  }: CreatePriceParams): Promise<Stripe.Price> => {
    try {
      const priceParams: Stripe.PriceCreateParams = {
        product: productId,
        unit_amount: amount,
        currency,
        metadata,
      };

      if (type === "recurring" && interval) {
        priceParams.recurring = {
          interval: interval as "day" | "week" | "month" | "year",
          interval_count: intervalCount,
        };
      }

      const price = await stripe.prices.create(priceParams);
      return price;
    } catch (err) {
      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to create price for product ${productId}`
      );
    }
  };

  const updatePrice = async ({
    priceId,
    metadata,
  }: UpdatePriceParams): Promise<Stripe.Price> => {
    try {
      const price = await stripe.prices.update(priceId, {
        metadata,
      });
      return price;
    } catch (err) {
      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to update price with id ${priceId}`
      );
    }
  };

  const createCheckoutSession = async ({
    customerId,
    customerEmail,
    lineItems,
    successUrlParams,
    cancelUrlParams,
    mode = "payment",
    metadata,
  }: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> => {
    try {
      if (!successCheckoutUrl) {
        throw new InternalError(
          `${CONSOLE_LOG_PREFIX} successCheckoutUrl must be configured`
        );
      }

      const finalSuccessUrl = buildUrlWithParams(
        successCheckoutUrl,
        successUrlParams
      );
      const finalCancelUrl = buildUrlWithParams(
        cancelCheckoutUrl,
        cancelUrlParams
      );

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        line_items: lineItems.map((item) => ({
          price: item.priceId,
          quantity: item.quantity,
        })),
        mode,
        success_url: finalSuccessUrl,
        cancel_url: finalCancelUrl,
        metadata,
      };

      if (customerId) {
        sessionParams.customer = customerId;
      } else if (customerEmail) {
        sessionParams.customer_email = customerEmail;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      return session;
    } catch (err) {
      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to create checkout session`
      );
    }
  };

  const getCheckoutSession = async ({
    sessionId,
  }: GetCheckoutSessionParams): Promise<Stripe.Checkout.Session> => {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return session;
    } catch (err) {
      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to retrieve checkout session with id ${sessionId}`
      );
    }
  };

  const createAccount = async ({
    email,
    country,
    type,
    businessType,
    metadata,
  }: CreateAccountParams): Promise<Stripe.Account> => {
    try {
      const accountParams: Stripe.AccountCreateParams = {
        type: type as "standard" | "express" | "custom",
        country,
        email,
        metadata,
      };

      if (businessType) {
        accountParams.business_type = businessType as Stripe.AccountCreateParams.BusinessType;
      }

      const account = await stripe.accounts.create(accountParams);
      return account;
    } catch (err) {
      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to create account with email ${email}`
      );
    }
  };

  const createAccountLink = async ({
    accountId,
    type,
    redirectUrlParams,
  }: CreateAccountLinkParams): Promise<Stripe.AccountLink> => {
    try {
      if (!accountLinkReturnUrl) {
        throw new InternalError(
          `${CONSOLE_LOG_PREFIX} accountLinkReturnUrl must be configured`
        );
      }

      const finalReturnUrl = buildUrlWithParams(
        accountLinkReturnUrl,
        redirectUrlParams
      );
      const finalRefreshUrl = buildUrlWithParams(
        accountLinkRefreshUrl,
        redirectUrlParams
      );

      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        type,
        refresh_url: finalRefreshUrl,
        return_url: finalReturnUrl,
      });
      return accountLink;
    } catch (err) {
      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to create account link for account ${accountId}`
      );
    }
  };

  const createLoginLink = async ({
    accountId,
    redirectUrlParams,
  }: CreateLoginLinkParams): Promise<Stripe.LoginLink> => {
    try {
      const params: Record<string, string> = {};

      if (redirectUrl) {
        const finalRedirectUrl = buildUrlWithParams(
          redirectUrl,
          redirectUrlParams
        );
        params.redirect_url = finalRedirectUrl;
      }

      const loginLink = await stripe.accounts.createLoginLink(
        accountId,
        params as Stripe.AccountCreateLoginLinkParams
      );
      return loginLink;
    } catch (err) {
      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to create login link for account ${accountId}`
      );
    }
  };

  const constructWebhookEvent = ({
    body,
    signature,
  }: ConstructWebhookEventParams): Stripe.Event => {
    if (!webhookSecret) {
      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} webhook secret not provided`
      );
    }

    try {
      const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      return event;
    } catch (err) {
      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to construct webhook event`
      );
    }
  };

  const transferFunds = async ({
    accountId,
    amount,
    currency,
    description,
    metadata,
  }: TransferFundsParams): Promise<Stripe.Transfer> => {
    try {
      const transfer = await stripe.transfers.create({
        amount,
        currency,
        destination: accountId,
        description,
        metadata,
      });
      return transfer;
    } catch (err) {
      throw new InternalError(
        `${CONSOLE_LOG_PREFIX} failed to transfer funds to account ${accountId}`
      );
    }
  };

  return {
    createCustomer,
    createProduct,
    updateProduct,
    createPrice,
    updatePrice,
    createCheckoutSession,
    getCheckoutSession,
    createAccount,
    createAccountLink,
    createLoginLink,
    constructWebhookEvent,
    transferFunds,
  };
};
