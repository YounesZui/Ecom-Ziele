const SALES_GOALS_CONFIG = {
  year: 2026,
  totalGoal: 1850000,
  channels: [
    { key: "zuitable",      label: "Zuitable.com",  goal: 700000, source: "shop" },
    { key: "zalando_zfs",   label: "Zalando ZFS",   goal: 700000, source: "manual" },
    { key: "zalando_cr",    label: "Zalando CR/Zss",goal: 70000,  source: "manual" },
    { key: "otto",          label: "Otto",          goal: 100000, source: "otto" },
    { key: "vangraaf",      label: "Van Graaf",     goal: 100000, source: "manual" },
    { key: "amazon",        label: "Amazon",        goal: null,   source: "manual" },
    { key: "breuninger",    label: "Breuninger",    goal: 80000,  source: "manual" },
    { key: "manor",         label: "Manor",         goal: null,   source: "manual" },
    { key: "galaxus",       label: "Galaxus",       goal: null,   source: "manual" },
    { key: "secret_sales",  label: "Secret Sales",  goal: null,   source: "manual" },
    { key: "aboutyou",      label: "About You",     goal: 100000, source: "manual" }
  ],
  bonusSteps: [
    { threshold: 0,    label: "< 70%",   bonus: 0 },
    { threshold: 70,   label: "> 70%",   bonus: 3000 },
    { threshold: 80,   label: "> 80%",   bonus: 5000 },
    { threshold: 90,   label: "> 90%",   bonus: 6500 },
    { threshold: 100,  label: "> 100%",  bonus: 7600 },
    { threshold: 110,  label: "> 110%",  bonus: 8800 },
    { threshold: 120,  label: "> 120%",  bonus: 10000 }
  ],
  webshopExtraBonus: {
    threshold: 800000,
    bonus: 2000
  }
};

const SALES_GOALS_DATA = {
  "2026-01": {
    zuitable: 24953.45,
    zalando_zfs: 73502.94,
    zalando_cr: 0,
    otto: 0,
    vangraaf: 4348,
    amazon: 0,
    breuninger: 3800,
    manor: 0,
    galaxus: 0,
    secret_sales: 0,
    aboutyou: 0
  },
  "2026-02": {
    zuitable: 23620.19,
    zalando_zfs: 61407.26,
    zalando_cr: 0,
    otto: 0,
    vangraaf: 3090,
    amazon: 0,
    breuninger: 7136,
    manor: 0,
    galaxus: 0,
    secret_sales: 0,
    aboutyou: 0
  },
  "2026-03": {
    zuitable: 0,
    zalando_zfs: 8603653,
    zalando_cr: 0,
    otto: 3152.86,
    vangraaf: 4110,
    amazon: 0,
    breuninger: 6926,
    manor: 0,
    galaxus: 0,
    secret_sales: 0,
    aboutyou: 0
  },
  "2026-04": {
    zuitable: 0,
    zalando_zfs: 0,
    zalando_cr: 0,
    otto: 579.20,
    vangraaf: 0,
    amazon: 0,
    breuninger: 0,
    manor: 0,
    galaxus: 0,
    secret_sales: 0,
    aboutyou: 0
  },
  "2026-05": {
    zuitable: 0,
    zalando_zfs: 0,
    zalando_cr: 0,
    otto: 0,
    vangraaf: 0,
    amazon: 0,
    breuninger: 0,
    manor: 0,
    galaxus: 0,
    secret_sales: 0,
    aboutyou: 0
  },
  "2026-06": {
    zuitable: 0,
    zalando_zfs: 0,
    zalando_cr: 0,
    otto: 0,
    vangraaf: 0,
    amazon: 0,
    breuninger: 0,
    manor: 0,
    galaxus: 0,
    secret_sales: 0,
    aboutyou: 0
  },
  "2026-07": {
    zuitable: 0,
    zalando_zfs: 0,
    zalando_cr: 0,
    otto: 0,
    vangraaf: 0,
    amazon: 0,
    breuninger: 0,
    manor: 0,
    galaxus: 0,
    secret_sales: 0,
    aboutyou: 0
  },
  "2026-08": {
    zuitable: 0,
    zalando_zfs: 0,
    zalando_cr: 0,
    otto: 0,
    vangraaf: 0,
    amazon: 0,
    breuninger: 0,
    manor: 0,
    galaxus: 0,
    secret_sales: 0,
    aboutyou: 0
  },
  "2026-09": {
    zuitable: 0,
    zalando_zfs: 0,
    zalando_cr: 0,
    otto: 0,
    vangraaf: 0,
    amazon: 0,
    breuninger: 0,
    manor: 0,
    galaxus: 0,
    secret_sales: 0,
    aboutyou: 0
  },
  "2026-10": {
    zuitable: 0,
    zalando_zfs: 0,
    zalando_cr: 0,
    otto: 0,
    vangraaf: 0,
    amazon: 0,
    breuninger: 0,
    manor: 0,
    galaxus: 0,
    secret_sales: 0,
    aboutyou: 0
  },
  "2026-11": {
    zuitable: 0,
    zalando_zfs: 0,
    zalando_cr: 0,
    otto: 0,
    vangraaf: 0,
    amazon: 0,
    breuninger: 0,
    manor: 0,
    galaxus: 0,
    secret_sales: 0,
    aboutyou: 0
  },
  "2026-12": {
    zuitable: 0,
    zalando_zfs: 0,
    zalando_cr: 0,
    otto: 0,
    vangraaf: 0,
    amazon: 0,
    breuninger: 0,
    manor: 0,
    galaxus: 0,
    secret_sales: 0,
    aboutyou: 0
  }
};
