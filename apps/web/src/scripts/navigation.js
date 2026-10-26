// Runs directly after the header markup; animation loading never gates controls.
(() => {
  const header = document.querySelector("[data-site-navigation]");
  const toggle = document.getElementById("open-navigation");
  const panel = document.getElementById("mobile-navigation");
  const close = document.getElementById("close-navigation");
  if (!header || !(toggle instanceof HTMLButtonElement) ||
      !(panel instanceof HTMLDialogElement) || !(close instanceof HTMLButtonElement)) return;

  const mobile = window.matchMedia("(max-width: 850px)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let epoch = 0;
  let timer = 0;

  function resetMotion() {
    epoch++;
    window.clearTimeout(timer);
    panel.dispatchEvent(new Event("berry:menu-reset"));
  }

  function closeMenu(immediate = false) {
    if (!panel.open) return;
    if (immediate || reduced.matches) {
      resetMotion();
      panel.close();
      return;
    }
    if (panel.dataset.state === "closing") return;
    panel.dataset.state = "closing";
    const ownEpoch = ++epoch;
    const complete = () => {
      if (epoch !== ownEpoch || !panel.open) return;
      window.clearTimeout(timer);
      panel.close();
    };
    // A loaded motion adapter may finish the exit before the native close.
    const request = new CustomEvent("berry:menu-close", { cancelable: true, detail: { complete } });
    if (panel.dispatchEvent(request)) complete();
    else timer = window.setTimeout(complete, 240);
  }

  toggle.addEventListener("click", () => {
    if (!mobile.matches || panel.open) return;
    resetMotion();
    panel.style.setProperty("--menu-scrollbar-space", `${Math.max(0, window.innerWidth - header.getBoundingClientRect().width)}px`);
    panel.dataset.state = "open";
    panel.showModal();
    toggle.setAttribute("aria-expanded", "true");
    document.documentElement.classList.add("navigation-open");
    panel.dispatchEvent(new Event("berry:menu-open"));
  });
  close.addEventListener("click", () => closeMenu());
  panel.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeMenu();
  });
  panel.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || event.ctrlKey || event.altKey || event.metaKey) return;
    const items = panel.querySelectorAll("a[href], button:not([disabled])");
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
  panel.addEventListener("close", () => {
    resetMotion();
    delete panel.dataset.state;
    toggle.setAttribute("aria-expanded", "false");
    document.documentElement.classList.remove("navigation-open");
    if (mobile.matches) toggle.focus();
  });
  panel.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a[href]")) closeMenu(true);
  });
  mobile.addEventListener("change", () => {
    if (!mobile.matches && panel.open) {
      closeMenu(true);
      header.querySelector(".desktop-nav a[aria-current]")?.focus();
    }
  });
  reduced.addEventListener("change", () => {
    if (reduced.matches && panel.dataset.state === "closing") closeMenu(true);
    else if (reduced.matches) resetMotion();
  });
})();
