import raw from "./fees.json";
import type { FeeItem } from "./types";

export function seedFees(): FeeItem[] {
  return raw.map((item) => ({
    id: item.code,
    code: item.code,
    chapter: item.chapter,
    name: item.name,
    minimum: item.minimum,
    price: item.minimum,
  }));
}
