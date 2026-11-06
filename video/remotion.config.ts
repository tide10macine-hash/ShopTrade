import { Config } from "@remotion/cli/config";

// All editable media lives in ./assets (logos, reference icons, audio, fonts, backgrounds)
Config.setPublicDir("./assets");
Config.setVideoImageFormat("png"); // lossless frames -> clean red edges, yuv420p (tv range) output
Config.setPixelFormat("yuv420p");
Config.setConcurrency(4);
if (process.env.REMOTION_CHROME) {
  Config.setBrowserExecutable(process.env.REMOTION_CHROME);
}
