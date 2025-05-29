# Mobile App Setup Guide

This guide will help you build and run the QR Check-In app on Android and iOS devices.

## Prerequisites

### For Android Development:
- Android Studio installed
- Android SDK and build tools
- USB debugging enabled on your device OR Android emulator

### For iOS Development:
- macOS (required for iOS development)
- Xcode installed
- iOS device OR iOS Simulator
- Apple Developer account (for device testing)

## Quick Start

### 1. Build the Web App
```bash
cd project/client
npm run build
```

### 2. Sync with Native Projects
```bash
npm run cap:sync
```

### 3. Open in Native IDEs

#### Android:
```bash
npm run cap:android
```
This opens Android Studio with your project.

#### iOS:
```bash
npm run cap:ios
```
This opens Xcode with your project.

## Development Workflow

### Building and Running

1. **Web Development** (for UI testing):
   ```bash
   npm run dev
   ```

2. **Build for Mobile**:
   ```bash
   npm run cap:build
   ```

3. **Run on Device/Emulator**:
   ```bash
   # Android
   npm run cap:run:android
   
   # iOS
   npm run cap:run:ios
   ```

## Features Included

- **QR Code Scanner**: Uses device camera to scan QR codes
- **QR Code Generator**: Create QR codes for events/users
- **User Authentication**: Login/Register functionality
- **Responsive Design**: Works on phones and tablets
- **Cross-Platform**: Same codebase for web, Android, and iOS

## Mobile-Specific Features

### Camera Permissions
The app automatically requests camera permissions when scanning QR codes.

### Platform Detection
The app detects whether it's running on:
- Web browser
- Android device
- iOS device

And adapts functionality accordingly.

## Troubleshooting

### Android Issues:

1. **Build Errors**: 
   - Ensure Android SDK is properly installed
   - Check that ANDROID_HOME environment variable is set

2. **Camera Not Working**:
   - Verify camera permissions in device settings
   - Test on a physical device (emulator camera may not work well)

### iOS Issues:

1. **Build Errors**:
   - Ensure Xcode command line tools are installed: `xcode-select --install`
   - Check iOS deployment target compatibility

2. **Device Testing**:
   - Add your device to Apple Developer account
   - Enable developer mode on iOS device

### General Issues:

1. **QR Scanner Not Working**:
   - Ensure adequate lighting when scanning
   - Hold device steady and at appropriate distance
   - Check browser/app permissions for camera access

## File Structure

```
client/
├── src/
│   ├── components/
│   │   ├── QRScanner.vue      # Mobile QR scanner
│   │   ├── QRCodeGenerator.vue # QR code creation
│   │   └── UserDashboard.vue   # Main user interface
│   └── router.js               # Navigation routes
├── android/                    # Android native project
├── ios/                       # iOS native project
├── capacitor.config.json      # Capacitor configuration
└── package.json               # Dependencies and scripts
```

## Testing

1. **Web Testing**: Use browser developer tools mobile simulation
2. **Android Testing**: Use Android emulator or real device
3. **iOS Testing**: Use iOS Simulator or real device

## Deployment

### Android APK:
1. Open in Android Studio (`npm run cap:android`)
2. Build > Generate Signed Bundle/APK
3. Follow the signing process

### iOS App Store:
1. Open in Xcode (`npm run cap:ios`)
2. Archive the project
3. Upload to App Store Connect

## Next Steps

- Add push notifications
- Implement offline functionality
- Add biometric authentication
- Integrate with more QR code formats
- Add analytics and reporting
