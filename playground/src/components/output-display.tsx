import { useTheme } from "@/components/ui/theme-provider";
import { editorDarkTheme, editorLightTheme } from "@/lib/editor-theme";
import { langs } from "@uiw/codemirror-extensions-langs";
import CodeMirror from "@uiw/react-codemirror";
import type { GraplixSchema } from "graplix";

interface OutputDisplayProps {
  schema: GraplixSchema<any>;
  error: string | null;
}

export function OutputDisplay({ schema, error }: OutputDisplayProps) {
  const { isDark } = useTheme();

  return (
    <>
      <CodeMirror
        readOnly
        value={JSON.stringify(schema, null, 2)}
        height="100%"
        className="w-full h-full"
        theme={isDark ? editorDarkTheme : editorLightTheme}
        extensions={[langs.json()]}
        basicSetup={{
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
        }}
      />
      {error !== null && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-destructive/10">
          <div className="text-destructive">{error}</div>
        </div>
      )}
    </>
  );
}
