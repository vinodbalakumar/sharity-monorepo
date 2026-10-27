import { appState$ } from './appState';

let owner: string | null = null;
let generation = 0;
let sequence = 0;
export function setCartOwner(next: string | null) {
  if (owner === next) return;
  owner = next;
  generation++;
  appState$.cart.count.set(null);
}
export function resetCartBadge() {
  owner = null;
  generation++;
  appState$.cart.count.set(null);
}
export const hasCartOwner = () => owner !== null;
export const beginCartRead = () => ({ generation, sequence: ++sequence });
export function publishCartCount(ticket: ReturnType<typeof beginCartRead>, count: number | null) {
  if (owner && ticket.generation === generation && ticket.sequence === sequence) appState$.cart.count.set(count);
}
