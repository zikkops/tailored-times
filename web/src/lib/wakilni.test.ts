import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { areaNames, deliveryPayload } = await import("./wakilni");

const order = {
  reference: "TT-000123",
  template_name: "Birthday 1",
  copies: 2,
  frames: true,
  price: 85.5,
  payment_method: "cod",
  customer_name: "Mia Rose Haddad",
  customer_phone: "+961 70 000 000",
  customer_email: "mia@example.com",
  delivery_address: "Bliss St, Building 4, 3rd floor",
  delivery_area: "Hamra",
};

describe("Wakilni delivery", () => {
  it("collects the price in cash, in USD, for cash-on-delivery orders", () => {
    const p = deliveryPayload(order);
    expect(p).toMatchObject({
      waybill: "TT-000123",
      receiver_id: 123,
      receiver_location_id: 123,
      receiver_first_name: "Mia",
      receiver_last_name: "Rose Haddad",
      receiver_area: "Hamra",
      receiver_directions: "Bliss St, Building 4, 3rd floor",
      currency: 1,
      cash_collection_type_id: 52,
      collection_amount: 85.5,
    });
    expect(p.packages).toEqual([{ quantity: 2, type_id: 58, name: "Birthday 1 newspaper (framed)", sku: "TT-000123" }]);
  });

  it("collects nothing for paid orders, and sends unframed papers as paper", () => {
    const p = deliveryPayload({ ...order, payment_method: "card", frames: false, customer_name: "Cher", customer_email: null });
    expect(p.cash_collection_type_id).toBe(54);
    expect(p.collection_amount).toBe(0);
    expect(p.packages[0].type_id).toBe(57);
    expect(p.receiver_last_name).toBe("Cher");
    expect(p).not.toHaveProperty("receiver_email");
  });

  it("reads area names from either shape of the list", () => {
    expect(areaNames({ data: [{ id: 1, name: "Hamra" }, { id: 2, name: " Achrafieh " }, { id: 3, name: "Hamra" }] })).toEqual([
      "Achrafieh",
      "Hamra",
    ]);
    expect(areaNames([{ name: "Jounieh" }, { nope: 1 }])).toEqual(["Jounieh"]);
    expect(areaNames({ message: "Unauthenticated." })).toEqual([]);
  });
});
