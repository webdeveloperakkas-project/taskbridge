/* Shared account menu for Profile, Settings and Support pages. */
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("topbarAvatar");
  const menu = document.getElementById("topbarProfileMenu");
  if (!toggle || !menu) return;

  const closeMenu = () => {
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const shouldOpen = menu.hidden;
    menu.hidden = !shouldOpen;
    toggle.setAttribute("aria-expanded", String(shouldOpen));
  });

  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".topbar-profile-dropdown")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      toggle.focus();
    }
  });

  const currentPage = window.location.pathname.split("/").pop() || "profile.html";
  menu.querySelectorAll("a").forEach((link) => {
    const targetPage = new URL(link.href, window.location.href).pathname.split("/").pop();
    if (targetPage === currentPage) link.setAttribute("aria-current", "page");
  });
});
