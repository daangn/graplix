import { ClipboardCopy, ClipboardCopyIcon } from "@/components/clipboard-copy";
import { CodeInput } from "@/components/code-input";
import { useResizablePanels } from "@/components/hooks";
import { MermaidVisualizer } from "@/components/mermaid-visualizer";
import { OutputDisplay } from "@/components/output-display";
import {
  Button,
  Header,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ResizablePanelHeader,
} from "@/components/ui";
import { RESIZABLE_STORAGE_KEY } from "@/lib/constants";
import { type GraplixSchema, parse } from "graplix";
import { useEffect, useState } from "react";

export function App() {
  const { createPanelGroup, resetLayout } = useResizablePanels({
    storageKey: RESIZABLE_STORAGE_KEY,
  });

  const rootPanel = createPanelGroup({
    id: "root",
    defaultSizes: [70, 30],
  });
  const verticalPanel = createPanelGroup({
    id: "vertical",
    direction: "vertical",
    defaultSizes: [60, 40],
  });

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

  return (
    <div className="fixed inset-0">
      <Header />
      <div className="flex flex-col h-[calc(100vh_-_3.5rem)]">
        <main className="h-full w-full">
          <ResizablePanelGroup {...rootPanel}>
            <ResizablePanel minSize={20} collapsedSize={1} collapsible>
              <ResizablePanelHeader
                title="Input"
                suffix={
                  <ClipboardCopy data={code} asChild>
                    <Button variant="ghost" size="icon">
                      <ClipboardCopyIcon className="size-4" />
                    </Button>
                  </ClipboardCopy>
                }
              />
              <CodeInput value={code} onChange={setCode} />
            </ResizablePanel>

            <ResizableHandle
              onDoubleClickCapture={() => resetLayout({ id: "root" })}
            />

            <ResizablePanel minSize={20} collapsedSize={1} collapsible>
              <ResizablePanelGroup {...verticalPanel}>
                <ResizablePanel>
                  <ResizablePanelHeader
                    title="Output"
                    suffix={
                      <ClipboardCopy
                        data={JSON.stringify(schema, null, 2)}
                        asChild
                      >
                        <Button variant="ghost" size="icon">
                          <ClipboardCopyIcon className="size-4" />
                        </Button>
                      </ClipboardCopy>
                    }
                  />
                  <OutputDisplay schema={schema} error={error} />
                </ResizablePanel>

                <ResizableHandle
                  onDoubleClickCapture={() => resetLayout({ id: "vertical" })}
                />

                <ResizablePanel>
                  <ResizablePanelHeader title="Visualizer" />
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
