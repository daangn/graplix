import { CodeInput } from "@/components/code-input";
import { OutputDisplay } from "@/components/output-display";
import { Header } from "@/components/ui/header";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { RESIZABLE_STORAGE_KEY } from "@/lib/constants";
import { useRef, useState } from "react";
import type { ImperativePanelGroupHandle } from "react-resizable-panels";

const INITIAL_LAYOUT = [50, 50];

export function App() {
  const resizablePanelGroupRef = useRef<ImperativePanelGroupHandle>(
    null as never,
  );
  const [code, setCode] = useState(`model
  schema 1.1

  type user

  type team
  relations
  define member: [user]`);

  const resetLayout = () => {
    resizablePanelGroupRef.current?.setLayout(INITIAL_LAYOUT);
  };

  return (
    <div className="fixed inset-0">
      <Header />
      <div className="flex flex-col h-[calc(100vh_-_3.5rem)]">
        <main className="h-full w-full">
          <ResizablePanelGroup
            direction="horizontal"
            ref={resizablePanelGroupRef}
            autoSaveId={RESIZABLE_STORAGE_KEY}
            storage={localStorage}
          >
            <ResizablePanel title="Input">
              <CodeInput value={code} onChange={setCode} />
            </ResizablePanel>
            <ResizableHandle onDoubleClickCapture={resetLayout} />
            <ResizablePanel title="Output">
              <OutputDisplay code={code} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>
    </div>
  );
}
