# Collision Detection - Step-by-Step Testing Guide

## Before You Start

### Prerequisites Checklist:
- [ ] Dev server is running (`npm run dev`)
- [ ] Browser is open (Chrome recommended)
- [ ] Console is open (Press F12)
- [ ] Camera permissions granted
- [ ] Good lighting in room

## Step 1: Check Camera Status

1. **Look at the camera feed**
   - Should see live video
   - Green "Live" indicator should be visible
   - No red error message

2. **In console, type:**
   ```javascript
   const video = document.querySelector('video');
   console.log('Video element:', video);
   console.log('Video ready state:', video?.readyState); // Should be 4
   console.log('Video dimensions:', video?.videoWidth, 'x', video?.videoHeight);
   ```

**Expected:**
```
Video element: <video>
Video ready state: 4
Video dimensions: 640 x 480 (or similar)
```

**If NOT ready (readyState < 4):**
- Wait 5 seconds and check again
- Refresh page if stuck
- Check camera permissions

## Step 2: Activate Collision Detection

1. **Click the "Collision Alert OFF" button**
   - Button should turn orange
   - Text changes to "🟢 Collision Alert ON"

2. **Watch console immediately:**

**Expected console output:**
```
[App] Toggling collision detection. Current state: false
[App] Camera ready: true
[App] VideoRef: <video>
[App] New collision detection state: true
[App] Collision detection state changed: {
  isCollisionDetectionActive: true,
  isCameraReady: true,
  isEnabled: true,
  isDetecting: false,
  videoElement: 'exists'
}
[Collision Detection] Starting collision detection
[Collision Detection] Starting check...
```

**If you see:**
```
[App] WARNING: Camera is not ready! Collision detection may not work.
```
→ **STOP! Camera not ready. Refresh and wait for green "Live" indicator.**

## Step 3: Wait for First Analysis

**Console should show (within 2-3 seconds):**
```
[Collision Detection] Analyzing frame (change: 0.0%, first: true)
[Collision Detection] Calling Gemini API...
```

**Then after 1-3 seconds:**
```
[Collision Detection] Gemini response: SEVERITY: safe
ALERT: Path is clear...
[Collision Detection] Extracted severity: safe
[Collision Detection] Extracted alert: Path is clear...
[Collision Detection] Final result: {hasRisk: false, alert: "...", severity: "safe"}
[Collision Detection] No collision risk detected
[Collision Detection] Check complete, resetting processing flag
```

## Step 4: Test with Static Scene

**Wait 2 more seconds. Console should show:**
```
[Collision Detection] Starting check...
[Collision Detection] Frame change too small (3.2%), skipping analysis
```

✅ **This is CORRECT! Static scenes are skipped to save API calls.**

## Step 5: Test with Movement

### Test A: Wave Your Hand
1. Wave hand in front of camera
2. Console should show:
```
[Collision Detection] Starting check...
[Collision Detection] Analyzing frame (change: 45.8%, first: false)
[Collision Detection] Calling Gemini API...
```

### Test B: Walk Toward Camera
1. Position yourself 10-15 feet away
2. Walk slowly toward camera
3. **Expected:**
```
[Collision Detection] Gemini response: SEVERITY: critical
ALERT: Person walking toward you...
[Collision Detection] CRITICAL: Person walking toward you...
```
4. **Audio:** Should hear "⚠️ ALERT! Person walking toward you..."
5. **Visual:** Red pulsing alert box should appear

### Test C: Point at Object
1. Point camera at a chair, table, or wall
2. **Expected:**
```
[Collision Detection] Gemini response: SEVERITY: warning
ALERT: [Object] ahead at [distance] feet
```
3. **Visual:** Yellow alert box should appear

## Step 6: Continuous Monitoring

**Leave collision detection ON for 30 seconds:**

**Console should show pattern:**
```
[Collision Detection] Starting check...       (T+0s)
[Collision Detection] Analyzing frame...      
[Collision Detection] Check complete...       

(2 second pause)

[Collision Detection] Starting check...       (T+2s)
[Collision Detection] Frame change too small, skipping...
[Collision Detection] Check complete...

(2 second pause)

[Collision Detection] Starting check...       (T+4s)
...continues every 2 seconds...
```

## Troubleshooting by Symptom

### Symptom: No console logs after clicking button

**Diagnosis:**
```javascript
// In console:
console.log(document.querySelector('video')?.readyState);
```

**Fix:**
- If < 4: Wait for camera to load
- If null: Refresh page
- Check green "Live" indicator

### Symptom: "Already processing, skipping check" repeating

**Problem:** Previous check got stuck

**Fix:**
```javascript
// In console, force reset:
location.reload();
```

### Symptom: API calls but always "safe"

**Problem:** Gemini not detecting objects

