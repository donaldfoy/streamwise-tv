## StreamWiseTV (tvOS)

This repo contains the StreamWiseTV React Native / Expo (prebuilt) project targeting **tvOS**.

### Prereqs

- **Xcode** installed (tvOS SDK)
- **Node.js** installed (recommended: current LTS)
- **CocoaPods** (Ruby + `pod`)

### Install

From the repo root:

```bash
npm install
cd ios
pod install
cd ..
```

### Run (Apple TV Simulator or device)

- Open `ios/StreamWiseTV.xcworkspace` in Xcode (preferred when using Pods)
- Select a tvOS simulator/device
- Build/Run

### Archive / TestFlight / App Store

- In Xcode: `Product > Archive`
- Use Organizer to distribute to TestFlight / App Store Connect

### Notes

- Local Xcode env overrides go in `ios/.xcode.env.local` (not committed).

