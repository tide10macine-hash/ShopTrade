import { continueRender, delayRender, staticFile } from "remotion";

// Load the display fonts once, blocking the render until they are ready
// (so no frame is ever drawn in a fallback face).
const faces: [string, string][] = [
  ["LilitaOne", "assets/fonts/LilitaOne.woff2"],
  ["Anton", "assets/fonts/Anton.woff2"],
];
if (typeof window !== "undefined" && "FontFace" in window) {
  const handle = delayRender("fonts");
  Promise.all(
    faces.map(([family, file]) =>
      new FontFace(family, `url(${staticFile(file)}) format("woff2")`).load().then((f) => {
        document.fonts.add(f);
      }),
    ),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
}
