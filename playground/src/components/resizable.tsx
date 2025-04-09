import * as ResizablePrimitive from "react-resizable-panels";

const ResizablePanelGroup = (
  props: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>,
) => (
  <ResizablePrimitive.PanelGroup
    className="flex h-full w-full data-[panel-group-direction=vertical]:flex-col"
    {...props}
  />
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = (
  props: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle>,
) => (
  <ResizablePrimitive.PanelResizeHandle
    className="relative flex w-px items-center justify-center bg-neutral-800 data-[resize-handle-state=hover]:bg-neutral-700 data-[resize-handle-state=drag]:bg-neutral-600 after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90"
    {...props}
  />
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
