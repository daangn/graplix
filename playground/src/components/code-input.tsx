import { useTheme } from "@/components/ui";
import { editorDarkTheme, editorLightTheme } from "@/lib/editor-theme";
import CodeMirror from "@uiw/react-codemirror";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function CodeInput({ value, onChange }: CodeInputProps) {
  const { isDark } = useTheme();

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      height="100%"
      className="w-full h-full"
      theme={isDark ? editorDarkTheme : editorLightTheme}
      basicSetup={{
        syntaxHighlighting: false,
      }}
    />
  );
}
