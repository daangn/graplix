import { langs } from "@uiw/codemirror-extensions-langs";
import CodeMirror from "@uiw/react-codemirror";
import { parse } from "graplix";
import type { GraplixSchema } from "graplix";
import { useEffect, useState } from "react";
import { editorTheme } from "../helpers";

interface OutputDisplayProps {
  code: string;
}

export function OutputDisplay({ code }: OutputDisplayProps) {
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
    <>
      <CodeMirror
        readOnly
        value={JSON.stringify(schema, null, 2)}
        height="100%"
        style={{ opacity: error !== null ? 0.8 : 1 }}
        className="w-full h-full"
        theme={editorTheme}
        extensions={[langs.json()]}
        basicSetup={{
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
        }}
      />
      {error !== null && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-red-200">
          <div className="text-red-500">{error}</div>
        </div>
      )}
    </>
  );
}
