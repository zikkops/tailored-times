// How customers can pay: cash on delivery (owner, 21 Sep 2026) and Whish
// (16 Oct 2026). The order form, the confirmation, the account and the admin
// all read from here, so a method is described in one place only.
//
// Whish shows up only where NEXT_PUBLIC_WHISH_ENABLED is "1". It is a public
// setting on purpose: the browser and the server have to agree on which
// methods exist, and the keys themselves (WHISH_CHANNEL, WHISH_SECRET) stay
// on the server. createOrder checks the real configuration before taking
// anyone to Whish, so turning this on without keys cannot take an order
// hostage.

export type PaymentMethod = {
  id: string;
  label: string;
  help: string;
  enabled: boolean;
  /** Shown on the confirmation page and in the account. */
  after: string;
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "cod",
    label: "Cash on delivery",
    help: "Pay the courier when your papers arrive. Delivery is free.",
    enabled: true,
    after: "You pay cash when your order is delivered.",
  },
  {
    id: "whish",
    label: "Whish",
    help: "Pay now through Whish. You will be taken there to finish, then brought back.",
    enabled: process.env.NEXT_PUBLIC_WHISH_ENABLED === "1",
    after: "Paid through Whish.",
  },
];

/** Methods paid before delivery, so the courier collects nothing. */
export const isPaidOnline = (id: string) => id !== "cod";

export const ENABLED_PAYMENT_METHODS = PAYMENT_METHODS.filter((m) => m.enabled);
export const DEFAULT_PAYMENT_METHOD = ENABLED_PAYMENT_METHODS[0].id;

export const isPayable = (id: string) => ENABLED_PAYMENT_METHODS.some((m) => m.id === id);

export const paymentLabel = (id: string) => PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id;

export const paymentAfter = (id: string) => PAYMENT_METHODS.find((m) => m.id === id)?.after ?? "";
