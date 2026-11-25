import { queryOptions } from "@tanstack/react-query";
import { getSiteData } from "./site.functions";

export const siteQuery = queryOptions({ queryKey: ["site"], queryFn: () => getSiteData() });

export const THEMES = [
  { id: "pink", label: "Pink" },
  { id: "rose", label: "Merah Muda" },
  { id: "red", label: "Merah" },
  { id: "black", label: "Hitam" },
  { id: "purple", label: "Ungu" },
  { id: "gold", label: "Emas" },
] as const;
