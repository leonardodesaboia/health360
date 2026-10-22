import { readFileSync } from "node:fs";

const css = readFileSync(
  new URL("../src/app/globals.css", import.meta.url),
  "utf8",
);
const tokens = Object.fromEntries(
  [...css.matchAll(/--([\w-]+):\s*(#[a-f\d]{6});/gi)].map(([, key, value]) => [
    key,
    value,
  ]),
);
function luminance(hex) {
  const rgb = hex
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
const pairs = [
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["muted-foreground", "background"],
  ["muted-foreground", "muted"],
  ["accent-foreground", "accent"],
  ["destructive-foreground", "destructive"],
  ["success-foreground", "success"],
  ["warning-foreground", "warning"],
  ["information-foreground", "information"],
  ["sidebar-foreground", "sidebar"],
  ["navigation-active-foreground", "navigation-active"],
  ["primary", "background"],
  ["primary", "card"],
  ["ring", "background"],
  ["ring", "card"],
  ["input", "card"],
];
for (const [fg, bg] of pairs) {
  const values = [luminance(tokens[fg]), luminance(tokens[bg])].sort(
    (a, b) => b - a,
  );
  const ratio = (values[0] + 0.05) / (values[1] + 0.05);
  const threshold = fg === "ring" || fg === "input" ? 3 : 4.5;
  console.log(
    `${fg} / ${bg}: ${ratio.toFixed(2)}:1 ${ratio >= threshold ? "PASS" : "FAIL"} (>=${threshold})`,
  );
  if (ratio < threshold) process.exitCode = 1;
}
