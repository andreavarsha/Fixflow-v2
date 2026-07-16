/** Shared layout & controls — mobile-first; scales up to wide desktops. */
/** Theme-aware: every color here reads CSS vars from index.css (light + dark), so
 * consumers automatically follow the active theme — no hardcoded gray/white. */

/** Fluid content width: full width on phones, progressively wider caps on tablet/desktop */
export const ffPage =
  "min-h-dvh w-full max-w-full mx-auto bg-background text-foreground antialiased " +
  "px-4 pt-5 pb-6 sm:px-6 sm:pt-8 " +
  "md:max-w-3xl md:mx-auto lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[88rem] " +
  "xl:px-10 2xl:px-12";

export const ffScreenTitle =
  "text-xl font-bold tracking-tight text-foreground sm:text-2xl xl:text-3xl";

export const ffScreenSubtitle =
  "mt-1 text-sm text-muted-foreground leading-relaxed md:text-base max-w-2xl";

export const ffCard =
  "rounded-2xl border border-border bg-card text-card-foreground p-4 shadow-sm sm:p-6 lg:p-8";

export const ffBtnPrimary =
  "inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:brightness-105 active:brightness-90 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40";

export const ffBtnSecondary =
  "inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-base font-semibold text-foreground shadow-sm transition hover:bg-accent active:bg-accent disabled:pointer-events-none disabled:opacity-40";

export const ffBtnGhost =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-xl px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground xl:w-auto xl:self-start";

/** Combine with ffBtnPrimary / ffBtnSecondary inside responsive rows */
export const ffBtnInRow =
  "lg:flex-1 xl:flex-none xl:min-w-[13rem] xl:max-w-sm";

export const ffInput =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export const ffLabel = "mb-1.5 block text-sm font-medium text-foreground/80";
