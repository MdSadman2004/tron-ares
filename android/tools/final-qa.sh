#!/bin/bash
set -u
cd "E:/Tron ares" || exit 1
export JAVA_HOME="C:/Program Files/Eclipse Adoptium/jdk-17.0.20.8-hotspot"
export ANDROID_HOME="D:/Android/SDK"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
export ADB="D:/Studio/platform-tools/adb.exe"
D=R87YA00YSAD

echo "=== merged manifest (Play requirements) ==="
MF="android/app/build/intermediates/merged_manifests/release/processReleaseManifest/AndroidManifest.xml"
if [ -f "$MF" ]; then
  grep -oE 'android:(versionCode|versionName|minSdkVersion|targetSdkVersion|compileSdkVersion)="[^"]*"' "$MF" | sort -u
else
  echo "merged manifest not found at $MF"
  find android/app/build/intermediates/merged_manifests -name AndroidManifest.xml 2>/dev/null | head -3
fi

echo
echo "=== build a signed release APK as well (sideload/testing) ==="
cd android || exit 1
"D:/Apps/gradle-8.9/bin/gradle.bat" --console=plain assembleRelease 2>&1 | grep -E "BUILD|error:|FAILED" | head -5

APK="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK" ]; then
  ls -la "$APK" | awk '{print "release APK:", $5/1048576 " MB"}'
  AAPT="$ANDROID_HOME/build-tools/35.0.0/aapt2.exe"
  [ -f "$AAPT" ] || AAPT="$ANDROID_HOME/build-tools/34.0.0/aapt2.exe"
  if [ -f "$AAPT" ]; then
    echo "--- badging ---"
    "$AAPT" dump badging "$APK" 2>/dev/null | grep -E "^package|sdkVersion|targetSdkVersion|application-label|native-code|launchable-activity" | head -8
  fi
  echo "--- signature ---"
  "$JAVA_HOME/bin/jarsigner" -verify -verbose -certs "$APK" 2>&1 | grep -E "CN=|jar verified|Signature" | head -4
fi

echo
echo "=== FINAL DEBUG PASS on the release-signed build ==="
"$ADB" -s $D uninstall com.ares.grid >/dev/null 2>&1
"$ADB" -s $D install -r "$APK" 2>&1 | tail -1
"$ADB" -s $D logcat -c
"$ADB" -s $D shell am start -n com.ares.grid/com.ares.grid.MainActivity 2>&1 | tail -1
sleep 14
# start a run and let TouchDrive play it hands-free for a minute
"$ADB" -s $D shell input tap 799 650
echo "--- hands-free run (60 s) ---"
for i in 1 2 3 4 5 6; do
  sleep 10
  "$ADB" -s $D logcat -d -s TRONARES:* 2>&1 | grep probe | tail -1
done
echo "--- pause / resume via back button ---"
"$ADB" -s $D shell input keyevent 4
sleep 3
"$ADB" -s $D logcat -d -s TRONARES:* 2>&1 | grep -E "probe:" | tail -1
echo "--- errors across the whole session ---"
"$ADB" -s $D logcat -d -s TRONARES:* 2>&1 | grep -cE "JSERROR|JSREJECT" | xargs echo "js errors:"
"$ADB" -s $D logcat -d 2>&1 | grep -iE "FATAL|ANR in com.ares" | head -3
echo "--- still resident? ---"
"$ADB" -s $D shell dumpsys activity activities 2>/dev/null | grep -m1 "topResumedActivity"
