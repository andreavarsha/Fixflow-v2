/** Shared layout & controls — mobile-first; scales up to wide desktops. */

/** Fluid content width: full width on phones, progressively wider caps on tablet/desktop */
export const ffPage =
  "min-h-dvh w-full max-w-full mx-auto bg-gray-50 text-gray-900 antialiased " +
  "px-4 pt-5 pb-[max(6rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-8 " +
  "md:max-w-3xl md:mx-auto lg:max-w-5xl xl:max-w-6xl 2xl:max-w-[88rem] " +
  "xl:px-10 2xl:px-12";

export const ffScreenTitle =
  "text-xl font-bold tracking-tight text-gray-900 sm:text-2xl xl:text-3xl";

export const ffScreenSubtitle =
  "mt-1 text-sm text-gray-500 leading-relaxed md:text-base max-w-2xl";

export const ffCard =
  "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8";

export const ffBtnPrimary =
  "inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-base font-semibold text-white shadow-sm transition active:bg-gray-800 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40";

export const ffBtnSecondary =
  "inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-semibold text-gray-900 shadow-sm transition active:bg-gray-50 disabled:pointer-events-none disabled:opacity-40";

export const ffBtnGhost =
  "inline-flex min-h-[44px] w-full items-center justify-center rounded-xl px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 xl:w-auto xl:self-start";

/** Combine with ffBtnPrimary / ffBtnSecondary inside responsive rows */
export const ffBtnInRow =
  "lg:flex-1 xl:flex-none xl:min-w-[13rem] xl:max-w-sm";

export const ffInput =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/15";

export const ffLabel = "mb-1.5 block text-sm font-medium text-gray-700";
