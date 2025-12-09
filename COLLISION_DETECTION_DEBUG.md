# Collision Detection Debugging Guide

## Quick Test Steps

### 1. Start the App
```bash
cd Project-IRIS-2.0
npm run dev
```

### 2. Open Browser Console
- Press F12 or Ctrl+Shift+I
- Go to Console tab

### 3. Enable Collision Detection
1. Click the **"Collision Alert OFF"** button
2. Watch console for these logs:

**Expected console output:**
```
[Collision Detection] Starting collision detection
[Collision Detection] Analyzing frame (change: 0.0%, first: true)
[Collision Detection] Calling Gemini API...
[Collision Detection] Gemini response: SEVERITY: safe...
[Collision Detection] Extracted severity: safe
[Collision Detection] Extracted alert: Path is clear
[Collision Detection] Final result: {hasRisk: false, alert: "...", severity: "safe"}
[Collision Detection] No collision risk detected
```

### 4. Test with Movement
- Wave your hand in front of camera
- Walk toward camera
- Point camera at a person/object

**Console should show:**
```
[Collision Detection] Analyzing frame (change: 45.2%, first: false)
[Collision Detection] Calling Gemini API...
[Collision Detection] CRITICAL: Person approaching from front...
```

## Common Issues & Fixes

### Issue 1: No logs appear when clicking button
**Problem**: Hook not initializing
**Check**:
- Is camera ready? (green dot should be lit)
- Check browser console for errors
- Verify button changes to orange when clicked

**Fix**: Refresh page and try again

### Issue 2: Button activates but no analysis logs
**Problem**: Frame capture failing
**Check**:
```javascript
// In console, type:
document.querySelector('video').readyState
// Should return 4 (HAVE_ENOUGH_DATA)
```

**Fix**: Wait for camera to fully load (green "Live" indicator)

### Issue 3: "Frame change too small" messages
**Problem**: Scene is static
**Action**: 
- Move camera around
- Wave hand in front
- Walk in view
- This is normal for static scenes!

### Issue 4: API calls but no alerts
**Problem**: Response parsing failing
**Check console for**:
```
[Collision Detection] Gemini response: <check the actual response>
[Collision Detection] Final result: <check hasRisk value>
```

**Debug**:
- If severity is always "safe", Gemini might not detect objects
- Try pointing at obvious objects (people, cars)
- Ensure good lighting

### Issue 5: Alerts not speaking
**Problem**: TTS not working
**Check**:
- Is volume up?
- Are other voice features working?
- Check: `handleCollisionAlert` is being called

**Test manually in console**:
```javascript
// Type this in console:
window.speechSynthesis.speak(new SpeechSynthesisUtterance("Test alert"))
```

## Manual Testing Commands

### Test the detection function directly:
```javascript
// In browser console:

// 1. Capture current frame
const video = document.querySelector('video');
const canvas = document.createElement('canvas');
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;
const ctx = canvas.getContext('2d');
ctx.drawImage(video, 0, 0);
const imageData = canvas.toDataURL('image/jpeg', 0.6);

// 2. Test detection (requires importing the function)
// This will be available if you expose it in window for debugging
```

## Enabling Debug Mode

### Add to App.tsx (temporary):
```typescript
// After the useCollisionDetection hook:
useEffect(() => {
  if (isCollisionDetectionActive) {
    console.log('[DEBUG] Collision detection state:', {
      isEnabled: isCollisionDetectionActive,
      isCameraReady,
      isDetecting: isDetectingCollision,
      lastAlert
    });
  }
}, [isCollisionDetectionActive, isCameraReady, isDetectingCollision, lastAlert]);
```

## Expected Behavior Timeline

### When you click "Collision Alert OFF" button:

**T+0ms**: Button clicked
```
Button turns orange
Text changes to "🟢 Collision Alert ON"
```

**T+100ms**: Hook activates
```
[Collision Detection] Starting collision detection
```

