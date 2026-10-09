"use client";

import { createContext, useContext, useState } from "react";

// Shared between the order form and the page previews beside it. While the
// customer is on step 2 ("Your story"), `page` is the numbered page to show
// (0-based) and the previews swap to the numbered pages; otherwise it is null
// and the normal previews show.
type NumberedPreview = { page: number | null; setPage: (page: number | null) => void };

const Ctx = createContext<NumberedPreview>({ page: null, setPage: () => {} });

export function NumberedPreviewProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<number | null>(null);
  return <Ctx.Provider value={{ page, setPage }}>{children}</Ctx.Provider>;
}

export const useNumberedPreview = () => useContext(Ctx);
