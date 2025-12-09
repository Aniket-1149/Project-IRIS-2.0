# Collision Detection & Alert System

## Overview

The collision detection system monitors the camera feed in real-time to detect approaching objects and potential collision risks. It alerts users about:
- **People** walking toward the user
- **Vehicles** (cars, bikes, motorcycles) approaching
- **Fast-moving objects** in the path
- **Sudden changes** in the environment

## Features

### 1. **Real-Time Monitoring**
- Continuously analyzes video frames every 2 seconds
- Detects frame changes to identify sudden movements
- Uses AI to classify objects and assess collision risk

### 2. **Smart Frame Analysis**
- **Frame Differencing**: Compares consecutive frames to detect movement
- **Change Threshold**: Only analyzes when frame change >15% (optimizes API usage)
- **Intelligent Sampling**: Reduces processing load while maintaining safety

### 3. **Three-Level Alert System**

#### 🚨 **CRITICAL (Immediate Danger)**
- Objects within 10 feet and approaching
- Fast-moving vehicles heading toward user
- People crossing path
- **Action**: Interrupts current speech, immediate alert

#### ⚠️ **WARNING (Potential Danger)**
- Objects 10-15 feet away
- Stationary obstacles in path
- Nearby people (not moving toward)
- **Action**: Queued alert after current speech

#### ✅ **SAFE (No Risk)**
- Objects 20+ feet away
- People/vehicles moving away
- Background objects
- **Action**: No alert

### 4. **Cooldown System**
- **Critical alerts**: Can repeat every 3 seconds
- **Warning alerts**: Repeat every 10 seconds
- **Prevents alert spam** while maintaining safety

## Technical Implementation

### Files Created

**1. hooks/useCollisionDetection.ts**
- Main collision detection hook
- Frame capture and comparison
- Alert cooldown management
- Periodic checking with configurable interval

**2. services/geminiService.ts - detectCollisionRisk()**
- AI-powered collision risk analysis
- JSON response parsing
- Fallback text analysis
- Returns: severity, alert message, detected objects

### Integration in App.tsx

```typescript
// State
const [isCollisionDetectionActive, setIsCollisionDetectionActive] = useState(false);

// Alert handler
const handleCollisionAlert = useCallback((alert: string, severity) => {
  if (severity === 'critical') {
    cancel(); // Stop current speech
    speak(`⚠️ ALERT! ${alert}`); // Immediate alert
  } else {
    speak(alert); // Queued alert
  }
}, [speak, cancel]);

// Hook usage
const { isDetecting, lastAlert, forceCheck } = useCollisionDetection({
  videoRef,
  isEnabled: isCollisionDetectionActive && isCameraReady,
  onAlert: handleCollisionAlert,
  checkInterval: 2000 // 2 seconds
});
```

## User Interface

### Toggle Button
- **Location**: Below voice control button
- **States**:
  - OFF: Gray button, "Collision Alert OFF"
  - ON: Orange button, "🟢 Collision Alert ON"
  - SCANNING: Shows "Scanning..." badge

### Alert Display
- **Location**: Below voice control section
- **Critical Alert**: Red background, pulse animation, "🚨 COLLISION WARNING"
- **Warning Alert**: Yellow background, "⚠️ CAUTION"
- **Details**: Shows distance, direction, object type

## Usage

### Activating Collision Detection

1. **Click "Collision Alert OFF" button**
2. System activates: "Collision detection activated"
3. Button turns orange: "🟢 Collision Alert ON"
4. Starts monitoring every 2 seconds

### When Alert Triggers

**Critical Alert Example:**
```
🚨 COLLISION WARNING
ALERT! Person approaching from front, 8 feet away!
[Speech immediately interrupts and announces]
```

**Warning Alert Example:**
```
⚠️ CAUTION
Caution: Car parked ahead, 12 feet in your path.
[Speech queued after current announcement]
```

### Deactivating

1. **Click "🟢 Collision Alert ON" button**
2. System deactivates: "Collision detection deactivated"
3. Button returns to gray

## Performance Optimization

### Frame Analysis
- Only analyzes on significant change (>15%)
- Skips analysis if previous alert was "safe" and no movement
- Sample-based pixel comparison for speed

### API Usage
- Checks every 2 seconds (configurable)
- Smart throttling based on frame change
- Typical usage: ~30 API calls per minute during active movement

### Alert Management
- Cooldown prevents duplicate alerts
- Priority system ensures critical alerts always get through
- Visual indicators reduce need for repeated audio alerts

## Configuration Options

### In useCollisionDetection Hook

```typescript
{
  videoRef: React.RefObject<HTMLVideoElement>;
  isEnabled: boolean;
  onAlert: (alert: string, severity: 'critical' | 'warning' | 'safe') => void;
  checkInterval?: number; // Default: 2000ms
}
```

