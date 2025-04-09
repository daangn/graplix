import { useState } from "react";
import {
  CodeInput,
  Header,
  OutputDisplay,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Visualizer,
} from "./components";

export function App() {
  const [code, setCode] = useState(`model
  schema 1.1

  type user

  type team
    relations
      define member: [user]`);

  return (
    <div className="fixed inset-0">
      <Header />
      <div className="flex flex-col h-[calc(100vh_-_3.5rem)]">
        <main className="h-full w-full bg-neutral-900">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel>
              <CodeInput value={code} onChange={setCode} />
            </ResizablePanel>
            <ResizableHandle />

            <ResizablePanel>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={60}>
                  <OutputDisplay code={code} />
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={40}>
                  <Visualizer code={code} />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>
    </div>
  );
}
