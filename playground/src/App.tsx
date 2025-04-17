import { CodeInput } from "@/components/code-input";
import { OutputDisplay } from "@/components/output-display";
import { Header } from "@/components/ui/header";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { RESIZABLE_STORAGE_KEY } from "@/lib/constants";
import { type GraplixSchema, parse } from "graplix";
import { useEffect, useRef, useState } from "react";
import type { ImperativePanelGroupHandle } from "react-resizable-panels";
import { ClipboardCopy, ClipboardCopyIcon } from "./components/clipboard-copy";
import { MermaidVisualizer } from "./components/mermaid-visualizer";
import { Button } from "./components/ui/button";

const INITIAL_LAYOUT = [70, 30];

export function App() {
  const resizablePanelGroupRef = useRef<ImperativePanelGroupHandle>(
    null as never,
  );
  const [code, setCode] = useState(`model
  schema 1.1

  type user

  type team
    relations
      define member: [user]
      define suporg: [org]

  type org
    relations
      define subteam: [team]
      define member: member from team
      define self: [org]
    `);
  const [schema, setSchema] = useState<GraplixSchema<any>>(() => parse(code));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setSchema(parse(code));
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
    }
  }, [code]);

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
            <ResizablePanel
              minSize={20}
              collapsedSize={1}
              collapsible
              defaultSize={70}
              header={
                <div className="flex items-center justify-between pr-2 pl-4 h-12">
                  <h3 className="text-sm font-medium">Input</h3>
                  <ClipboardCopy data={code} asChild>
                    <Button variant="ghost" size="icon">
                      <ClipboardCopyIcon className="size-4" />
                    </Button>
                  </ClipboardCopy>
                </div>
              }
            >
              <CodeInput value={code} onChange={setCode} />
            </ResizablePanel>

            <ResizableHandle onDoubleClickCapture={resetLayout} />
            <ResizablePanel
              minSize={20}
              collapsedSize={1}
              collapsible
              defaultSize={40}
            >
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel
                  defaultSize={60}
                  header={
                    <div className="flex items-center justify-between pr-2 pl-4 h-12">
                      <h3 className="text-sm font-medium">Output</h3>
                      <ClipboardCopy
                        data={JSON.stringify(schema, null, 2)}
                        asChild
                      >
                        <Button variant="ghost" size="icon">
                          <ClipboardCopyIcon className="size-4" />
                        </Button>
                      </ClipboardCopy>
                    </div>
                  }
                >
                  <OutputDisplay schema={schema} error={error} />
                </ResizablePanel>

                <ResizableHandle />

                <ResizablePanel
                  defaultSize={30}
                  header={
                    <div className="flex items-center justify-between pr-2 pl-4 h-12">
                      <h3 className="text-sm font-medium">Visualizer</h3>
                    </div>
                  }
                >
                  <MermaidVisualizer schema={schema} />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>
    </div>
  );
}
