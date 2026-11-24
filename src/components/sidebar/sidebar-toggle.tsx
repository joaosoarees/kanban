"use client";

import { PanelLeft } from "lucide-react";
import { ICON_BUTTON } from "@/components/sidebar/sidebar-links";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function ShortcutHint() {
  return (
    <kbd className="rounded-sm border border-background/35 px-1 font-mono text-[11px]">
      [
    </kbd>
  );
}

function focusButton(button: HTMLButtonElement | null) {
  button?.focus();
}

export function ToggleButton({
  collapsed,
  onToggle,
  takeFocus,
}: {
  collapsed: boolean;
  onToggle: () => void;
  takeFocus: boolean;
}) {
  const label = collapsed ? "Abrir barra lateral" : "Recolher barra lateral";
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            aria-expanded={!collapsed}
            aria-keyshortcuts="["
            ref={takeFocus ? focusButton : undefined}
            onClick={onToggle}
            className={ICON_BUTTON}
          />
        }
      >
        <PanelLeft aria-hidden />
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
        <ShortcutHint />
      </TooltipContent>
    </Tooltip>
  );
}
