// Apply theme ASAP (before React mounts) and keep it in sync across tabs/system changes.
const LS_KEY = "pp:theme"; // "light" | "dark" | "system"
const mql = window.matchMedia?.("(prefers-color-scheme: dark)");

function currentMode() {
  return localStorage.getItem(LS_KEY) || "system";
}
function resolve(mode) {
  if (mode === "system") return mql && mql.matches ? "dark" : "light";
  return mode;
}
function apply(mode = currentMode()) {
  const next = resolve(mode);
  document.documentElement.setAttribute("data-bs-theme", next);
}

// Initial apply
apply();

// Update if system changes (only when mode === "system")
if (mql?.addEventListener) {
  mql.addEventListener("change", () => {
    if (currentMode() === "system") apply();
  });
}

// Sync across tabs
window.addEventListener("storage", (e) => {
  if (e.key === LS_KEY) apply(e.newValue || "system");
});
