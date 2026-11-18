# Sharada English Medium School - Parent Portal Mobile App 📱

Official React Native / Expo mobile application for parents of students at **Sharada English Medium School** (Cherkady).

- **Mobile App Repository:** [https://github.com/sharada-school/MobileApp](https://github.com/sharada-school/MobileApp)
- **Web Portal Repository:** [https://github.com/sharada-school/sharada-school](https://github.com/sharada-school/sharada-school)
- **Live Production Portal:** [https://portal.sharada-school.co.in](https://portal.sharada-school.co.in)

---

## 🌟 Features

- **Secure OTP Phone Login:** Parents log in with their registered 10-digit mobile number.
- **Multi-Child Dashboard:** Seamlessly toggle between multiple enrolled siblings.
- **Attendance Tracking:** Real-time visibility of monthly & daily attendance records and percentages.
- **Examinations & Marks:** Detailed assessment results (FA-1, FA-2, SA-1, FA-3, FA-4, SA-2, Annual) with subject breakdowns, grades, and teacher feedback.
- **Student Profile:** Access student admission number, class, section, roll number, and academic year.
- **Live API Integration:** Pre-configured to communicate with the live backend at `https://portal.sharada-school.co.in`.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or v20 recommended)
- **npm** or **yarn**
- **Expo Go** app installed on your Android or iOS device from Google Play Store or Apple App Store.

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm start
# or
npx expo start
```

### 4. Run on a Physical Mobile Device
1. Run `npx expo start` in your terminal.
2. A QR code will appear in the terminal and in the Metro DevTools browser window.
3. **Android:** Open the **Expo Go** app and tap **"Scan QR code"**.
4. **iPhone:** Open the default **Camera** app and tap the Expo notification.
5. The app will bundle and load directly on your phone!

---

## ⚙️ Backend API Configuration

The mobile app is pre-configured to connect to the live production portal:
```
https://portal.sharada-school.co.in
```

### Changing or Overriding the Backend URL
If testing against a local backend or staging server:
1. On the login screen, expand **⚙️ Server Connection**.
2. Select a quick preset or type your custom server URL (e.g. `http://10.0.2.2:4000` for Android Emulator).
3. Tap **Test Connection** to verify network reachability.

---

## 📦 Building Standalone APK / Production Builds

This project uses **Expo Application Services (EAS Build)** configured in `eas.json`.

### Install EAS CLI
```bash
npm install -g eas-cli
```

### Build Android APK (Preview / Sideloadable)
```bash
npx eas build --platform android --profile preview
```

### Build iOS Simulator / Device Build
```bash
npx eas build --platform ios --profile preview
```

---

## 📂 Project Structure

```
mobile-app/
├── app.json                  # Expo app configuration (package name, permissions, icons)
├── eas.json                  # EAS Build configuration for Android APK and iOS
├── package.json              # Dependencies and mobile run scripts
├── tsconfig.json             # TypeScript configuration
├── assets/
│   └── images/               # School logos, splash screen, and app icons
└── src/
    ├── app/
    │   ├── _layout.tsx       # Root layout provider & status bar configuration
    │   └── index.tsx         # Main entry screen & bottom navigation tabs
    ├── components/
    │   ├── PhoneLogin.tsx    # Parent mobile OTP login screen
    │   ├── ParentHomeView.tsx# Dashboard overview & summary cards
    │   ├── AttendanceView.tsx# Monthly attendance calendar & statistics
    │   ├── MarksView.tsx     # Exam marks registers & report cards
    │   ├── AllChildrenView.tsx# Multi-child switcher & details
    │   ├── KidSelector.tsx   # Top student switcher pill
    │   └── ParentProfileView.tsx # Parent profile & logout
    ├── context/
    │   └── ParentContext.tsx # Central auth & student state management
    └── services/
        └── api.ts            # REST API client configured for https://portal.sharada-school.co.in
```
