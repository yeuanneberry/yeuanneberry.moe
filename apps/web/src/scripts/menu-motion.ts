import { animate } from "motion/mini";

const panel = document.getElementById("mobile-navigation");
if (panel instanceof HTMLDialogElement) {
  const links = [...panel.querySelectorAll<HTMLAnchorElement>(".mobile-nav a")];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let animations: ReturnType<typeof animate>[] = [];
  let generation = 0;

  function reset(preserve = false) {
    generation++;
    const current = preserve ? links.map(link => ({ opacity: getComputedStyle(link).opacity, transform: getComputedStyle(link).transform })) : [];
    for (const animation of animations) animation.cancel();
    animations = [];
    for (const [index, link] of links.entries()) {
      if (preserve) Object.assign(link.style, current[index]);
      else {
        link.style.removeProperty("opacity");
        link.style.removeProperty("transform");
      }
    }
  }

  panel.addEventListener("berry:menu-reset", () => reset());
  panel.addEventListener("berry:menu-open", () => {
    reset();
    if (reduced.matches) return;
    animations = links.map((link, index) => animate(link, {
      opacity: [0, 1], transform: ["translateY(8px)", "translateY(0px)"],
    }, { duration: .22, delay: Math.min(index * .03, .12), ease: [.16, 1, .3, 1] }));
  });
  panel.addEventListener("berry:menu-close", (event) => {
    if (!(event instanceof CustomEvent) || reduced.matches) return;
    reset(true);
    const ownGeneration = generation;
    event.preventDefault();
    animations = links.map(link => animate(link, {
      opacity: 0, transform: "translateY(-4px)",
    }, { duration: .16, ease: [.4, 0, 1, 1] }));
    void Promise.all(animations.map(animation => animation.finished)).then(() => {
      if (generation === ownGeneration) event.detail.complete();
    }, () => { /* A reset cancels the pending transition. */ });
  });
}
