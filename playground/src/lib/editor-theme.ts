import { atomoneInit } from "@uiw/codemirror-theme-atomone";

export const editorDarkTheme = atomoneInit({
  settings: {
    background: "#171717",
    foreground: "#d4d4d4",
    gutterBackground: "#171717",
    gutterActiveForeground: "#d4d4d4",
    lineHighlight: "#202020",
  },
});

export const editorLightTheme = atomoneInit({
  settings: {
    background: "#ffffff",
    foreground: "#171717",
    gutterBackground: "#ffffff",
    gutterActiveForeground: "#171717",
    lineHighlight: "#f0f0f0",
  },
});
