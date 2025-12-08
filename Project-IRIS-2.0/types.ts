export enum ActionType {
  DESCRIBE_SCENE = 'DESCRIBE_SCENE',
  READ_TEXT = 'READ_TEXT',
  IDENTIFY_PEOPLE = 'IDENTIFY_PEOPLE',
  CHECK_HAZARDS = 'CHECK_HAZARDS',
  ANALYZE_TERRAIN = 'ANALYZE_TERRAIN', // New action for terrain analysis
  LIVE_COMMENTARY = 'LIVE_COMMENTARY',
  SAVE_ITEM = 'SAVE_ITEM',
  MANAGE_ITEMS = 'MANAGE_ITEMS',
  FIND_ITEM = 'FIND_ITEM',
  ASK_QUESTION = 'ASK_QUESTION',
  ASK_GEMINI = 'ASK_GEMINI', // New action for general queries
  HELP = 'HELP',
  STOP = 'STOP',
  DELETE_ITEM = 'DELETE_ITEM',
  CLOSE_MANAGEMENT = 'CLOSE_MANAGEMENT',
  UNKNOWN = 'UNKNOWN'
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SPEAKING = 'SPEAKING',
  LISTENING_COMMAND = 'LISTENING_COMMAND',
  SAVING_ITEM_LISTEN = 'SAVING_ITEM_LISTEN',
  FINDING_ITEM = 'FINDING_ITEM',
  AWAITING_FOLLOWUP = 'AWAITING_FOLLOWUP',
  MANAGING_ITEMS = 'MANAGING_ITEMS',
  INTERPRETING_COMMAND = 'INTERPRETING_COMMAND',
  LIVE_COMMENTARY = 'LIVE_COMMENTARY',
}

export interface GeminiContent {
  role: 'user' | 'model';
  // FIX: Broaden the type of `parts` to `any[]` to accommodate both text and image data,
  // which are used together in vision model prompts.
  parts: any[];
}