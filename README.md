# GroceryListMobile

## How to Build and Run

### Prerequisites
- Node.js (v18 or newer recommended)
- npm
- Android Studio (for building APKs)
- Android SDK & NDK installed

### Install dependencies
```sh
npm install
```

### Run in development mode (Expo)
```sh
npx expo start
```
- Scan the QR code with Expo Go app (Android/iOS)
- Or run on emulator/device with:
  ```sh
  npx expo run:android
  npx expo run:ios
  ```

### Build Release APK (Android)
```sh
cd android
./gradlew assembleRelease
```
- The APK will be generated at:
  `android/app/build/outputs/apk/release/app-release.apk`
- To rename the APK, see `build.gradle` docs for `archivesBaseName`

### Share APK
- Transfer the APK to your device
- Enable "Unknown Sources" in Android settings
- Tap the APK to install

## What Gets Tracked in Git
- Source code (`src/`, `App.js`, `App.tsx`, etc.)
- Configuration files (`package.json`, `app.json`, etc.)
- No build outputs, APKs, or node_modules

## Troubleshooting
- If you see missing dependencies, run `npm install`
- For Android build errors, check SDK/NDK paths in `local.properties`
- For Expo errors, ensure you have the latest Expo CLI

---

For more help, see the official Expo and React Native docs.
