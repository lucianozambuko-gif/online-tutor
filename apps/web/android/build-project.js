const path = require("path");
const fs = require("fs");
const { execFile } = require("child_process");
const { Config, JdkHelper, AndroidSdkTools } = require("@bubblewrap/core");

function runQuoted(exePath, args, opts) {
  // execFile with shell:true on Windows just concatenates argv into a
  // string for cmd.exe — an unquoted absolute path containing spaces (this
  // project lives under one) gets torn apart at the first space. Quoting
  // the executable ourselves is what GradleWrapper's hardcoded bare
  // 'gradlew.bat' (relying on PATH/cwd lookup, which also fails here) does
  // not do.
  return new Promise((resolve, reject) => {
    execFile(`"${exePath}"`, args, { shell: true, ...opts }, (err, stdout, stderr) => {
      if (err) return reject(Object.assign(err, { stdout, stderr }));
      resolve({ stdout, stderr });
    });
  });
}

const JDK_PATH = process.argv[2];
const ANDROID_SDK_PATH = process.argv[3]; // subst drive path, e.g. X:\android-sdk
if (!JDK_PATH || !ANDROID_SDK_PATH) {
  console.error("Usage: node build-project.js <jdkPath> <androidSdkPath>");
  process.exit(1);
}

const TARGET_DIR = __dirname;
const credentials = JSON.parse(
  fs.readFileSync(path.join(TARGET_DIR, "signing-key-credentials.DO-NOT-COMMIT.json"), "utf8"),
);

const APP_BUNDLE_BUILD_OUTPUT_FILE_NAME = path.join(TARGET_DIR, "app/build/outputs/bundle/release/app-release.aab");
const APP_BUNDLE_SIGNED_FILE_NAME = path.join(TARGET_DIR, "app-release-bundle.aab");
const GRADLEW_PATH = path.join(TARGET_DIR, "gradlew.bat");

(async () => {
  // Same Windows env-key casing issue as the signing-key step: make sure PATH
  // (both casings) already includes the JDK bin dir before anything spreads
  // process.env.
  const jdkBin = path.join(JDK_PATH, "bin");
  process.env.PATH = jdkBin + path.delimiter + (process.env.PATH || "");
  process.env.Path = jdkBin + path.delimiter + (process.env.Path || process.env.PATH || "");

  const config = new Config(JDK_PATH, ANDROID_SDK_PATH);
  const jdkHelper = new JdkHelper(process, config);
  const androidSdkTools = await AndroidSdkTools.create(process, config, jdkHelper);

  console.log("Building release App Bundle (bundleRelease)...");
  const gradleEnv = androidSdkTools.getEnv();
  await runQuoted(GRADLEW_PATH, ["bundleRelease", "--stacktrace"], { cwd: TARGET_DIR, env: gradleEnv });

  console.log("Signing App Bundle with jarsigner...");
  // @bubblewrap/core's JarSigner.sign() joins its argv with util.execute(),
  // which does `cmd.join(' ')` without quoting any of the path arguments —
  // breaks the same way gradlew.bat did. Quote each path ourselves instead.
  // Also: this is a PKCS12 keystore (the JDK default since 9), which has no
  // concept of a per-key password distinct from the store password — keytool
  // silently ignores whatever -keypass it's given at creation time and uses
  // storepass instead, so jarsigner must be given storepass for both or it
  // fails with a confusing "not a private key" error.
  await runQuoted(
    "jarsigner",
    [
      "-verbose",
      "-sigalg", "SHA256withRSA",
      "-digestalg", "SHA-256",
      "-keystore", `"${credentials.keystorePath}"`,
      `"${APP_BUNDLE_BUILD_OUTPUT_FILE_NAME}"`,
      credentials.alias,
      "-storepass", credentials.keystorePassword,
      "-keypass", credentials.keystorePassword,
      "-signedjar", `"${APP_BUNDLE_SIGNED_FILE_NAME}"`,
    ],
    { env: jdkHelper.getEnv() },
  );
  console.log("AAB done:", APP_BUNDLE_SIGNED_FILE_NAME);

  console.log("DONE");
})().catch((e) => {
  console.error("FAILED", e);
  process.exit(1);
});
