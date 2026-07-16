import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DesktopIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";

/** Light / dark / system switch. Persisted by next-themes (localStorage) via
 * the ThemeProvider mounted in main.tsx. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
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
      <ToggleGroupItem value="light" aria-label="Light theme">
        <SunIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Dark theme">
        <MoonIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="system" aria-label="Match system theme">
        <DesktopIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
