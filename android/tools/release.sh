#!/bin/bash
# TRON: ARES — Play Store release pipeline (build + sign + verify)
set -u
cd "E:/Tron ares" || exit 1
export JAVA_HOME="C:/Program Files/Eclipse Adoptium/jdk-17.0.20.8-hotspot"
export ANDROID_HOME="D:/Android/SDK"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

echo "=== 1. SDK platforms available ==="
ls "$ANDROID_HOME/platforms/" 2>/dev/null

echo "=== 2. install platform 35 if missing (Play requires targetSdk 35) ==="
if [ ! -d "$ANDROID_HOME/platforms/android-35" ]; then
  SDKM="$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager.bat"
  if [ -f "$SDKM" ]; then
    cmd.exe /c "\"D:\\Android\\SDK\\cmdline-tools\\latest\\bin\\sdkmanager.bat\" \"platforms;android-35\" \"build-tools;35.0.0\"" 2>&1 | tail -5
  else
    echo "sdkmanager not found at $SDKM"
  fi
else
  echo "android-35 already present"
fi
ls "$ANDROID_HOME/platforms/" 2>/dev/null

echo "=== 3. keystore ==="
KS_DIR="E:/Tron ares/android/keystore"
mkdir -p "$KS_DIR"
if [ ! -f "$KS_DIR/tron-ares-upload.jks" ]; then
  PASS=$(python -c "import secrets,string; print(''.join(secrets.choice(string.ascii_letters+string.digits) for _ in range(24)))")
  keytool -genkeypair -v -keystore "$KS_DIR/tron-ares-upload.jks" \
    -alias tron-ares -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$PASS" -keypass "$PASS" \
    -dname "CN=Md Sadman Bin Masud, OU=Games, O=Independent, L=Dhaka, ST=Dhaka, C=BD" 2>&1 | tail -3
  printf 'UPLOAD KEYSTORE — TRON: ARES\n\nfile:     %s\nstore:    tron-ares-upload.jks\nalias:    tron-ares\npassword: %s\n\nBACK THIS UP. Losing the upload key means you cannot update the app\nwithout asking Google to reset it. Store it in a password manager and keep\na copy outside this machine.\n' "$KS_DIR/tron-ares-upload.jks" "$PASS" > "$KS_DIR/KEYSTORE-CREDENTIALS.txt"
  echo "keystore created; credentials written to $KS_DIR/KEYSTORE-CREDENTIALS.txt"
else
  echo "keystore already exists — reusing"
fi
ls -la "$KS_DIR" | tail -3

echo "=== 4. point gradle at the keystore ==="
python - <<'PY'
import io, os
p = 'android/app/build.gradle.kts'
s = io.open(p, encoding='utf-8').read()
if 'tron-ares-upload.jks' not in s:
    s = s.replace('''android {
    namespace = "com.ares.grid"
    compileSdk = 34''', '''android {
    namespace = "com.ares.grid"
    compileSdk = 35

    // Upload key: never commit the keystore, never use the debug key for Play.
    signingConfigs {
        create("release") {
            val ks = rootProject.file("keystore/tron-ares-upload.jks")
            if (ks.exists()) {
                storeFile = ks
                storePassword = "TEMP_STORE_PASS"
                keyAlias = "tron-ares"
                keyPassword = "TEMP_STORE_PASS"
            }
        }
    }''', 1)
    s = s.replace('        targetSdk = 34', '        targetSdk = 35', 1)
    s = s.replace('''        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("debug")
        }''', '''        release {
            isMinifyEnabled = false
            if (rootProject.file("keystore/tron-ares-upload.jks").exists()) {
                signingConfig = signingConfigs.getByName("release")
            }
        }''', 1)
    s = s.replace('        versionCode = 1', '        versionCode = 2', 1)
    s = s.replace('        versionName = "1.0"', '        versionName = "1.0.1"', 1)
    io.open(p, 'w', encoding='utf-8').write(s)
    print('gradle: signingConfig + targetSdk 35 + version bump')
else:
    print('gradle already configured')
PY

# inject the generated password without ever printing it
KS_PASS=$(grep '^password:' "$KS_DIR/KEYSTORE-CREDENTIALS.txt" | awk '{print $2}')
python - "$KS_PASS" <<'PY'
import io, sys
pw = sys.argv[1]
p = 'android/app/build.gradle.kts'
s = io.open(p, encoding='utf-8').read()
s = s.replace('TEMP_STORE_PASS', pw)
io.open(p, 'w', encoding='utf-8').write(s)
print('gradle: keystore password injected (not shown)')
PY

echo "=== 5. gitignore the secrets ==="
python - <<'PY'
import io, os
p = '.gitignore'
s = io.open(p, encoding='utf-8').read() if os.path.exists(p) else ''
add = "\n# Release secrets — never commit these\nandroid/keystore/\n*.jks\n*.keystore\n"
if 'android/keystore/' not in s:
    io.open(p, 'w', encoding='utf-8').write(s + add)
    print('.gitignore: keystore excluded')
PY

echo "=== 6. build the release bundle ==="
cd android || exit 1
"D:/Apps/gradle-8.9/bin/gradle.bat" --console=plain bundleRelease 2>&1 | grep -E "BUILD|error:|FAILED|warning: unable" | head -8

echo "=== 7. verify the artifact ==="
AAB="app/build/outputs/bundle/release/app-release.aab"
if [ -f "$AAB" ]; then
  ls -la "$AAB" | awk '{print "AAB size:", $5/1048576 " MB"}'
  unzip -l "$AAB" | grep -E "base/manifest|BundleConfig|base/assets/index" | head -5
  jarsigner -verify "$AAB" 2>&1 | head -3
else
  echo "AAB NOT PRODUCED"
  ls -la app/build/outputs/bundle/ 2>/dev/null
fi
