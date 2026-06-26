import { useEffect, useState } from "react";

const PANEL_TRANSITION_MS = 350;

export function useFilterPanelAnimation(open) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = window.requestAnimationFrame(() => {
        setVisible(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    setVisible(false);
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!visible && mounted) {
      const timer = window.setTimeout(() => setMounted(false), PANEL_TRANSITION_MS + 40);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [visible, mounted]);

  const handleTransitionEnd = (event, propertyName = "width") => {
    if (event.propertyName !== propertyName || visible) {
      return;
    }
    setMounted(false);
  };

  return {
    mounted,
    visible,
    handleTransitionEnd,
  };
}
