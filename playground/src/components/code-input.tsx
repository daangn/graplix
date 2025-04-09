import CodeMirror from "@uiw/react-codemirror";
import { editorTheme } from "../helpers";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function CodeInput({ value, onChange }: CodeInputProps) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      height="100%"
      className="w-full h-full"
      theme={editorTheme}
      basicSetup={{
        syntaxHighlighting: false,
      }}
    />
  );
}
