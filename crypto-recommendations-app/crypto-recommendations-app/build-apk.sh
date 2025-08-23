#!/bin/bash

# Build APK script for Crypto Recommendations App
echo "Building Crypto Recommendations APK..."

# Step 1: Build the web app
echo "Step 1: Building web application..."
pnpm run build

# Step 2: Copy to Capacitor
echo "Step 2: Copying to Capacitor..."
npx cap copy

# Step 3: Sync with Android
echo "Step 3: Syncing with Android..."
npx cap sync android

# Step 4: Build APK using Gradle
echo "Step 4: Building APK..."
cd android
./gradlew assembleDebug

# Step 5: Copy APK to project root
echo "Step 5: Copying APK to project root..."
cp app/build/outputs/apk/debug/app-debug.apk ../crypto-recommendations.apk

echo "APK built successfully: crypto-recommendations.apk"
echo "You can install this APK on Android devices."

