import { calculatePrice, DEFAULT_PRICING, type Format, type Size } from "@/lib/pricing";
import type { OrderStatus } from "@/lib/orders";

// Sample data for the admin area, so the whole back office can be designed and
// clicked through before any database exists. Switched on by ADMIN_DEMO=1 (see
// lib/env.ts). Nothing here is real: names, phones and addresses are made up.
// When the real back end lands, this file only serves as a fallback.

export type DemoOrder = {
  id: string;
  reference: string;
  template_name: string;
  format: Format;
  size: Size;
  pages: number;
  copies: number;
  frames: boolean;
  designer: boolean;
  price: number;
  currency: string;
  status: OrderStatus;
  payment_method: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const daysAgo = (days: number, hour = 11) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, (days * 7) % 60, 0, 0);
  return d.toISOString();
};

type Seed = {
  ref: number;
  template: string;
  format: Format;
  size: Size;
  pages: number;
  copies: number;
  frames: boolean;
  designer: boolean;
  status: OrderStatus;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  notes?: string;
  days: number;
};

const SEEDS: Seed[] = [
  { ref: 118, template: "Birthday 1", format: "Hard copy", size: "Tabloid", pages: 4, copies: 3, frames: false, designer: false, status: "ordered", name: "Rana Khoury", phone: "+961 71 220 114", email: "rana.khoury@example.com", address: "Achrafieh, Rue Huvelin, building 12, 3rd floor, Beirut", notes: "Her birthday is on the 14th, so anything before that works.", days: 0 },
  { ref: 117, template: "Wedding 1", format: "Hard copy", size: "Broadsheet", pages: 8, copies: 60, frames: false, designer: true, status: "ordered", name: "Karim Abou Jaoude", phone: "+961 3 447 902", email: "karim.aj@example.com", address: "Jounieh, Sarba highway, Centre Plaza, 5th floor", notes: "One copy per table at the reception.", days: 1 },
  { ref: 116, template: "Retirement", format: "Hard copy", size: "Tabloid", pages: 4, copies: 12, frames: true, designer: false, status: "created", name: "Maya Saliba", phone: "+961 76 331 508", email: "maya.saliba@example.com", address: "Hamra, Jeanne d'Arc street, building Noor, Beirut", days: 2 },
  { ref: 115, template: "Corporate", format: "Digital copy", size: "Tabloid", pages: 4, copies: 1, frames: false, designer: true, status: "created", name: "Nadine Fares", phone: "+961 70 118 662", email: "n.fares@example.com", address: "Digital delivery, no address needed", notes: "Needs our logo in the masthead.", days: 3 },
  { ref: 114, template: "Baby Shower", format: "Hard copy", size: "Tabloid", pages: 4, copies: 25, frames: false, designer: false, status: "printing", name: "Joelle Haddad", phone: "+961 71 905 233", email: null, address: "Baabda, Brazilia street, villa 7", days: 4 },
  { ref: 113, template: "Sports Tribute", format: "Hard copy", size: "Broadsheet", pages: 4, copies: 2, frames: true, designer: false, status: "printing", name: "Elie Mansour", phone: "+961 3 662 741", email: "elie.mansour@example.com", address: "Zalka, main road, Sayegh centre, 2nd floor", notes: "Both copies framed, one for the club.", days: 5 },
  { ref: 112, template: "Mother's/Father's Day", format: "Hard copy", size: "Tabloid", pages: 4, copies: 4, frames: true, designer: false, status: "delivering", name: "Tala Rizk", phone: "+961 76 442 019", email: "tala.rizk@example.com", address: "Bhamdoun, old souk road, building Rizk", days: 6 },
  { ref: 111, template: "Anniversary", format: "Hard copy", size: "Tabloid", pages: 4, copies: 2, frames: true, designer: false, status: "delivered", name: "Georges Chahine", phone: "+961 71 556 480", email: "g.chahine@example.com", address: "Mar Mikhael, Armenia street, building 44, Beirut", days: 9 },
  { ref: 110, template: "Summer Camp", format: "Hard copy", size: "Tabloid", pages: 4, copies: 120, frames: false, designer: false, status: "delivered", name: "Camp Cedars (Lara)", phone: "+961 70 884 337", email: "info@example.com", address: "Bikfaya, Camp Cedars, main gate", notes: "Delivered to the camp office before the closing day.", days: 12 },
  { ref: 109, template: "Menu", format: "Hard copy", size: "Tabloid", pages: 4, copies: 40, frames: false, designer: true, status: "delivered", name: "Beit Warde restaurant", phone: "+961 1 445 209", email: "hello@example.com", address: "Gemmayze, Gouraud street, Beit Warde", days: 15 },
  { ref: 108, template: "Promotion", format: "Digital copy", size: "Tabloid", pages: 4, copies: 1, frames: false, designer: false, status: "cancelled", name: "Ziad Nammour", phone: "+961 3 209 774", email: null, address: "Digital delivery, no address needed", notes: "Customer changed their mind, cancelled the same day.", days: 18 },
];

