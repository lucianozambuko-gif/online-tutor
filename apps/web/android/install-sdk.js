const { AndroidSdkToolsInstaller } = require("@bubblewrap/cli/dist/lib/AndroidSdkToolsInstaller");
const path = require("path");
const fs = require("fs");

const fakePrompt = {
  printMessage: (msg) => console.log(msg),
  downloadFile: async (url, filename, totalSize = 0) => {
    console.log(`Downloading ${url} -> ${filename}`);
    const { fetchUtils } = require("@bubblewrap/core");
    let lastPct = -10;
    await fetchUtils.downloadFile(url, filename, (current, total) => {
      const pct = total > 0 ? Math.floor((current / total) * 100) : 0;
      if (pct >= lastPct + 10) {
        console.log(`  ${pct}%`);
        lastPct = pct;
      }
    });
  },
};

const targetDir = path.join(__dirname, "tools", "android-sdk");

(async () => {
  fs.mkdirSync(targetDir, { recursive: true });
  const installer = new AndroidSdkToolsInstaller(process, fakePrompt);
  await installer.install(targetDir);
  console.log("SDK_PATH:" + targetDir);
})().catch((e) => {
  console.error("FAILED", e);
  process.exit(1);
});
