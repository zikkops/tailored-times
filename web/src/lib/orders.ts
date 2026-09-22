// Order statuses in workflow order (owner, 21 Sep 2026), plus admin-only cancelled.
export const ORDER_STATUSES = ["ordered", "created", "printing", "delivering", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
