import { useCallback, useEffect, useRef } from "react";
import type { ImperativePanelGroupHandle } from "react-resizable-panels";

type Direction = "horizontal" | "vertical";

type Layout = number[];

interface PanelNode {
  id: string;
  ref: React.RefObject<ImperativePanelGroupHandle>;
  direction: Direction;
  defaultSizes: Layout;
}

interface UseResizablePanelsOptions {
  storageKey: string;
  storage?: Storage;
}

export function useResizablePanels({
  storageKey,
  storage = localStorage,
}: UseResizablePanelsOptions) {
  const panelsRef = useRef<Map<string, PanelNode>>(new Map());

  const getStorageKey = useCallback(
    (id: string) => `${storageKey}:${id}`,
    [storageKey],
  );

  const saveLayout = useCallback(
    ({ id, layout }: { id: string; layout: Layout }) => {
      const key = getStorageKey(id);
      try {
        storage?.setItem(key, JSON.stringify(layout));
      } catch (error) {
        console.error("Failed to save layout:", error);
      }
    },
    [getStorageKey, storage],
  );

  const createPanelGroup = useCallback(
    ({
      id,
      direction = "horizontal",
      defaultSizes = [50, 50],
    }: { id: string; direction?: Direction; defaultSizes?: Layout }) => {
      const ref = useRef<ImperativePanelGroupHandle>(
        null,
      ) as React.RefObject<ImperativePanelGroupHandle>;

      const panel: PanelNode = {
        id,
        ref,
        direction,
        defaultSizes,
      };

      panelsRef.current.set(id, panel);

      return {
        ref,
        direction,
        autoSaveId: `${storageKey}:${id}`,
        onLayout: (sizes: number[]) => {
          saveLayout({ id, layout: sizes });
        },
      };
    },
    [saveLayout, storageKey],
  );

  const resetLayout = useCallback(
    ({ id }: { id?: string }) => {
      if (id) {
        const panel = panelsRef.current.get(id);
        if (panel) {
          panel.ref.current?.setLayout(panel.defaultSizes);
          saveLayout({ id, layout: panel.defaultSizes });
        }
      } else {
        for (const panel of panelsRef.current.values()) {
          panel.ref.current?.setLayout(panel.defaultSizes);
          saveLayout({ id: panel.id, layout: panel.defaultSizes });
        }
      }
    },
    [saveLayout],
  );

  useEffect(() => {
    const onStorageChange = (e: StorageEvent) => {
      if (!e.key?.startsWith(storageKey) || !e.newValue) return;

      const id = e.key.slice(storageKey.length + 1);
      const panel = panelsRef.current.get(id);
      if (!panel) return;

      try {
        const layout = JSON.parse(e.newValue);
        panel.ref.current?.setLayout(layout);
      } catch (error) {
        console.error("Failed to parse layout:", error);
      }
    };

    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, [storageKey]);

  return {
    createPanelGroup,
    resetLayout,
  };
}
