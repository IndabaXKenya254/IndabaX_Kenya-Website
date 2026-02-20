// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - MAIN NAVIGATION MENU
// ═══════════════════════════════════════════════════════════════════════
// Updated: 2026-01-21 - Simplified menu structure per client request
// Menu: Home, About (dropdown), NOAI, News, Donate, Contact Us

export const menus = [
  {
    label: "Home",
    link: "/",
  },
  {
    label: "About",
    link: "#",
    submenu: [
      {
        label: "Previous Editions",
        link: "/history",
      },
      {
        label: "Speakers",
        link: "/speakers",
      },
      {
        label: "Organizers",
        link: "/team",
      },
      {
        label: "Sponsors",
        link: "/sponsors",
      },
    ],
  },
  {
    label: "NOAI",
    link: "/noai",
  },
  {
    label: "News",
    link: "/news",
  },
  {
    label: "Donate",
    link: "/donate",
  },
  {
    label: "Contact Us",
    link: "/contact",
  },
];
