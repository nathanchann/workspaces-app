const tintColorLight = "#2f95dc";
const tintColorDark = "#fff";

export const Colors = {
  primary: "#fe375c",
  background: "#ffffff",
  text: "#000000",
  lightGrey: "#f5f5f5",
  border: "#e0e0e0",
  gray: "#6b7280",
  light: "#ffffff",
  tint: tintColorLight,
  tabIconDefault: "#ccc",
  tabIconSelected: tintColorLight,
  dark: {
    text: "#fff",
    background: "#000",
    tint: tintColorDark,
    tabIconDefault: "#ccc",
    tabIconSelected: tintColorDark,
  },
} as const;

export default Colors;
