


import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PersonalItem } from "./personalDB";
import { GeminiContent, AppState, ActionType } from "../types";

// ✅ Use Vite env variable instead of process.env
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey });
const visionModel = 'gemini-2.5-flash';
const fastModel = 'gemini-2.5-flash';

const fileToGenerativePart = (imageData: string) => {
  const base64Data = imageData.split(',')[1];
  const mimeType = imageData.substring(imageData.indexOf(":") + 1, imageData.indexOf(";"));
  return { inlineData: { data: base64Data, mimeType } };
};

const generatePersonalItemsPreamble = (personalItems: PersonalItem[]) => {
    const preamble = {
        role: 'user' as const,
        parts: [{ text: "You have a memory of personal items. Before analyzing the main image, review these items. If you see them, refer to them by their given name." }]
    };
    personalItems.forEach(item => {
        preamble.parts.push({ text: `This is "${item.name}".` });
        preamble.parts.push(fileToGenerativePart(item.imageData) as any);
    });
    return preamble;
}

async function callVisionModel(
    prompt: string, 
    imageData: string, 
    personalItems: PersonalItem[] = [],
    history: GeminiContent[] = []
): Promise<{ text: string; history: GeminiContent[] }> {
    const MAX_RETRIES = 3;
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const userParts = [{ text: prompt }, fileToGenerativePart(imageData)];
            const newUserContent: GeminiContent = { role: 'user', parts: userParts as any };
            
            let contents = [...history];
            if (personalItems.length > 0) {
                contents.unshift(generatePersonalItemsPreamble(personalItems));
            }
            contents.push(newUserContent);

            const response = await ai.models.generateContent({
                model: visionModel,
                contents: contents,
            });

            const responseText = response.text?.trim() ?? "I'm sorry, I couldn't analyze the image. The response was empty.";
            const newHistory: GeminiContent[] = [
                ...history,
                newUserContent,
                { role: 'model', parts: [{ text: responseText }] }
            ];

            return { text: responseText, history: newHistory };

        } catch (error: any) {
            console.error(`Error calling Gemini API (attempt ${i + 1}/${MAX_RETRIES}):`, error);
            if (i === MAX_RETRIES - 1) {
                // Last attempt failed, return error
                const errorMessage = error.message?.includes('503') || error.message?.includes('UNAVAILABLE')
                    ? "The AI model is currently overloaded. Please try again in a moment."
                    : (error instanceof Error ? `API Error: ${error.message}` : "An unknown API error occurred.");
                return { text: errorMessage, history };
            }
            // Wait before retrying
            const delay = Math.pow(2, i) * 1000; // Exponential backoff: 1s, 2s, 4s
            await new Promise(res => setTimeout(res, delay));
        }
    }
    // This part should not be reachable, but as a fallback:
    return { text: "An unexpected error occurred after multiple retries.", history };
}


