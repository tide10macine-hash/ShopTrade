import React from "react";
import { theme } from "../theme";

export const display = (fontSize: number, color: string): React.CSSProperties => ({
  fontFamily: theme.fonts.display,
  fontWeight: 900,
  fontSize,
  letterSpacing: "-0.03em",
  lineHeight: 1.04,
  color,
  textAlign: "center",
});

export const kicker = (fontSize: number, color: string): React.CSSProperties => ({
  fontFamily: theme.fonts.body,
  fontWeight: 600,
  fontSize,
  letterSpacing: "0.24em",
  color,
  textAlign: "center",
});
