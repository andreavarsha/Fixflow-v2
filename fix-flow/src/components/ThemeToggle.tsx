import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DesktopIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { useLanguage } from "../lib/LanguageContext";

/** Light / dark / system switch. Persisted by next-themes (localStorage) via
 * the ThemeProvider mounted in main.tsx. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <ToggleGroup
      type="single"
      size="sm"
      variant="outline"
      value={theme}
      onValueChange={(value) => {
        if (value) setTheme(value);
      }}
      aria-label="Theme"
    >
      <ToggleGroupItem value="light" aria-label="Light theme" title={t("themeLight")}>
        <SunIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Dark theme" title={t("themeDark")}>
        <MoonIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="system" aria-label="Match system theme" title={t("themeSystem")}>
        <DesktopIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
