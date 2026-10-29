import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

const FACES: ReadonlyArray<readonly [family: string, file: string, weight: string]> = [
  ["Inter", "inter-latin-400-normal.woff2", "400"],
  ["Inter", "inter-latin-500-normal.woff2", "500"],
  ["Inter", "inter-latin-600-normal.woff2", "600"],
  ["Inter Tight", "inter-tight-latin-700-normal.woff2", "700"],
  ["Inter Tight", "inter-tight-latin-800-normal.woff2", "800"],
  ["Inter Tight", "inter-tight-latin-900-normal.woff2", "900"],
];

const handle = delayRender("Loading fonts");

Promise.all(
  FACES.map(async ([family, file, weight]) => {
    const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format("woff2")`, { weight });
    document.fonts.add(await face.load());
  }),
)
  .then(() => continueRender(handle))
  .catch((err: unknown) => cancelRender(err));
