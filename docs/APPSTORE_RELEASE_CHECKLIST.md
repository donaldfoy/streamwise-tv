## StreamWiseTV tvOS App Store Checklist

### Pre-Archive

- [ ] `npm install`
- [ ] `cd ios && pod install`
- [ ] Confirm `ios/.xcode.env.local` points to valid Node binary
- [ ] Confirm `Images.xcassets/Brand Assets.brandassets` required slots are populated

### Xcode Build Settings

- [ ] `ENABLE_USER_SCRIPT_SANDBOXING = NO` for app target if RN script phase needs filesystem traversal
- [ ] Release uses `DWARF with dSYM File`
- [ ] Bundle identifier matches App Store Connect app record
- [ ] Version/build numbers align across Expo + Xcode

### Archive + Upload

- [ ] Product -> Clean Build Folder
- [ ] Archive for tvOS Release
- [ ] Upload via Organizer
- [ ] Check App Store Connect processing status

### Validation Follow-Up

- [ ] Resolve any icon/top-shelf validation failures
- [ ] Review symbol upload warnings (`React`, `ReactNativeDependencies`, `Hermes`)
- [ ] Verify Privacy Manifest and questionnaire responses

### Final Submission

- [ ] Metadata complete (description, keywords, support URL)
- [ ] tvOS screenshots uploaded
- [ ] Age rating and content rights complete
- [ ] Submit for review

