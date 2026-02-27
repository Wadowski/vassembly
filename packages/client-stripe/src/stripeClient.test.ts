import { describe, it, expect, vi, beforeEach } from "vitest";
import { StripeClient } from "./stripeClient";
import { InternalError } from "@vassembly/errors";
import Stripe from "stripe";

vi.mock("stripe");
vi.mock("@vassembly/logger");

const mockStripeInstance = {
  customers: { create: vi.fn() },
  products: { create: vi.fn(), update: vi.fn() },
  prices: { create: vi.fn(), update: vi.fn() },
  checkout: { sessions: { create: vi.fn(), retrieve: vi.fn() } },
  accounts: { create: vi.fn(), createLoginLink: vi.fn() },
  accountLinks: { create: vi.fn() },
  transfers: { create: vi.fn() },
  webhooks: { constructEvent: vi.fn() },
};

describe("StripeClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (Stripe as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockStripeInstance
    );
  });

  describe("initialization", () => {
    it("should create a stripe client with apiKey", () => {
      const client = StripeClient({
        apiKey: "sk_test_123",
      });
      expect(client).toBeDefined();
      expect(client.createCustomer).toBeDefined();
      expect(client.createProduct).toBeDefined();
      expect(client.updateProduct).toBeDefined();
      expect(client.createPrice).toBeDefined();
      expect(client.updatePrice).toBeDefined();
      expect(client.createCheckoutSession).toBeDefined();
      expect(client.getCheckoutSession).toBeDefined();
      expect(client.createAccount).toBeDefined();
      expect(client.createAccountLink).toBeDefined();
      expect(client.createLoginLink).toBeDefined();
      expect(client.constructWebhookEvent).toBeDefined();
      expect(client.transferFunds).toBeDefined();
    });
  });

  describe("createCustomer", () => {
    it("should create customer with email only", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      const mockCustomer = { id: "cus_123", email: "test@example.com" };
      mockStripeInstance.customers.create.mockResolvedValue(mockCustomer);

      const result = await client.createCustomer({
        email: "test@example.com",
      });

      expect(result).toEqual(mockCustomer);
      expect(mockStripeInstance.customers.create).toHaveBeenCalledWith({
        email: "test@example.com",
        name: undefined,
        description: undefined,
        metadata: undefined,
      });
    });

    it("should create customer with all parameters", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      const mockCustomer = {
        id: "cus_123",
        email: "test@example.com",
        name: "John Doe",
        description: "Test customer",
      };
      mockStripeInstance.customers.create.mockResolvedValue(mockCustomer);

      const result = await client.createCustomer({
        email: "test@example.com",
        name: "John Doe",
        description: "Test customer",
        metadata: { key: "value" },
      });

      expect(result).toEqual(mockCustomer);
      expect(mockStripeInstance.customers.create).toHaveBeenCalledWith({
        email: "test@example.com",
        name: "John Doe",
        description: "Test customer",
        metadata: { key: "value" },
      });
    });

    it("should throw InternalError on failure", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      mockStripeInstance.customers.create.mockRejectedValue(
        new Error("API error")
      );

      await expect(
        client.createCustomer({ email: "test@example.com" })
      ).rejects.toThrow(InternalError);
    });
  });

  describe("createProduct", () => {
    it("should create product with name only", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      const mockProduct = { id: "prod_123", name: "Test Product" };
      mockStripeInstance.products.create.mockResolvedValue(mockProduct);

      const result = await client.createProduct({ name: "Test Product" });

      expect(result).toEqual(mockProduct);
      expect(mockStripeInstance.products.create).toHaveBeenCalledWith({
        name: "Test Product",
        description: undefined,
        metadata: undefined,
        images: undefined,
      });
    });

    it("should create product with all parameters", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      const mockProduct = {
        id: "prod_123",
        name: "Test Product",
        description: "A test product",
        images: ["https://example.com/image.jpg"],
      };
      mockStripeInstance.products.create.mockResolvedValue(mockProduct);

      const result = await client.createProduct({
        name: "Test Product",
        description: "A test product",
        images: ["https://example.com/image.jpg"],
        metadata: { category: "electronics" },
      });

      expect(result).toEqual(mockProduct);
      expect(mockStripeInstance.products.create).toHaveBeenCalled();
    });

    it("should throw InternalError on failure", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      mockStripeInstance.products.create.mockRejectedValue(
        new Error("API error")
      );

      await expect(
        client.createProduct({ name: "Test Product" })
      ).rejects.toThrow(InternalError);
    });
  });

  describe("updateProduct", () => {
    it("should update product with all parameters", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      const mockProduct = {
        id: "prod_123",
        name: "Updated Product",
        description: "Updated description",
      };
      mockStripeInstance.products.update.mockResolvedValue(mockProduct);

      const result = await client.updateProduct({
        productId: "prod_123",
        name: "Updated Product",
        description: "Updated description",
        metadata: { updated: "true" },
      });

      expect(result).toEqual(mockProduct);
      expect(mockStripeInstance.products.update).toHaveBeenCalledWith(
        "prod_123",
        {
          name: "Updated Product",
          description: "Updated description",
          metadata: { updated: "true" },
        }
      );
    });

    it("should throw InternalError on failure", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      mockStripeInstance.products.update.mockRejectedValue(
        new Error("API error")
      );

      await expect(
        client.updateProduct({ productId: "prod_123" })
      ).rejects.toThrow(InternalError);
    });
  });

  describe("createPrice", () => {
    it("should create one-time price", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      const mockPrice = {
        id: "price_123",
        product: "prod_123",
        unit_amount: 2000,
        currency: "usd",
      };
      mockStripeInstance.prices.create.mockResolvedValue(mockPrice);

      const result = await client.createPrice({
        productId: "prod_123",
        amount: 2000,
        currency: "usd",
        type: "one_time",
      });

      expect(result).toEqual(mockPrice);
      expect(mockStripeInstance.prices.create).toHaveBeenCalled();
    });

    it("should create recurring price with interval", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      const mockPrice = {
        id: "price_123",
        product: "prod_123",
        unit_amount: 2000,
        currency: "usd",
        recurring: { interval: "month" },
      };
      mockStripeInstance.prices.create.mockResolvedValue(mockPrice);

      const result = await client.createPrice({
        productId: "prod_123",
        amount: 2000,
        currency: "usd",
        type: "recurring",
        interval: "month",
        intervalCount: 1,
      });

      expect(result).toEqual(mockPrice);
      expect(mockStripeInstance.prices.create).toHaveBeenCalled();
    });

    it("should throw InternalError on failure", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      mockStripeInstance.prices.create.mockRejectedValue(
        new Error("API error")
      );

      await expect(
        client.createPrice({
          productId: "prod_123",
          amount: 2000,
          currency: "usd",
          type: "one_time",
        })
      ).rejects.toThrow(InternalError);
    });
  });

  describe("updatePrice", () => {
    it("should update price metadata", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      const mockPrice = {
        id: "price_123",
        unit_amount: 2000,
        currency: "usd",
        metadata: { updated: "true" },
      };
      mockStripeInstance.prices.update.mockResolvedValue(mockPrice);

      const result = await client.updatePrice({
        priceId: "price_123",
        metadata: { updated: "true" },
      });

      expect(result).toEqual(mockPrice);
      expect(mockStripeInstance.prices.update).toHaveBeenCalledWith(
        "price_123",
        {
          metadata: { updated: "true" },
        }
      );
    });

    it("should throw InternalError on failure", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      mockStripeInstance.prices.update.mockRejectedValue(
        new Error("API error")
      );

      await expect(
        client.updatePrice({ priceId: "price_123" })
      ).rejects.toThrow(InternalError);
    });
  });

  describe("createCheckoutSession", () => {
    it("should create checkout session with customerId", async () => {
      const client = StripeClient({
        apiKey: "sk_test_123",
        successCheckoutUrl: "https://example.com/success",
        cancelCheckoutUrl: "https://example.com/cancel",
      });
      const mockSession = {
        id: "cs_123",
        customer: "cus_123",
        url: "https://checkout.stripe.com/...",
      };
      mockStripeInstance.checkout.sessions.create.mockResolvedValue(
        mockSession
      );

      const result = await client.createCheckoutSession({
        customerId: "cus_123",
        lineItems: [{ priceId: "price_123", quantity: 1 }],
      });

      expect(result).toEqual(mockSession);
      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalled();
    });

    it("should create checkout session with customerEmail", async () => {
      const client = StripeClient({
        apiKey: "sk_test_123",
        successCheckoutUrl: "https://example.com/success",
        cancelCheckoutUrl: "https://example.com/cancel",
      });
      const mockSession = {
        id: "cs_123",
        customer_email: "test@example.com",
        url: "https://checkout.stripe.com/...",
      };
      mockStripeInstance.checkout.sessions.create.mockResolvedValue(
        mockSession
      );

      const result = await client.createCheckoutSession({
        customerEmail: "test@example.com",
        lineItems: [{ priceId: "price_123", quantity: 1 }],
      });

      expect(result).toEqual(mockSession);
      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalled();
    });

    it("should create subscription checkout session", async () => {
      const client = StripeClient({
        apiKey: "sk_test_123",
        successCheckoutUrl: "https://example.com/success",
        cancelCheckoutUrl: "https://example.com/cancel",
      });
      const mockSession = {
        id: "cs_123",
        mode: "subscription",
        url: "https://checkout.stripe.com/...",
      };
      mockStripeInstance.checkout.sessions.create.mockResolvedValue(
        mockSession
      );

      const result = await client.createCheckoutSession({
        customerId: "cus_123",
        lineItems: [{ priceId: "price_123", quantity: 1 }],
        mode: "subscription",
      });

      expect(result).toEqual(mockSession);
      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalled();
    });

    it("should throw InternalError when successCheckoutUrl is not provided", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });

      await expect(
        client.createCheckoutSession({
          customerId: "cus_123",
          lineItems: [{ priceId: "price_123", quantity: 1 }],
        })
      ).rejects.toThrow(InternalError);
    });

    it("should add query params to success and cancel URLs", async () => {
      const client = StripeClient({
        apiKey: "sk_test_123",
        successCheckoutUrl: "https://config.example.com/success",
        cancelCheckoutUrl: "https://config.example.com/cancel",
      });
      const mockSession = {
        id: "cs_123",
        customer: "cus_123",
        url: "https://checkout.stripe.com/...",
      };
      mockStripeInstance.checkout.sessions.create.mockResolvedValue(
        mockSession
      );

      const result = await client.createCheckoutSession({
        customerId: "cus_123",
        lineItems: [{ priceId: "price_123", quantity: 1 }],
        successUrlParams: { orderId: "order_123", userId: "user_456" },
        cancelUrlParams: { reason: "user_cancelled" },
      });

      expect(result).toEqual(mockSession);
      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: expect.stringContaining("orderId=order_123"),
          cancel_url: expect.stringContaining("reason=user_cancelled"),
        })
      );
    });

    it("should throw InternalError on failure", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      mockStripeInstance.checkout.sessions.create.mockRejectedValue(
        new Error("API error")
      );

      await expect(
        client.createCheckoutSession({
          customerId: "cus_123",
          lineItems: [{ priceId: "price_123", quantity: 1 }],
        })
      ).rejects.toThrow(InternalError);
    });
  });

  describe("getCheckoutSession", () => {
    it("should retrieve checkout session", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      const mockSession = {
        id: "cs_123",
        customer: "cus_123",
        payment_status: "paid",
      };
      mockStripeInstance.checkout.sessions.retrieve.mockResolvedValue(
        mockSession
      );

      const result = await client.getCheckoutSession({ sessionId: "cs_123" });

      expect(result).toEqual(mockSession);
      expect(mockStripeInstance.checkout.sessions.retrieve).toHaveBeenCalledWith(
        "cs_123"
      );
    });

    it("should throw InternalError on failure", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      mockStripeInstance.checkout.sessions.retrieve.mockRejectedValue(
        new Error("Not found")
      );

      await expect(
        client.getCheckoutSession({ sessionId: "cs_123" })
      ).rejects.toThrow(InternalError);
    });
  });

  describe("createAccount", () => {
    it("should create connected account", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      const mockAccount = { id: "acct_123", type: "standard", email: "test@example.com" };
      mockStripeInstance.accounts.create.mockResolvedValue(mockAccount);

      const result = await client.createAccount({
        email: "test@example.com",
        country: "US",
        type: "standard",
      });

      expect(result).toEqual(mockAccount);
      expect(mockStripeInstance.accounts.create).toHaveBeenCalled();
    });

    it("should create express account with business type", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      const mockAccount = {
        id: "acct_123",
        type: "express",
        email: "test@example.com",
        business_type: "individual",
      };
      mockStripeInstance.accounts.create.mockResolvedValue(mockAccount);

      const result = await client.createAccount({
        email: "test@example.com",
        country: "US",
        type: "express",
        businessType: "individual",
        metadata: { onboarded: "false" },
      });

      expect(result).toEqual(mockAccount);
      expect(mockStripeInstance.accounts.create).toHaveBeenCalled();
    });

    it("should throw InternalError on failure", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      mockStripeInstance.accounts.create.mockRejectedValue(
        new Error("API error")
      );

      await expect(
        client.createAccount({
          email: "test@example.com",
          country: "US",
          type: "standard",
        })
      ).rejects.toThrow(InternalError);
    });
  });

  describe("createAccountLink", () => {
    it("should create account onboarding link", async () => {
      const client = StripeClient({
        apiKey: "sk_test_123",
        accountLinkReturnUrl: "https://example.com/return",
        accountLinkRefreshUrl: "https://example.com/refresh",
      });
      const mockLink = { url: "https://connect.stripe.com/..." };
      mockStripeInstance.accountLinks.create.mockResolvedValue(mockLink);

      const result = await client.createAccountLink({
        accountId: "acct_123",
        type: "account_onboarding",
      });

      expect(result).toEqual(mockLink);
      expect(mockStripeInstance.accountLinks.create).toHaveBeenCalled();
    });

    it("should use configured return and refresh URLs", async () => {
      const client = StripeClient({
        apiKey: "sk_test_123",
        accountLinkReturnUrl: "https://config.example.com/return",
        accountLinkRefreshUrl: "https://config.example.com/refresh",
      });
      const mockLink = { url: "https://connect.stripe.com/..." };
      mockStripeInstance.accountLinks.create.mockResolvedValue(mockLink);

      const result = await client.createAccountLink({
        accountId: "acct_123",
        type: "account_onboarding",
      });

      expect(result).toEqual(mockLink);
      expect(mockStripeInstance.accountLinks.create).toHaveBeenCalledWith({
        account: "acct_123",
        type: "account_onboarding",
        refresh_url: "https://config.example.com/refresh",
        return_url: "https://config.example.com/return",
      });
    });

    it("should add query params to redirect URLs", async () => {
      const client = StripeClient({
        apiKey: "sk_test_123",
        accountLinkReturnUrl: "https://config.example.com/return",
        accountLinkRefreshUrl: "https://config.example.com/refresh",
      });
      const mockLink = { url: "https://connect.stripe.com/..." };
      mockStripeInstance.accountLinks.create.mockResolvedValue(mockLink);

      const result = await client.createAccountLink({
        accountId: "acct_123",
        type: "account_onboarding",
        redirectUrlParams: { accountId: "acct_123", status: "pending" },
      });

      expect(result).toEqual(mockLink);
      expect(mockStripeInstance.accountLinks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          refresh_url: expect.stringContaining("accountId=acct_123"),
          return_url: expect.stringContaining("status=pending"),
        })
      );
    });

    it("should throw InternalError when accountLinkReturnUrl is not provided", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });

      await expect(
        client.createAccountLink({
          accountId: "acct_123",
          type: "account_onboarding",
        })
      ).rejects.toThrow(InternalError);
    });

    it("should throw InternalError on failure", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      mockStripeInstance.accountLinks.create.mockRejectedValue(
        new Error("API error")
      );

      await expect(
        client.createAccountLink({
          accountId: "acct_123",
          type: "account_onboarding",
        })
      ).rejects.toThrow(InternalError);
    });
  });

  describe("createLoginLink", () => {
    it("should create login link for connected account", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      const mockLink = { url: "https://dashboard.stripe.com/..." };
      mockStripeInstance.accounts.createLoginLink.mockResolvedValue(mockLink);

      const result = await client.createLoginLink({
        accountId: "acct_123",
      });

      expect(result).toEqual(mockLink);
      expect(mockStripeInstance.accounts.createLoginLink).toHaveBeenCalled();
    });

    it("should add query params to redirect URL when redirectUrl is configured", async () => {
      const client = StripeClient({
        apiKey: "sk_test_123",
        redirectUrl: "https://example.com/redirect",
      });
      const mockLink = { url: "https://dashboard.stripe.com/..." };
      mockStripeInstance.accounts.createLoginLink.mockResolvedValue(mockLink);

      const result = await client.createLoginLink({
        accountId: "acct_123",
        redirectUrlParams: { returnTo: "/account", userId: "user_123" },
      });

      expect(result).toEqual(mockLink);
      expect(mockStripeInstance.accounts.createLoginLink).toHaveBeenCalledWith(
        "acct_123",
        expect.objectContaining({
          redirect_url: expect.stringContaining("returnTo=%2Faccount"),
        })
      );
    });

    it("should throw InternalError on failure", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      mockStripeInstance.accounts.createLoginLink.mockRejectedValue(
        new Error("API error")
      );

      await expect(
        client.createLoginLink({
          accountId: "acct_123",
        })
      ).rejects.toThrow(InternalError);
    });
  });

  describe("constructWebhookEvent", () => {
    it("should construct webhook event", () => {
      const client = StripeClient({
        apiKey: "sk_test_123",
        webhookSecret: "whsec_test_123",
      });
      const mockEvent = {
        id: "evt_123",
        type: "charge.succeeded",
        data: { object: { id: "ch_123" } },
      };
      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent);

      const result = client.constructWebhookEvent({
        body: JSON.stringify({ type: "charge.succeeded" }),
        signature: "t=123,v1=signature",
      });

      expect(result).toEqual(mockEvent);
      expect(mockStripeInstance.webhooks.constructEvent).toHaveBeenCalled();
    });

    it("should throw InternalError when webhook secret is not provided", () => {
      const client = StripeClient({ apiKey: "sk_test_123" });

      expect(() =>
        client.constructWebhookEvent({
          body: JSON.stringify({ type: "charge.succeeded" }),
          signature: "t=123,v1=signature",
        })
      ).toThrow(InternalError);
    });

    it("should throw InternalError on invalid signature", () => {
      const client = StripeClient({
        apiKey: "sk_test_123",
        webhookSecret: "whsec_test_123",
      });
      mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      expect(() =>
        client.constructWebhookEvent({
          body: JSON.stringify({ type: "charge.succeeded" }),
          signature: "invalid",
        })
      ).toThrow(InternalError);
    });
  });

  describe("transferFunds", () => {
    it("should transfer funds to connected account", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      const mockTransfer = {
        id: "tr_123",
        destination: "acct_123",
        amount: 5000,
        currency: "usd",
      };
      mockStripeInstance.transfers.create.mockResolvedValue(mockTransfer);

      const result = await client.transferFunds({
        accountId: "acct_123",
        amount: 5000,
        currency: "usd",
        description: "Payout for order #123",
      });

      expect(result).toEqual(mockTransfer);
      expect(mockStripeInstance.transfers.create).toHaveBeenCalledWith({
        amount: 5000,
        currency: "usd",
        destination: "acct_123",
        description: "Payout for order #123",
        metadata: undefined,
      });
    });

    it("should transfer with metadata", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      const mockTransfer = {
        id: "tr_123",
        destination: "acct_123",
        amount: 5000,
        currency: "usd",
      };
      mockStripeInstance.transfers.create.mockResolvedValue(mockTransfer);

      const result = await client.transferFunds({
        accountId: "acct_123",
        amount: 5000,
        currency: "usd",
        metadata: { orderId: "order_123" },
      });

      expect(result).toEqual(mockTransfer);
      expect(mockStripeInstance.transfers.create).toHaveBeenCalled();
    });

    it("should throw InternalError on failure", async () => {
      const client = StripeClient({ apiKey: "sk_test_123" });
      mockStripeInstance.transfers.create.mockRejectedValue(
        new Error("Insufficient funds")
      );

      await expect(
        client.transferFunds({
          accountId: "acct_123",
          amount: 5000,
          currency: "usd",
        })
      ).rejects.toThrow(InternalError);
    });
  });
});
