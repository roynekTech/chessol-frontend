import {
  uniqueNamesGenerator,
  adjectives,
  animals,
} from "unique-names-generator";

export function getRandomUsername(): string {
  return (
    uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      separator: "",
      style: "capital",
      length: 2,
    }) + Math.floor(Math.random() * 10000)
  );
}

export const baseHelper = {
  getRandomUsername,
};