### Customization Points

**Adjust check frequency:**
```typescript
checkInterval: 3000 // Check every 3 seconds instead of 2
```

**Modify frame change threshold:**
```typescript
// In useCollisionDetection.ts, line 76
if (frameChange < 20 && lastAlert?.severity === 'safe') {
  // Increase from 15% to 20% for less sensitive detection
```

**Change cooldown periods:**
```typescript
// In useCollisionDetection.ts, line 51
const cooldownPeriod = severity === 'critical' 
  ? 5000  // 5 seconds instead of 3
  : severity === 'warning' 
  ? 15000 // 15 seconds instead of 10
  : 999999;
```

## Testing

### Test Scenarios

**1. Approaching Person**
- Have someone walk toward camera
- Expected: Critical alert at ~8-10 feet
- Alert should interrupt speech

**2. Parked Vehicle**
- Point camera at parked car in path
- Expected: Warning alert
- Alert queued after speech

**3. Passing Vehicle**
- Film vehicle moving across view
- Expected: Warning or safe depending on distance
- May not alert if moving away

**4. Stationary Scene**
- Point at empty hallway
- Expected: "Clear ahead, no obstacles detected"
- Should only check once, then skip until movement

### Console Logging

Monitor browser console for:
```
[Collision Detection] Starting collision detection
[Collision Detection] Analyzing frame (change: 23.4%)
[Collision Detection] CRITICAL: ALERT! Person approaching...
[Collision Detection] Frame change too small (8.2%), skipping
```

### Mobile Testing

1. Deploy with HTTPS (PWA requirement)
2. Install PWA on mobile
3. Enable collision detection
4. Walk around outdoors
5. Test with moving people/vehicles
6. Verify alerts are spoken immediately

## Known Limitations

1. **Requires good lighting**: Poor lighting reduces detection accuracy
2. **API latency**: ~1-2 seconds delay from detection to alert
3. **Static images only**: Cannot detect motion directly (uses frame comparison)
4. **Battery usage**: Continuous checking drains battery faster
5. **Network required**: Needs internet for AI analysis

## Future Enhancements

### Potential Improvements

1. **On-device detection**: Use TensorFlow.js for offline detection
2. **Distance estimation**: Use depth sensors or stereo vision
3. **Motion vectors**: Track object trajectories
4. **Sound alerts**: Different tones for different severity levels
5. **Haptic feedback**: Vibration patterns for critical alerts
6. **Object tracking**: Follow objects across frames
7. **Pedestrian crossing detection**: Identify crosswalks and traffic
8. **Vehicle speed estimation**: Calculate approach speed

### Hardware Integration

- **Ultrasonic sensors**: Direct distance measurement
- **LiDAR**: Precise 3D mapping
- **IMU**: Detect user movement vs object movement
- **GPS**: Location-based hazard warnings

## Troubleshooting

### Issue: No alerts when objects present
**Solution**: 
- Check camera permissions
- Verify good lighting
- Check console for errors
- Increase check frequency

### Issue: Too many false alerts
**Solution**:
- Increase frame change threshold (15% → 25%)
- Increase cooldown periods
- Reduce check frequency

### Issue: Alerts too slow
**Solution**:
- Decrease checkInterval (2000ms → 1500ms)
- Check network connection
- Reduce image quality for faster processing

### Issue: Battery draining quickly
**Solution**:
- Increase checkInterval (2000ms → 3000ms)
- Only activate when needed
- Use mobile-optimized settings

## API Reference

### detectCollisionRisk(imageData: string)

**Returns:**
```typescript
{
  hasRisk: boolean;
  alert: string;
  severity: 'critical' | 'warning' | 'safe';
  objects: Array<{
    type: string;      // 'person', 'car', 'bike', etc.
    distance: string;  // '8 feet', '15 feet'
    direction: string; // 'front', 'left', 'right'
  }>;
}
```

**Example Response:**
```json
{
  "severity": "critical",
  "objects": [
    {
      "type": "person",
      "distance": "8 feet",
      "direction": "front",
      "moving": "toward you"
    }
  ],
  "alert": "ALERT! Person approaching from front, 8 feet away!"
}
```

## Safety Considerations

⚠️ **IMPORTANT**: This system is an **assistive tool**, not a replacement for:
- Guide dogs
- White canes
- Human assistance
- Personal awareness

**Always use in combination with other navigation aids!**

### Recommendations

1. **Start indoors** to familiarize yourself with alerts
2. **Test in safe environment** before outdoor use
3. **Keep volume appropriate** for hearing ambient sounds
4. **Don't rely solely** on collision detection
5. **Use with other aids** (cane, guide dog, etc.)

## License & Credits

Part of Project IRIS - Vision Assistant for Visually Impaired
Powered by Google Gemini AI
Built with React + TypeScript
