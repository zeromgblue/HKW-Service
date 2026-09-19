import { randomInt } from "node:crypto";

// Unambiguous alphabet (no 0/O, 1/I/L) so IDs are easy to read aloud/copy.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

// Random, non-sequential ticket ID so it can't be guessed or used to infer
// how many tickets exist (spec section 8).
export function generateTicketId(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `RP-${code}`;
}
