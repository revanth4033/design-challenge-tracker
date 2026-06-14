"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useMounted } from "@/lib/use-mounted";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Light/dark toggle. `variant="full"` shows a labelled button (sidebar);
 *  `variant="icon"` shows just the icon (mobile top bar). */
export function ThemeToggle({
  variant = "full",
  className,
}: {
  variant?: "full" | "icon";
  className?: string;
}) {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  const Icon = isDark ? Sun : Moon;

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggle}
        aria-label="Toggle theme"
        className={cn("p-2 text-muted-foreground", className)}
      >
        <Icon className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className={cn("w-full justify-start gap-3 text-muted-foreground", className)}
    >
      <Icon className="size-4" />
      {mounted ? (isDark ? "Light mode" : "Dark mode") : "Theme"}
    </Button>
  );
}