**T+200ms**: First frame captured
```
[Collision Detection] Analyzing frame (change: 0.0%, first: true)
```

**T+300ms**: API call starts
```
[Collision Detection] Calling Gemini API...
```

**T+2000ms**: API responds (typical)
```
[Collision Detection] Gemini response: ...
[Collision Detection] Final result: ...
```

**T+2100ms**: Alert triggered (if risk detected)
```
[Collision Detection] CRITICAL: ...
[Voice speaks]: "ALERT! Person approaching..."
```

**T+4000ms**: Next check begins
```
[Collision Detection] Analyzing frame (change: 12.3%, first: false)
```

## Performance Monitoring

### Check API timing:
```javascript
// Time each API call
console.time('collision-detection');
// ... API call happens ...
console.timeEnd('collision-detection');
// Should show: collision-detection: 1500ms (typical)
```

### Monitor frame rate:
```javascript
// Count checks per minute
let checkCount = 0;
setInterval(() => {
  console.log(`Checks in last minute: ${checkCount}`);
  checkCount = 0;
}, 60000);

// Increment in checkForCollision
checkCount++;
```

## Network Tab Debugging

1. Open DevTools → Network tab
2. Filter: "gemini" or "gen"
3. Click on request when it appears
4. Check:
   - **Status**: Should be 200
   - **Response**: Check the actual JSON/text
   - **Time**: Should be 1-3 seconds

## Quick Fixes

### If nothing works:
1. **Hard refresh**: Ctrl+Shift+R
2. **Clear cache**: DevTools → Application → Clear storage
3. **Restart dev server**: Ctrl+C, then `npm run dev`
4. **Check API key**: Verify VITE_GEMINI_API_KEY in .env.local

### If alerts are too slow:
```typescript
// In useCollisionDetection.ts, line 21:
checkInterval = 1500 // Reduce from 2000 to 1500
```

### If too many false alerts:
```typescript
// In useCollisionDetection.ts, line 102:
if (frameChange < 25 && lastAlert?.severity === 'safe') {
  // Increase from 15 to 25
```

## Verify Integration

### Checklist:
- [ ] `useCollisionDetection` hook imported in App.tsx
- [ ] `detectCollisionRisk` function exists in geminiService.ts
- [ ] Toggle button renders correctly
- [ ] `handleCollisionAlert` callback defined
- [ ] Visual alert display renders when `lastAlert` has data
- [ ] Camera permissions granted
- [ ] HTTPS enabled (required for camera on mobile)

## Mobile Testing

### Chrome Remote Debugging:
1. Connect phone via USB
2. Enable USB debugging on phone
3. Open `chrome://inspect` on computer
4. Click "Inspect" under your device
5. Watch console logs in real-time

### Expected on Mobile:
- Slower API responses (network)
- Higher battery usage
- May need to keep screen on
- Ensure app stays in foreground

## Success Indicators

✅ **Working correctly when you see**:
- Button turns orange on click
- Console shows "Starting collision detection"
- "Analyzing frame" appears every 2 seconds
- Gemini API calls succeed (200 status)
- Alerts speak when objects detected
- Visual alert box appears (red/yellow)
- "Scanning..." badge shows during analysis

❌ **Not working if**:
- No console logs at all
- Button stays gray
- "Frame capture failed" errors
- API errors (401, 429, 500)
- No speech output
- No visual alerts

## Contact Support

If still not working after trying all fixes:
1. Copy all console logs
2. Take screenshot of Network tab
3. Note: Browser version, OS, camera type
4. Share error messages

## Pro Tips

- **Test in good lighting** - AI detection works better
- **Use clear backgrounds** - Less noise = better detection
- **Point at obvious objects first** - Test with people/cars you can see
- **Wait for "Live" indicator** - Don't activate before camera ready
- **Check every 2 seconds** - Be patient, it's not instant
- **Move the camera** - Static scenes won't trigger alerts
