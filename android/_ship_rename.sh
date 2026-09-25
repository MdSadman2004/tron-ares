#!/bin/bash
set -u
cd "E:/Tron ares" || exit 1
export JAVA_HOME="C:/Program Files/Eclipse Adoptium/jdk-17.0.20.8-hotspot"
export ANDROID_HOME="D:/Android/SDK"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
export ADB="D:/Studio/platform-tools/adb.exe"
D=R87YA00YSAD

echo "=== 1. drop film name from player-visible tooltips ==="
python - <<'PY'
import io
p = 'index.html'
s = io.open(p, encoding='utf-8').read()
n = s.count('(TRON: Ares)')
s = s.replace('(TRON: Ares)', '(film-inspiration fleet)')
io.open(p, 'w', encoding='utf-8').write(s)
print(f'  {n} tooltips reworded')
PY

echo "=== 2. regenerate the store feature graphic with the new name ==="
python - <<'PY'
from PIL import Image, ImageDraw, ImageFont
OUT = 'D:/Outputs/TronAres-Play'
RED=(255,8,56); CYAN=(0,240,255); BG=(4,2,8)
def font(p,s):
    try: return ImageFont.truetype(p,s)
    except Exception: return ImageFont.load_default()
MONO='C:/Windows/Fonts/consolab.ttf'; MONO_R='C:/Windows/Fonts/consola.ttf'
W,H=1024,500; im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im,'RGBA')
for i in range(16):
    t=i/15; y=250+(H-250)*(t**1.8); d.line([(0,y),(W,y)],fill=(130,0,30,110),width=1)
for i in range(-14,15):
    d.line([(W/2+i*9,250),(W/2+i*74,H)],fill=(130,0,30,110),width=1)
for i in range(60):
    d.line([(0,250+i),(W,250+i)],fill=(255,8,56,int(26*(1-i/60))))
for ox,sc in ((250,1.0),(700,0.72)):
    y=320+(1-sc)*40
    d.polygon([(ox-70*sc,y),(ox+70*sc,y),(ox+40*sc,y-26*sc),(ox-40*sc,y-26*sc)],fill=(16,16,26,255),outline=RED)
    for wx in (ox-44*sc,ox+44*sc):
        d.ellipse([wx-26*sc,y-6*sc,wx+26*sc,y+46*sc],outline=RED,width=5)
    d.line([(ox-120*sc,y+6),(ox-300*sc,y+6)],fill=(255,8,56,170),width=int(4*sc))
    d.line([(ox-120*sc,y-22*sc),(ox-300*sc,y-22*sc)],fill=(255,8,56,120),width=int(3*sc))
f_big=font(MONO,72); f_sub=font(MONO_R,21)
d.text((W//2-268,54),'GRID:',font=f_big,fill=(250,250,255))
d.text((W//2+70,54),'PROTOCOL',font=f_big,fill=RED)
d.text((W//2-238,146),'NINE MACHINES  //  ONE GRID  //  RIBBONS ARE LETHAL',font=f_sub,fill=CYAN)
d.text((W//2-250,176),'TOUCHDRIVE AUTOPILOT  .  LIGHT CYCLE ARENA  .  RIVAL PROGRAMS',font=font(MONO_R,15),fill=(150,150,175))
im.save(f'{OUT}/play-feature-1024x500.png')
print('  feature graphic regenerated with new branding', im.size)
PY

echo "=== 3. rebuild web + release artifacts ==="
npm run build 2>&1 | grep -E "built in|error" | head -2
rm -rf android/app/src/main/assets; mkdir -p android/app/src/main/assets; cp -r dist/* android/app/src/main/assets/
cd android || exit 1
"D:/Apps/gradle-8.9/bin/gradle.bat" --console=plain bundleRelease assembleRelease 2>&1 | grep -E "BUILD|error:|FAILED" | head -4
AAB=app/build/outputs/bundle/release/app-release.aab
APK=app/build/outputs/apk/release/app-release.apk
[ -f "$AAB" ] && ls -la "$AAB" | awk '{print "AAB:", $5/1048576 " MB"}'
[ -f "$AAB" ] && "$JAVA_HOME/bin/jarsigner" -verify "$AAB" 2>&1 | grep -E "jar verified|jar is unsigned" | head -1

echo "=== 4. install the renamed release build on the phone ==="
"$ADB" -s $D uninstall com.ares.grid >/dev/null 2>&1
"$ADB" -s $D install -r "$APK" 2>&1 | tail -1
"$ADB" -s $D logcat -c
"$ADB" -s $D shell am start -n com.ares.grid/com.ares.grid.MainActivity 2>&1 | tail -1
sleep 14
"$ADB" -s $D exec-out screencap -p > "D:/Outputs/Playwright/rebrand-menu.png" 2>/dev/null
echo "--- launcher label ---"
"$ADB" -s $D shell cmd package resolve-activity -c android.intent.category.LAUNCHER com.ares.grid 2>/dev/null | grep -m1 name=
echo "--- boot log ---"
"$ADB" -s $D logcat -d -s TRONARES:* 2>&1 | grep -E "probe:|JSERROR|boot:" | tail -3
cd "E:/Tron ares" && git add -A && git commit -q -m "Rebrand to GRID PROTOCOL for store release (app label, menu, HUD, tooltips, README)" && echo committed
git push origin main 2>&1 | tail -1
