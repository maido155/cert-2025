// Bloqueo de scroll del body con contador compartido: soporta varias capas
// (overlay + modal) abiertas a la vez sin que un re-render corrompa el valor
// original que se restaura al cerrar la última.

let count = 0;
let saved = "";

export function lockScroll() {
  if (typeof document === "undefined") return;
  if (count === 0) {
    saved = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  count += 1;
}

export function unlockScroll() {
  if (typeof document === "undefined") return;
  count = Math.max(0, count - 1);
  if (count === 0) {
    document.body.style.overflow = saved;
  }
}
