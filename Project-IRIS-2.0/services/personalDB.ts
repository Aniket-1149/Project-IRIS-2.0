export interface PersonalItem {
  name: string;
  imageData: string; // base64 data URL
}

const DB_KEY = 'ai_vision_assistant_personal_items';

export const getItems = (): PersonalItem[] => {
  try {
    const itemsJson = localStorage.getItem(DB_KEY);
    return itemsJson ? JSON.parse(itemsJson) : [];
  } catch (error) {
    console.error("Error retrieving personal items:", error);
    localStorage.removeItem(DB_KEY);
    return [];
  }
};

export const saveItem = (newItem: PersonalItem): PersonalItem[] => {
  const items = getItems();
  const updatedItems = [...items, newItem];
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(updatedItems));
  } catch (error) {
    console.error("Error saving personal item:", error);
  }
  return updatedItems;
};

export const deleteItem = (nameToDelete: string): PersonalItem[] => {
  const items = getItems();
  const updatedItems = items.filter(item => item.name.toLowerCase() !== nameToDelete.toLowerCase());
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(updatedItems));
  } catch (error) {
    console.error("Error deleting personal item:", error);
  }
  return updatedItems;
};
