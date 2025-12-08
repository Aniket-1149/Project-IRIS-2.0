# Terrain-First Vision System Guide

## Overview
IRIS 2.0 now uses a **terrain-first approach** for ALL vision functions. Every analysis automatically detects terrain and ground conditions FIRST, then continues with object detection. This ensures users always have foundational spatial awareness before receiving detailed scene information.

## Core Architecture

### Integrated Terrain Detection
**ALL vision functions now automatically:**
1. ✅ Detect terrain/surface type FIRST (road, grass, stairs, slopes)
2. ✅ Identify immediate obstacles (potholes, vehicles, debris)
3. ✅ THEN proceed with specific task (scene description, people identification, text reading, etc.)

### What Gets Detected

**Terrain Types:**
- Normal roads/pavement
- Grass paths
- Dirt paths, gravel
- Uneven terrain, hilly/sloped surfaces
- Stairs (up/down)

**Obstacles:**
- Potholes, cracks, curbs, speed bumps
- Vehicles (cars, bikes, motorcycles) with distance
- Debris on path
- Surface hazards

**Environmental Context:**
- Path condition (clear/obstructed)
- Objects with distance (e.g., "tree 2-3 feet away")
- People with location and distance

## How It Works

### Every Function Now Includes Terrain Context

**1. Scene Description** - `describeScene()`
```
Response: "Normal paved road, path clear ahead. I can see a tree 2-3 feet away on your left. 
There is a building 20 feet in front of you."
```

**2. People Identification** - `identifyPeople()`
```
Response: "Grass path, slightly uneven. I see two people. In front of you, 8 feet away, 
is an unknown person in a blue shirt. To your right is Jane, 6 feet away."
```

**3. Hazard Detection** - `checkForHazards()`
```
Response: "Normal paved road. Warning! Pothole at 4 feet directly ahead. Step left to avoid it."
```

**4. Text Reading** - `readTextFromImage()`
```
Response: "Road ahead, clear. I can see the following text: 'Main Street Exit 2 Miles'"
```

**5. Live Commentary** - `getQuickFrameDescription()`
```
Continuous: "Road ahead, tree 3 feet right" → "Grass path, bench 8 feet left" → "Stairs up in 5 feet"
```

**6. Object Finding** - `findObject()`
```
Response: "Normal road. I see your keys at 5 feet ahead on the ground near a bench."
```

## How to Use

### All Commands Now Include Terrain Context

**Standard Commands (terrain automatically included):**
- **"Describe scene"** - Terrain + full scene with objects
- **"Check hazards"** - Terrain + hazard warnings
- **"Identify people"** - Terrain + people identification
- **"Read text"** - Terrain + text content
- **"Start live"** - Continuous terrain-aware commentary
- **"Find my [item]"** - Terrain + item location

**Dedicated Terrain Command:**
- **"Analyze terrain"** - Quick terrain-only assessment

### Button Interface
Every button now provides terrain-first responses:
- **"Describe Scene"** - Terrain + environment
- **"Analyze Terrain"** (Orange) - Terrain only
- **"Check Hazards"** - Terrain + safety warnings
- **"Identify People"** - Terrain + people
- **"Read Text"** - Terrain + text content

## Example Responses

### Scene Description
**Input:** "Describe scene"
**Response:** 
```
"Normal paved road, path clear ahead. I can see a tree 2-3 feet away on your left. 
There is a building 20 feet in front of you. A person is standing near the entrance, 15 feet away."
```

### People Identification
**Input:** "Identify people"
**Response:**
```
"Grass path, slightly uneven surface. I see two people. In front of you, 8 feet away, 
is an unknown person wearing a blue shirt. To your right, Jane is sitting on a bench 6 feet away."
```

### Hazard Detection
**Input:** "Check hazards"
**Response:**
```
"Normal paved road. Warning! Pothole directly ahead at 4 feet. Step to your left to avoid it. 
Car approaching from left side, 20 feet away."
```

### Text Reading
**Input:** "Read text"
**Response:**
```
"Road ahead, clear path. I can see the following text: 'Main Street - Exit 2 Miles - Speed Limit 35'"
```

### Live Commentary
**Input:** "Start live"
**Continuous responses:**
```
"Road ahead, tree 3 feet right"
"Grass path, bench 8 feet left"  
"Stairs up in 5 feet, handrail left"
"Paved road, car parked 12 feet right"
```

### Object Finding
**Input:** "Find my keys"
**Response:**
```
"Normal road. I see your keys at 5 feet ahead on the ground next to a bench."
```

## Technical Implementation

### Core Architecture
```javascript
// Internal helper - called by ALL vision functions
getTerrainContext(imageData) → "Normal road, path clear"

// Every function now calls this first:
describeScene() → getTerrainContext() + scene analysis
identifyPeople() → getTerrainContext() + people detection
checkForHazards() → getTerrainContext() + hazard detection
readTextFromImage() → getTerrainContext() + text OCR
getQuickFrameDescription() → terrain-aware live updates
findObject() → getTerrainContext() + object search
```

### Modified Functions
All 7 vision functions now automatically include terrain:
1. ✅ `describeScene()` - Terrain + environment
2. ✅ `identifyPeople()` - Terrain + people
3. ✅ `checkForHazards()` - Terrain + warnings
4. ✅ `readTextFromImage()` - Terrain + text
5. ✅ `getQuickFrameDescription()` - Terrain + objects
6. ✅ `findObject()` - Terrain + item location
7. ✅ `analyzeTerrain()` - Terrain only (quick)

## Benefits

1. **Always-On Spatial Awareness** - Every response includes ground/terrain context
2. **Safer Navigation** - Know surface type before objects
3. **Consistent Experience** - All functions follow terrain-first pattern
4. **Better Mental Mapping** - Understand "where you are" then "what's there"
5. **Distance-First Communication** - All objects include distance measurements

## Quick Start

### To Test:
```bash
npm run dev
```

1. Click "Start Listening"
2. Try ANY command - all now include terrain:
   - "Describe scene" 
   - "Check hazards"
   - "Identify people"
   - "Read text"
   - "Start live"

3. Notice: Every response starts with terrain/ground info!

### Expected Format:
```
[TERRAIN CONTEXT] + [SPECIFIC TASK RESULT]

Examples:
"Normal paved road. [scene/objects/people/text...]"
"Grass path, slightly uneven. [scene/objects/people...]"
"Stairs going up in 5 feet. Warning! [hazard details...]"
```

## Integration

Terrain detection integrates with ALL existing features:
- ✅ Personal item recognition
- ✅ Live commentary mode  
- ✅ Voice command system
- ✅ Follow-up questions
- ✅ Multi-language support (English & Hindi)
- ✅ All button actions

**No feature works in isolation** - terrain awareness is foundational.
