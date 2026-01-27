# Firebase Setup for Mobile App

## Overview
This mobile app uses Firebase Cloud Messaging (FCM) for push notifications. The `google-services.json` file contains Firebase configuration and is **not committed to version control** for security reasons.

## Setup Instructions for Developers

### 1. Get the Firebase Configuration File

**Option A: Download from Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com/project/skill-issue-ca915)
2. Navigate to: **Project Settings** > **General** > **Your apps**
3. Find the Android app with package name: `com.jmurphy.skillissue`
4. Click **Download google-services.json**

**Option B: Request from Team Lead**
- Contact Jordan Murphy for a secure copy of the configuration file

### 2. Install the Configuration File

```bash
# From the project root directory
cp /path/to/your/google-services.json packages/mobile/google-services.json
```

### 3. Verify Setup

```bash
# File should exist
ls packages/mobile/google-services.json

# But should NOT appear in git status (it's gitignored)
git status | grep google-services.json
# (should return nothing)
```

### 4. Environment Variables

Copy the `.env.example` file to create your local environment:

```bash
cd packages/mobile
cp .env.example .env.local
```

Then edit `.env.local` with your actual values:
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`: Get from [Clerk Dashboard](https://dashboard.clerk.com/)
- `EXPO_PUBLIC_BACKEND_URL`: Use your local machine's IP (not `localhost`)

## Testing Push Notifications

1. **Build and run the app on a physical device** (emulators don't support push notifications)
   ```bash
   pnpm start
   # Then press 'a' for Android
   ```

2. **Navigate to Profile > Settings**

3. **Enable push notifications** using the toggle

4. **Check console logs** for your Expo Push Token
   ```
   [NotificationStore] 💾 Saved token: ExponentPushToken[xxxxxx]
   ```

## Important Security Notes

- ⚠️ **NEVER commit `google-services.json` to git**
- ✅ The file is in `.gitignore` and should remain local only
- ✅ Use `google-services.example.json` as a structure reference
- 🔒 Store your copy securely (password manager, encrypted storage)

## Troubleshooting

### "google-services.json not found"
- Verify file location: `packages/mobile/google-services.json`
- Check that it's at the root of the mobile package, not in a subdirectory

### Push notifications not working
- Ensure you're testing on a **physical device** (not emulator)
- Check Firebase console for proper Android app configuration
- Verify `package_name` in config matches: `com.jmurphy.skillissue`
- Check that notification permissions are granted on the device

### Build errors about google-services.json
- Make sure the file exists locally
- Verify the JSON structure matches `google-services.example.json`
- Check that `app.json` has: `"googleServicesFile": "./google-services.json"`

## Firebase Project Details

- **Project ID**: skill-issue-ca915
- **Package Name**: com.jmurphy.skillissue
- **Platform**: Android (iOS configuration coming later)

## Related Documentation

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Clerk Authentication](https://clerk.com/docs)
