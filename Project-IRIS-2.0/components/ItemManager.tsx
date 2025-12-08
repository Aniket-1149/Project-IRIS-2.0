import React from 'react';
import { PersonalItem } from '../services/personalDB';
import { TrashIcon } from './Icons';

interface ItemManagerProps {
  isOpen: boolean;
  items: PersonalItem[];
  onDeleteItem: (name: string) => void;
  onClose: () => void;
}

export const ItemManager: React.FC<ItemManagerProps> = ({ isOpen, items, onDeleteItem, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-cyan-500"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Your Saved Items</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close item manager"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-gray-400 text-center">You haven't saved any items yet.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li 
                    key={item.name} 
                    className="flex items-center justify-between bg-gray-700 p-3 rounded-md"
                >
                  <div className="flex items-center gap-4">
                    <img src={item.imageData} alt={item.name} className="w-12 h-12 rounded object-cover border-2 border-gray-600" />
                    <span className="font-semibold text-lg">{item.name}</span>
                  </div>
                  <button 
                    onClick={() => onDeleteItem(item.name)}
                    className="p-2 rounded-full text-gray-400 hover:bg-red-800 hover:text-white transition-colors"
                    aria-label={`Delete item ${item.name}`}
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="p-4 bg-gray-900/50 text-center text-xs text-gray-400 rounded-b-lg">
          <p>You can say "delete" followed by the item name to remove an item.</p>
        </div>
      </div>
    </div>
  );
};
