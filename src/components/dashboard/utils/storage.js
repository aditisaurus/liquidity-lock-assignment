import { STORAGE_NS } from "./constants";

export const getKey = (user) => `${STORAGE_NS}:${user?.uid || "anon"}`;

export const safeParse = (raw) => {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
};
