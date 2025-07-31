import { Card } from "./objects/Card";

export function getCardValue(card: Card): number {
  return card.value;
}

export function getAllCombinations<T>(arr: T[]): T[][] {
  const results: T[][] = [];
  const total = 1 << arr.length;

  for (let i = 1; i < total; i++) {
    const combo: T[] = [];
    for (let j = 0; j < arr.length; j++) {
      if (i & (1 << j)) combo.push(arr[j]);
    }
    results.push(combo);
  }

  return results;
}
