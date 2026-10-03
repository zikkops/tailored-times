// How customers can pay. Cash on delivery is the only one for now (owner,
// 21 Sep 2026); others are listed as not available yet, so the order form,
// the confirmation, the account and the admin all read from one place.
//
// To add a method later: add it here with enabled: true, then handle taking
// the payment in createOrder. Everything that displays a method picks it up.

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
    id: "card",
    label: "Card online",
    help: "Not available yet.",
    enabled: false,
    after: "Paid by card.",
  },
];

export const ENABLED_PAYMENT_METHODS = PAYMENT_METHODS.filter((m) => m.enabled);
export const DEFAULT_PAYMENT_METHOD = ENABLED_PAYMENT_METHODS[0].id;

export const isPayable = (id: string) => ENABLED_PAYMENT_METHODS.some((m) => m.id === id);

export const paymentLabel = (id: string) => PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id;

export const paymentAfter = (id: string) => PAYMENT_METHODS.find((m) => m.id === id)?.after ?? "";
