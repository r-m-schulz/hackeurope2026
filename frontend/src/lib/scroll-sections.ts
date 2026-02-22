/**
 * Features scroll offset (in pixels).
 * - Positive = scroll further down (section starts higher, more hero off-screen).
 * - Negative = scroll less (section starts lower, green line / hero more visible).
 * Change this value to fine-tune where the page lands when clicking "Features".
 */
export const FEATURES_SCROLL_OFFSET = 120;

export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  // Run after layout so the position is stable (avoids jumps)
  requestAnimationFrame(() => {
    const top = el.getBoundingClientRect().top + window.scrollY;
    const offset = id === "features" ? FEATURES_SCROLL_OFFSET : 0;
    window.scrollTo({ top: top + offset, behavior: "smooth" });
  });
}