export const DEMO_ORDERS: DemoOrder[] = SEEDS.map((s) => ({
  id: `demo-${s.ref}`,
  reference: `TT-${String(s.ref).padStart(6, "0")}`,
  template_name: s.template,
  format: s.format,
  size: s.size,
  pages: s.pages,
  copies: s.copies,
  frames: s.frames,
  designer: s.designer,
  price: calculatePrice(
    { format: s.format, size: s.size, pages: s.pages, copies: s.copies, frames: s.frames, designer: s.designer },
    DEFAULT_PRICING,
  ),
  currency: "USD",
  status: s.status,
  payment_method: "cod",
  customer_name: s.name,
  customer_phone: s.phone,
  customer_email: s.email,
  delivery_address: s.address,
  notes: s.notes ?? null,
  created_at: daysAgo(s.days),
  updated_at: daysAgo(Math.max(0, s.days - 1), 16),
}));

// A few answers per order, so the order page has something to show.
export const DEMO_ANSWERS: Record<string, { label: string; value: string }[]> = {
  "demo-118": [
    { label: "1. Edition", value: "Special edition" },
    { label: "2. Location", value: "Beirut" },
    { label: "3. Title", value: "LOCAL LEGEND TURNS 30" },
    { label: "4. Person", value: "Rana" },
    { label: "5. Color", value: "Dusty pink" },
    { label: "8. Text", value: "Rana has been making her friends laugh since school, and thirty has not slowed her down one bit." },
    { label: "Anything else we should pay attention to?", value: "Please keep the tone funny, she will read it out loud." },
  ],
  "demo-117": [
    { label: "1. Location", value: "Jounieh" },
    { label: "3. Title", value: "KARIM & LEA" },
    { label: "5. Name", value: "Karim and Lea" },
    { label: "13. Text", value: "Two families, one very long dinner, and a dance floor that never emptied." },
  ],
};

export const DEMO_PHOTO_COUNT: Record<string, number> = { "demo-118": 4, "demo-117": 6, "demo-114": 2 };

export type DemoMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  handled: boolean;
  created_at: string;
};

export const DEMO_MESSAGES: DemoMessage[] = [
  {
    id: "demo-m1",
    name: "Sarah Daou",
    email: "sarah.daou@example.com",
    subject: "Wedding paper for 150 guests",
    message:
      "Hello, we are getting married in June and would love a broadsheet for every table. Can you do 150 copies, and how long does printing take?",
    handled: false,
    created_at: daysAgo(0, 9),
  },
  {
    id: "demo-m2",
    name: "Hadi Mourad",
    email: "hadi.mourad@example.com",
    subject: "Custom design, from scratch",
    message: "We need something completely custom for a company anniversary. Could we speak to the designer first?",
    handled: false,
    created_at: daysAgo(1, 15),
  },
  {
    id: "demo-m3",
    name: "Lynn Aoun",
    email: "lynn.aoun@example.com",
    subject: "Delivery to Tripoli",
    message: "Do you deliver outside Beirut, and is delivery still free?",
    handled: true,
    created_at: daysAgo(4, 13),
  },
  {
    id: "demo-m4",
    name: "Omar Zein",
    email: "omar.zein@example.com",
    subject: "Frame sizes",
    message: "Is the frame the same size as the tabloid page, and can I hang it straight away?",
    handled: true,
    created_at: daysAgo(7, 10),
  },
];

export const DEMO_EVENTS: Record<string, { from_status: OrderStatus | null; to_status: OrderStatus; note: string | null; created_at: string }[]> = {
  "demo-116": [
    { from_status: "ordered", to_status: "created", note: "First draft sent to the customer for approval.", created_at: daysAgo(1, 14) },
    { from_status: null, to_status: "ordered", note: "Order placed on the website", created_at: daysAgo(2) },
  ],
  "demo-113": [
    { from_status: "created", to_status: "printing", note: "Approved, sent to print with the frames.", created_at: daysAgo(2, 10) },
    { from_status: "ordered", to_status: "created", note: null, created_at: daysAgo(4, 12) },
    { from_status: null, to_status: "ordered", note: "Order placed on the website", created_at: daysAgo(5) },
  ],
};

export const DEMO_ADMIN = { id: "demo-admin", email: "demo@tailored-times.com", role: "owner" as const };
