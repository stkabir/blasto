# Blasto v1.6.0 — Open Test Release Cheatsheet

> Procedimiento de release usado para pasar de **Closed Test** a **Open Test** en Google Play.
> Reaplicar en cada nuevo release.

---

## 1. Pre-flight

- Working tree limpio en `main`
- Todos los cambios commiteados y pusheados
- Última versión en producción verificada en Google Play Console
- Java JDK 17 instalado (`java -version`)
- Android SDK + build-tools instalados
- Keystore presente en `android/app/blasto-release.jks`
- `android/app/release-signing.properties` con las credenciales

## 2. Limpieza de archivos no productivos

Archivos que NO deben ir al release:

```powershell
# IDE local
Remove-Item -Recurse -Force "android/.idea"
Get-ChildItem -Path "android" -Recurse -Filter "*.iml" -ErrorAction SilentlyContinue | Remove-Item -Force

# Proyecto de promo HyperFrames (externo al juego)
Remove-Item -Recurse -Force "blasto-promo"

# Caches locales
Remove-Item -Recurse -Force "android/app/build" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "android/.gradle" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "www" -ErrorAction SilentlyContinue
```

Verificar `.gitignore`:

```
node_modules/
dist/
www/
index.dev.html
android/.idea/
android/*.iml
android/app/build/
android/.gradle/
android/local.properties
android/app/release/
blasto-promo/
```

## 3. Bump de versión

Editar `android/app/build.gradle`:

```gradle
versionCode 11          // incrementar siempre
versionName "1.6.0"     // semver
```

## 4. Build

```powershell
pnpm install
pnpm run build           # genera dist/game.min.js + copia a www/
pnpm run cap-sync        # build + cap sync a android/
```

Verificar:

- `dist/game.min.js` existe
- `www/index.html` apunta a `./dist/game.min.js`
- `android/app/src/main/assets/public/` contiene el bundle nuevo

## 5. Generar AAB firmado

```powershell
cd android
.\gradlew bundleRelease
```

Salida:

```
android/app/build/outputs/bundle/release/app-release.aab
```

Verificar firma:

```powershell
& "$env:JAVA_HOME\bin\jarsigner.exe" -verify -verbose -certs "android/app/build/outputs/bundle/release/app-release.aab" | Select-String -Pattern "jar verified"
```

Verificar tamaño (referencia v1.5.0 < 20 MB):

```powershell
Get-Item "android/app/build/outputs/bundle/release/app-release.aab" | Select-Object Name, @{N="MB";E={[math]::Round($_.Length/1MB,2)}}
```

## 6. Type check

```powershell
pnpm exec tsc --noEmit
```

Debe terminar sin errores.

## 7. Commit + tag + push

```powershell
git add -A
git commit -m "chore: release v1.6.0"
git tag -a v1.6.0 -m "Release v1.6.0 - Open Test"
git push origin main
git push origin v1.6.0
```

## 8. Subir a Google Play Console

1. https://play.google.com/console → **Blasto**
2. **Testing → Open testing** → **Create new release**
3. Subir `app-release.aab`
4. Release notes (EN):
   - "New release for open testing."
   - "Bug fixes and stability improvements."
5. **Review release** → **Start rollout to Open testing**

## 9. Verificación post-release

- Google Play Console muestra la versión `1.6.0 (11)` en *Open testing releases*
- App aparece en la página de Open Test track
- Probar instalación vía enlace de Open Test

## Historial de releases

| Versión   | versionCode | Fecha      | Track       | Notas                              |
|-----------|-------------|------------|-------------|------------------------------------|
| v1.3.7    | —           | —          | Closed Test | Primera versión                    |
| v1.5.0    | 10          | 2026-05    | Closed Test | Aprobado para Open Test            |
| v1.6.0    | 11          | 2026-06-12 | Open Test   | Primer release en Open Test        |

## Troubleshooting

- **`SDK location not found`** → crear `android/local.properties` con `sdk.dir=C:\\Users\\<user>\\AppData\\Local\\Android\\Sdk`
- **`release-signing.properties not found`** → regenerar desde backup seguro (NO commitear)
- **AAB rechaza en Play Console** → verificar que `versionCode` sea estrictamente mayor al anterior
- **`pnpm` no encontrado** → usar `npm` o instalar pnpm con `npm i -g pnpm`
