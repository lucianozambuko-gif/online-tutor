const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { TwaManifest, TwaGenerator, BufferedLog, ConsoleLog, JdkHelper, KeyTool, Config } = require("@bubblewrap/core");

const MANIFEST_URL = "https://online-tutor-web.vercel.app/manifest.webmanifest";
const PACKAGE_ID = "za.co.lumen.app";
const TARGET_DIR = __dirname;
const JDK_PATH = process.argv[2];
if (!JDK_PATH) {
  console.error("Usage: node generate-project.js <jdkPath>");
  process.exit(1);
}

function randomPassword(len = 24) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[crypto.randomInt(chars.length)];
  return out;
}

(async () => {
  console.log("Fetching web manifest and building TWA manifest...");
  const twaManifest = await TwaManifest.fromWebManifest(MANIFEST_URL);

  twaManifest.packageId = PACKAGE_ID;
  twaManifest.signingKey.path = path.join(TARGET_DIR, "android.keystore");
  twaManifest.signingKey.alias = "lumen";

  await twaManifest.saveToFile(path.join(TARGET_DIR, "twa-manifest.json"));

  console.log("Generating Android project...");
  const twaGenerator = new TwaGenerator();
  const log = new BufferedLog(new ConsoleLog("Generating TWA"));
  await twaGenerator.createTwaProject(TARGET_DIR, twaManifest, log, (current, total) => {
    console.log(`  progress ${Math.round((current / total) * 100)}%`);
  });
  log.flush();

  const manifestContents = await fs.promises.readFile(path.join(TARGET_DIR, "twa-manifest.json"));
  const checksum = crypto.createHash("sha1").update(manifestContents).digest("hex");
  await fs.promises.writeFile(path.join(TARGET_DIR, "manifest-checksum.txt"), checksum);

  console.log("Generating signing key...");
  // JdkHelper.getEnv() sets env['Path'] on win32, but this process's actual
  // env key is 'PATH' — Node keeps both as distinct object keys internally,
  // and the spawned child only sees one of them, so keytool.exe never ends
  // up on the search path. Prepend the JDK bin dir under both casings here.
  const jdkBin = path.join(JDK_PATH, "bin");
  process.env.PATH = jdkBin + path.delimiter + (process.env.PATH || "");
  process.env.Path = jdkBin + path.delimiter + (process.env.Path || process.env.PATH || "");

  const config = new Config(JDK_PATH, "");
  const jdkHelper = new JdkHelper(process, config);
  const keyTool = new KeyTool(jdkHelper);

  // Re-running this script (e.g. after changing the app icon) must reuse the
  // existing keystore's password rather than generating a fresh one — the
  // keystore itself is left untouched (createSigningKey no-ops when the file
  // already exists), but a new random password would no longer open it.
  const credentialsPath = path.join(TARGET_DIR, "signing-key-credentials.DO-NOT-COMMIT.json");
  const existingCredentials = fs.existsSync(credentialsPath)
    ? JSON.parse(fs.readFileSync(credentialsPath, "utf8"))
    : null;
  const keystorePassword = existingCredentials?.keystorePassword ?? randomPassword();
  const keyPassword = existingCredentials?.keyPassword ?? keystorePassword;

  await keyTool.createSigningKey({
    fullName: "Lumen Tutoring",
    organizationalUnit: "Engineering",
    organization: "Lumen Tutoring",
    country: "ZA",
    password: keystorePassword,
    keypassword: keyPassword,
    alias: twaManifest.signingKey.alias,
    path: twaManifest.signingKey.path,
  });

  const keyInfo = await keyTool.keyInfo({
    path: twaManifest.signingKey.path,
    alias: twaManifest.signingKey.alias,
    password: keystorePassword,
    keypassword: keyPassword,
  });

  const credentials = {
    keystorePath: twaManifest.signingKey.path,
    alias: twaManifest.signingKey.alias,
    keystorePassword,
    keyPassword,
    sha256Fingerprint: keyInfo.fingerprints.get("SHA256"),
  };
  await fs.promises.writeFile(
    path.join(TARGET_DIR, "signing-key-credentials.DO-NOT-COMMIT.json"),
    JSON.stringify(credentials, null, 2),
  );

  console.log("DONE");
  console.log(JSON.stringify(credentials, null, 2));
})().catch((e) => {
  console.error("FAILED", e);
  process.exit(1);
});
