const article = document.querySelector<HTMLElement>(".prose");
const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-toc-link]")];

if (article && links.length) {
  const headings = [...article.querySelectorAll<HTMLElement>("h2[id], h3[id]")];
  const ids = new Set(headings.map(heading => heading.id));
  let frame = 0;
  let current = "";
  // Keep a clamped, explicitly chosen anchor selected until the reader moves.
  // This prevents a short final section's bottom rule overriding native links.
  let chosen: { id: string; y: number } | undefined;

  function highlight(id: string) {
    if (id === current) return;
    current = id;
    for (const link of links) {
      const active = link.hash === `#${encodeURIComponent(id)}` || link.hash === `#${id}`;
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  }

  function update() {
    frame = 0;
    if (!headings.length) return;
    if (chosen && Math.abs(window.scrollY - chosen.y) > 1) chosen = undefined;
    if (chosen) {
      highlight(chosen.id);
      return;
    }
    const line = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) * 2;
    let active = headings[0]!;
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top > line + 1) break;
      active = heading;
    }
    const bottom = window.scrollY > 0 &&
      window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    highlight(bottom ? headings[headings.length - 1]!.id : active.id);
  }

  function schedule() {
    if (!frame) frame = window.requestAnimationFrame(update);
  }

  function followHash() {
    // Native fragment navigation runs first; never take over scrolling or focus.
    window.requestAnimationFrame(() => {
      let id: string;
      try { id = decodeURIComponent(window.location.hash.slice(1)); }
      catch { id = ""; }
      chosen = ids.has(id) ? { id, y: window.scrollY } : undefined;
      schedule();
    });
  }

  window.addEventListener("scroll", schedule, { passive: true });
  const resumeReading = () => { chosen = undefined; schedule(); };
  window.addEventListener("wheel", resumeReading, { passive: true });
  window.addEventListener("touchmove", resumeReading, { passive: true });
  window.addEventListener("keydown", event => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) resumeReading();
  });
  window.addEventListener("hashchange", followHash);
  window.addEventListener("resize", () => { chosen = undefined; schedule(); });
  window.addEventListener("load", followHash, { once: true });
  document.addEventListener("toggle", schedule, true);
  // Repeated activation of the same hash does not emit hashchange.
  for (const link of links) link.addEventListener("click", followHash);
  void document.fonts.ready.then(schedule);
  followHash();
}