**Test:**
1. Point camera directly at your face (close up)
2. If still "safe", check console for actual Gemini response:
```
[Collision Detection] Gemini response: <copy this text>
```
3. Share this response for debugging

### Symptom: "Frame change too small" always

**Problem:** Camera is static

**This is NORMAL!** Try:
- Move camera
- Wave hand
- Walk in front
- Point at different objects

### Symptom: Errors in console

**Common errors:**

1. **"API timeout after 10 seconds"**
   - Network issue or API slow
   - Check internet connection
   - Try again

2. **"Failed to capture frame"**
   - Camera not ready
   - Refresh page
   - Check permissions

3. **"Cannot read property 'videoWidth' of null"**
   - VideoRef is null
   - Camera not mounted
   - Hard refresh (Ctrl+Shift+R)

## Manual Testing Commands

### Force a check immediately:
```javascript
// Note: forceCheck might not be exposed, so toggle instead:
// Click button OFF then ON again
```

### Count checks in last 60 seconds:
```javascript
let checkCount = 0;
let startTime = Date.now();

const originalLog = console.log;
console.log = (...args) => {
  if (args[0]?.includes('[Collision Detection] Starting check')) {
    checkCount++;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    originalLog(`✓ Check #${checkCount} at ${elapsed}s`, ...args);
  } else {
    originalLog(...args);
  }
};

// After 60 seconds, check count:
setTimeout(() => {
  console.log(`Total checks in 60s: ${checkCount} (expected: ~30)`);
  console.log = originalLog;
}, 60000);
```

### Check current state:
```javascript
// Type in console:
const video = document.querySelector('video');
console.log({
  videoExists: !!video,
  videoReady: video?.readyState === 4,
  videoPlaying: !video?.paused,
  videoDimensions: `${video?.videoWidth}x${video?.videoHeight}`
});
```

## Success Criteria

✅ **Collision detection is working if:**
1. Button turns orange when clicked
2. Console shows "Starting collision detection"
3. First check happens immediately (within 1 second)
4. "Analyzing frame" appears with API call
5. Gemini response received (1-3 seconds)
6. Result logged: critical/warning/safe
7. Subsequent checks every 2 seconds
8. Movement triggers new analysis
9. Visual alert appears for critical/warning
10. Audio alert speaks for critical

❌ **NOT working if:**
1. No console logs at all
2. "Camera not ready" warning
3. No "Analyzing frame" messages
4. No Gemini API calls
5. Checks stop after first one
6. No alerts when walking toward camera

## Real-World Test Scenarios

### Scenario 1: Empty Hallway
1. Point camera at empty hallway
2. **Expected:** "SAFE: Path clear"
3. **Console:** Checks every 2s, skips after first "safe"

### Scenario 2: Person Approaching
1. Have friend walk toward you from 15 feet
2. **Expected:** "CRITICAL: Person approaching from front, X feet"
3. **Audio:** Immediate alert
4. **Visual:** Red pulsing box

### Scenario 3: Parked Car
1. Point at parked car
2. **Expected:** "WARNING: Vehicle ahead at X feet"
3. **Audio:** Queued alert
4. **Visual:** Yellow box

### Scenario 4: Moving Around
1. Walk around room with camera
2. **Expected:** Multiple alerts for furniture, walls, people
3. **Console:** "Analyzing frame" whenever scene changes >15%

## Performance Benchmarks

### Expected Timing:
- Button click → First log: < 100ms
- First log → API call: < 500ms
- API call → Response: 1-3 seconds
- Check interval: Exactly 2 seconds ±100ms
- Frame skip decision: < 50ms

### Expected API Usage:
- Static scene: 1 call, then skipped
- Moving scene: ~30 calls per minute
- Continuous movement: Up to 30 calls/min

## Logs to Share if Not Working

If still not working, share these logs:

1. **Initial state:**
```javascript
console.log({
  cameraReady: <value>,
  videoElement: <exists/null>,
  collisionActive: <value>
});
```

2. **First 10 seconds of console logs** (copy/paste all)

3. **Network tab:**
   - Filter: "gen" or "gemini"
   - Check if API calls are going through
   - Status codes (should be 200)

4. **Gemini response example:**
   - Copy one full "[Collision Detection] Gemini response: ..." log

## Next Steps After Testing

### If Working:
- Deploy to production
- Test on mobile device
- Test in various environments
- Share success!

### If Not Working:
- Share console logs above
- Describe specific symptom
- Check Network tab for errors
- Try hard refresh (Ctrl+Shift+R)

## Quick Checklist

Before reporting "not working", verify:
- [ ] Camera shows green "Live" indicator
- [ ] Button turned orange when clicked
- [ ] Console shows "Starting collision detection"
- [ ] Waited at least 5 seconds after activation
- [ ] Tried moving camera or waving hand
- [ ] Checked Network tab for API errors
- [ ] No errors in console (red text)
- [ ] Video element exists and ready (readyState=4)
