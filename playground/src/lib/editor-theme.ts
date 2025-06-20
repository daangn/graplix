import { atomoneInit } from "@uiw/codemirror-theme-atomone";

export const editorDarkTheme = atomoneInit({
  settings: {
    background: "#0A0A0A",
    foreground: "#d4d4d4",
    gutterBackground: "#0A0A0A",
    gutterActiveForeground: "#d4d4d4",
    lineHighlight: "#202020",
    selection: "#202020",
  },
});

export const editorLightTheme = atomoneInit({
  settings: {
    background: "#ffffff",
    foreground: "#171717",
    gutterBackground: "#ffffff",
    gutterActiveForeground: "#171717",
    lineHighlight: "#f0f0f0",
    selection: "#d4d4d4",
  },
});