export const interpretCommand = async (
  transcript: string,
  personalItemNames: string[],
  appState: AppState
): Promise<{ action: ActionType; payload?: any }> => {

  const isManaging = appState === AppState.MANAGING_ITEMS;
  const availableActions = isManaging
    ? `['DELETE_ITEM', 'CLOSE_MANAGEMENT', 'HELP', 'STOP', 'UNKNOWN']`
    : `['DESCRIBE_SCENE', 'READ_TEXT', 'IDENTIFY_PEOPLE', 'CHECK_HAZARDS', 'ANALYZE_TERRAIN', 'LIVE_COMMENTARY', 'SAVE_ITEM', 'MANAGE_ITEMS', 'FIND_ITEM', 'ASK_QUESTION', 'HELP', 'STOP', 'UNKNOWN']`;
  const itemContext = personalItemNames.length > 0 ? `The user has saved these items: [${personalItemNames.join(', ')}].` : '';

  const systemInstruction = `You are an AI command interpreter for a voice-controlled accessibility app. Your one and only job is to convert a user's voice transcript into a single, valid JSON object.

**Instructions:**
1.  **Analyze the transcript** to determine the user's intent.
2.  **Choose an action** from the available list: ${availableActions}.
3.  **Extract payloads** if necessary:
    - If the action is \`FIND_ITEM\` or \`DELETE_ITEM\`, extract the item's name into the \`itemName\` payload.
    - If the action is \`ASK_GEMINI\`, extract the user's full question into the \`query\` payload.
4.  **Handle ambiguity:** If the intent is unclear or doesn't match any action, you MUST return \`{ "action": "UNKNOWN" }\`.
5.  **Output ONLY JSON.** Do not include any other text, markdown, or explanations.

**Examples:**
- Transcript: "describe the scene" -> \`{ "action": "DESCRIBE_SCENE" }\`
- Transcript: "find my keys" -> \`{ "action": "FIND_ITEM", "payload": { "itemName": "keys" } }\`
- Transcript: "ask Gemini what is the weather today" -> \`{ "action": "ASK_GEMINI", "payload": { "query": "what is the weather today" } }\`
- Transcript: "what's on the table" -> \`{ "action": "DESCRIBE_SCENE" }\`
- Transcript: "start live commentary" -> \`{ "action": "LIVE_COMMENTARY" }\`
- Transcript: "analyze terrain" or "check the ground" or "what's the surface" -> \`{ "action": "ANALYZE_TERRAIN" }\`
- Transcript: "banana" -> \`{ "action": "UNKNOWN" }\`

${itemContext}`;

  const commandSchema = {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: Object.values(ActionType),
      },
      payload: {
        type: Type.OBJECT,
        properties: {
          itemName: {
            type: Type.STRING,
            description: "The name of the item to find or delete.",
          },
          query: {
            type: Type.STRING,
            description: "The user's full question for the ASK_GEMINI action.",
          },
        },
        nullable: true,
      },
    },
    required: ['action'],
  };

  try {
    const response = await ai.models.generateContent({
      model: fastModel,
      contents: transcript,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: commandSchema,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const jsonText = response.text?.trim();
    if (!jsonText) {
      return { action: ActionType.UNKNOWN };
    }
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error interpreting command:", error);
    // If parsing fails or API errors out, return UNKNOWN to be handled gracefully.
    return { action: ActionType.UNKNOWN };
  }
};


// Internal helper function to get terrain context for all vision functions
const getTerrainContext = async (imageData: string): Promise<string> => {
    const prompt = `You are an AI terrain analyzer for a visually impaired person. Analyze the ground surface and immediate environment.

Identify in order of priority:
1. Ground type: road/pavement, grass, dirt, gravel, uneven/hilly terrain
2. Immediate obstacles: potholes, stairs, curbs, debris on path
3. Vehicles nearby: cars, bikes, motorcycles with distance
4. Path safety: clear, obstructed, requires caution

Respond in 1-2 concise sentences.
Example: "Normal paved road, slightly upward slope. Car parked 10 feet right, path clear ahead."`;

    try {
        const userParts = [{ text: prompt }, fileToGenerativePart(imageData)];
        const contents: GeminiContent[] = [{ role: 'user', parts: userParts as any }];
        
        const response = await ai.models.generateContent({
            model: fastModel, // Use fast model for quick terrain assessment
            contents: contents,
            config: {
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        return response.text?.trim() || "";
    } catch (error) {
        console.error("Error analyzing terrain:", error);
        return "";
    }
};

export const analyzeTerrain = async (imageData: string): Promise<string> => {
    const terrainInfo = await getTerrainContext(imageData);
    return terrainInfo || "Unable to assess terrain at this moment.";
};

export const describeScene = async (imageData: string, personalItems: PersonalItem[]) => {
    // First, analyze the terrain - this is foundational for all vision analysis
    const terrainInfo = await getTerrainContext(imageData);
    
    const prompt = `You are an AI assistant for a visually impaired person, acting as their eyes.

TERRAIN CONTEXT: ${terrainInfo}

Your response MUST start with the terrain information, then describe objects and environment.

Structure your response:
1. **Start with terrain:** "${terrainInfo}" (restate this clearly)
2. **Then describe objects with distance and direction:**
   - Key objects with estimated distance in feet (REQUIRED)
   - Clear direction: "in front of you", "to your left", "on your right"
   - Example: "There is a tree 2-3 feet away on your left"
3. **Mention people:** Location, distance, activity (if present)
4. **Personal items:** If you see saved items, mention by name with location
5. **Additional obstacles:** Any other obstructions

Respond naturally in narrative form. Start with terrain, then continue to objects. Be clear and concise.`;
    return callVisionModel(prompt, imageData, personalItems);
};

export const askGemini = async (query: string): Promise<string> => {
    const prompt = `You are a helpful AI assistant. The user has asked the following question: "${query}".
Answer it concisely and directly.`;

    try {
        const response = await ai.models.generateContent({
            model: fastModel,
            contents: prompt,
        });
        return response.text?.trim() || "Sorry, I could not find an answer to that.";
    } catch (error) {
        console.error("Error calling Gemini for text query:", error);
        const errorMessage = error instanceof Error ? `API Error: ${error.message}` : "An unknown API error occurred.";
        return errorMessage;
    }
};

export const askFollowUpQuestion = async (imageData: string, history: GeminiContent[], question: string) => {
    const prompt = `The user has a follow-up question: "${question}"

Answer based on the image and conversation history. Always consider terrain context when relevant. Be concise and include distances for objects.`;
    // The history already contains terrain and personal items context from initial analysis
    return callVisionModel(prompt, imageData, [], history);
};

export const readTextFromImage = async (imageData: string) => {
    // Get terrain context first for situational awareness
    const terrainInfo = await getTerrainContext(imageData);
    
    const prompt = `You are an AI assistant for a visually impaired person.

TERRAIN CONTEXT: ${terrainInfo}

Task: Read all visible text from top to bottom, left to right.

Response format:
1. First state: "${terrainInfo}"
2. Then: "I can see the following text:" followed by the text
3. If no text: "${terrainInfo}. No text detected."

Start with terrain context, then read text. Be thorough.`;
    return callVisionModel(prompt, imageData, []);
};

export const identifyPeople = async (imageData: string, personalItems: PersonalItem[]) => {
    // First, get terrain context
    const terrainInfo = await getTerrainContext(imageData);
    
    const prompt = `You are an AI assistant for a visually impaired person, specializing in person identification.

TERRAIN CONTEXT: ${terrainInfo}

**CRITICAL INSTRUCTIONS:** 
1. **Start with terrain:** "${terrainInfo}"
2. **Then identify people with extreme accuracy** - Better to say "unknown" than guess incorrectly

**Process:**
1. First mention the terrain/environment
2. Then analyze for people:
   - Compare to saved personal items (only name if 99%+ certain match)
   - Otherwise refer as "unknown person"
3. For each person provide:
   - Location and distance in feet (e.g., "10 feet in front of you")
   - Age estimate, gender, clothing, activity
4. If no people: Say "No people detected" after terrain info

**Example response:**
"${terrainInfo}. I see two people. In front of you, about 8 feet away, is an unknown person who appears to be a man in his 20s, wearing a blue shirt. To your right, I see Jane Doe, sitting on the couch about 6 feet away."

Start with terrain, then describe people. Be cautious with identification.`;
    return callVisionModel(prompt, imageData, personalItems);
};

export const checkForHazards = async (imageData: string) => {
    // Get terrain context first - critical for hazard assessment
    const terrainInfo = await getTerrainContext(imageData);
    
    const prompt = `You are an AI safety assistant for a visually impaired person.

TERRAIN CONTEXT: ${terrainInfo}

Analyze for hazards in priority order:

**Priority 1 - TERRAIN HAZARDS:**
- Potholes, cracks, uneven pavement (location + distance in feet)
- Stairs/steps (up/down, distance)
- Slopes, curbs, drop-offs
- Wet/slippery surfaces
- Unstable ground

**Priority 2 - OBSTACLE HAZARDS:**
- Vehicles in path (cars, bikes, distance)
- Ground debris (rocks, trash)
- Tripping hazards (cords, rugs)
- Head-level obstacles (branches)

**Priority 3 - INDOOR HAZARDS:**
- Spills, open doors/cabinets
- Sharp furniture corners

**Response format:**
- Start with terrain assessment: "${terrainInfo}"
- If hazards detected: "Warning! [hazard type] at [distance] feet [direction]. [action to avoid]"
- If safe: "The path ahead looks clear."

Examples:
"Normal paved road. Warning! Pothole directly ahead at 4 feet. Step to your left."
"Grass path. Warning! Stairs going down in 6 feet. Handrail on your right."
"Road ahead. The path looks clear."

Start with terrain, then warn about hazards with specific distances and directions.`;
    return callVisionModel(prompt, imageData, []);
};

export const getQuickFrameDescription = async (imageData: string, personalItems: PersonalItem[]): Promise<string> => {
    const prompt = `You are an AI providing live commentary for a visually impaired person.

ALWAYS start by identifying terrain/surface, then mention objects.

PRIORITY ORDER:
1. **Terrain first:** Road, grass, stairs, slope, surface condition
2. **Vehicles:** Cars, bikes with distance
3. **Obstacles:** Immediate path hazards
4. **Objects/People:** With distance in feet

Format: "Terrain type, object/person X feet direction"

Examples: 
- "Road ahead, tree 2-3 feet right"
- "Grass path, person 10 feet ahead"
- "Stairs up in 5 feet, handrail left"
- "Paved road, car 12 feet right"

Mention saved personal items by name if visible.
Be extremely concise (1-2 sentences max). Always include distances.`;

    try {
        const userParts = [{ text: prompt }, fileToGenerativePart(imageData)];
        const newUserContent: GeminiContent = { role: 'user', parts: userParts as any };

        let contents: GeminiContent[] = [];
        if (personalItems.length > 0) {
            contents.unshift(generatePersonalItemsPreamble(personalItems));
        }
        contents.push(newUserContent);
        
        const response = await ai.models.generateContent({
            model: fastModel, 
            contents: contents,
            config: {
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        return response.text?.trim() || "";
        
    } catch (error) {
        console.error("Error in getQuickFrameDescription:", error);
        return ""; 
    }
}

export const findObject = async (imageData: string, objectName: string, personalItems: PersonalItem[]): Promise<string> => {
    // Get terrain context for better spatial awareness
    const terrainInfo = await getTerrainContext(imageData);
    
    const prompt = `You are an AI assistant helping a visually impaired user find '${objectName}'.

TERRAIN CONTEXT: ${terrainInfo}

Task: Locate '${objectName}' in the image.

Response format:
- If found: "I see your ${objectName} at [distance] feet [direction]. ${terrainInfo}"
- If not found: "I don't see it here. ${terrainInfo}"
- If unsure: "I see something that could be it at [distance] feet [direction]."

Always include distance and direction. Mention terrain for context.`;
    const { text } = await callVisionModel(prompt, imageData, personalItems);
    return text;
};

export const detectCollisionRisk = async (imageData: string): Promise<{ 
    hasRisk: boolean; 
    alert: string; 
    severity: 'critical' | 'warning' | 'safe';
    objects: Array<{ type: string; distance: string; direction: string }>;
}> => {
    const prompt = `COLLISION DETECTION FOR BLIND PERSON - CRITICAL SAFETY!

Look at this camera image carefully. Describe EVERYTHING you see:

1. Is there a PERSON visible? (face, body, hands, legs - ANY part)
2. Is there a VEHICLE? (car, bike, motorcycle, scooter)  
3. Are there OBJECTS? (furniture, walls, doors, boxes, anything)
4. How CLOSE are they? (estimate in feet: 5, 10, 15, 20, 25)

RULES:
- If you see a PERSON at ANY distance → respond "critical"
- If you see a VEHICLE at ANY distance → respond "critical"  
- If you see FURNITURE/OBJECTS close (under 15 feet) → respond "warning"
- If you see WALLS/BACKGROUND only → respond "warning"
- ONLY respond "safe" if you see an EMPTY hallway/path with nothing

FORMAT (copy exactly):

SEVERITY: critical
ALERT: I see [WHAT] at approximately [DISTANCE] feet [DIRECTION]

Examples:
SEVERITY: critical
ALERT: I see a person's face at approximately 5 feet in front of camera

SEVERITY: critical  
ALERT: I see a person standing at approximately 10 feet ahead

SEVERITY: warning
ALERT: I see a wall at approximately 8 feet ahead

SEVERITY: warning
ALERT: I see furniture (chair/table) at approximately 10 feet

SEVERITY: safe
ALERT: Empty corridor, no people or objects detected

BE SPECIFIC: Mention if you see hands, face, body, clothing, furniture, walls - describe what you actually see!`;

    console.log('[Collision Detection] Calling Gemini API...');
    const { text } = await callVisionModel(prompt, imageData);
    console.log('[Collision Detection] Gemini response:', text);
    
    // Parse the structured response
    let severity: 'critical' | 'warning' | 'safe' = 'safe';
    let alert = text;
    
    // Try to extract SEVERITY and ALERT from response
    const severityMatch = text.match(/SEVERITY:\s*(critical|warning|safe)/i);
    const alertMatch = text.match(/ALERT:\s*(.+?)(?:\n|$)/i);
    
    if (severityMatch && severityMatch[1]) {
        severity = severityMatch[1].toLowerCase() as 'critical' | 'warning' | 'safe';
        console.log('[Collision Detection] Extracted severity:', severity);
    }
    
    if (alertMatch && alertMatch[1]) {
        alert = alertMatch[1].trim();
        console.log('[Collision Detection] Extracted alert:', alert);
    }
    
    // Fallback: if structured format not found, analyze the text
    if (!severityMatch || !alertMatch) {
        console.log('[Collision Detection] Structured format not found, analyzing text');
        console.log('[Collision Detection] Full response for analysis:', text);
        const lowerText = text.toLowerCase();
        
        // Check for critical keywords (more aggressive)
        if (lowerText.includes('critical') || 
            lowerText.includes('danger') ||
            lowerText.includes('immediate') ||
            /person.*\d+\s*feet/i.test(text) || 
            /vehicle.*\d+\s*feet/i.test(text) ||
            /person.*ahead/i.test(text) ||
            /person.*path/i.test(text) ||
            /approaching/i.test(text)) {
            severity = 'critical';
            console.log('[Collision Detection] Detected as CRITICAL based on keywords');
        } 
        // Check for warning keywords
        else if (lowerText.includes('warning') || 
                 lowerText.includes('caution') ||
                 lowerText.includes('obstacle') ||
                 lowerText.includes('parked') ||
                 lowerText.includes('wall') ||
                 lowerText.includes('furniture') ||
                 /\d+\s*feet/i.test(text)) {
            severity = 'warning';
            console.log('[Collision Detection] Detected as WARNING based on keywords');
        } 
        // Check for safe keywords
        else if (lowerText.includes('safe') || 
                 lowerText.includes('clear') || 
                 lowerText.includes('empty') ||
                 /no.*obstacle/i.test(text) || 
                 /no.*danger/i.test(text) ||
                 /path.*clear/i.test(text)) {
            severity = 'safe';
            console.log('[Collision Detection] Detected as SAFE based on keywords');
        } 
        // Default to warning if unsure and something is mentioned
        else {
            severity = 'warning';
            console.log('[Collision Detection] Defaulting to WARNING (uncertain)');
        }
        
        // Extract most meaningful line as alert
        const lines = text.split('\n').filter(line => line.trim().length > 10);
        alert = lines[0] || text;
        console.log('[Collision Detection] Using alert text:', alert);
    }
    
    const result = {
        hasRisk: severity !== 'safe',
        alert: alert,
        severity: severity,
        objects: []
    };
    
    console.log('[Collision Detection] Final result:', result);
    return result;
};

export const getHelp = (): string => {
    return `Of course. Here are the main things you can say: 
    'Describe the scene', 
    'Analyze terrain' or 'Check the ground',
    'Read the text', 
    'Identify people', 
    'Check for hazards', 
    'Save this item', 
    'Find my...', followed by the item name,
    'Manage my items',
    'Start live' or 'Stop live'. 
    After describing a scene, you can also ask a follow-up question.`;
};
