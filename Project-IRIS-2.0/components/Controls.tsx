import React from 'react';
import { ActionType } from '../types';
import { EyeIcon, DocumentTextIcon, UserGroupIcon, ExclamationTriangleIcon, BroadcastIcon, BookmarkIcon, CogIcon, QuestionMarkCircleIcon, TerrainIcon } from './Icons';

interface ControlsProps {
  onAction: (action: ActionType) => void;
  isDisabled: boolean;
  isLive: boolean;
}

const ActionButton: React.FC<{
  onClick: () => void;
  isDisabled: boolean;
  label: string;
  icon: React.ReactNode;
  colorClasses: string;
  isLive?: boolean;
}> = ({ onClick, isDisabled, label, icon, colorClasses, isLive = false }) => (
  <button
    onClick={onClick}
    disabled={isDisabled}
    className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg text-white font-semibold transition-all duration-200
    ${colorClasses}
    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-lg focus:ring-4 focus:ring-opacity-50'}
    ${isLive ? 'animate-pulse' : ''}`}
  >
    {icon}
    <span className="mt-2 text-xs text-center sm:text-sm">{label}</span>
  </button>
);

export const Controls: React.FC<ControlsProps> = ({ onAction, isDisabled, isLive }) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      <ActionButton
        onClick={() => onAction(ActionType.LIVE_COMMENTARY)}
        isDisabled={isDisabled && !isLive}
        label={isLive ? "Stop Live" : "Live"}
        icon={<BroadcastIcon />}
        colorClasses={isLive ? "bg-gradient-to-br from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 focus:ring-green-400 shadow-green-500/50" : "bg-gradient-to-br from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 focus:ring-green-500 shadow-green-500/30"}
        isLive={isLive}
      />
      <ActionButton
        onClick={() => onAction(ActionType.DESCRIBE_SCENE)}
        isDisabled={isDisabled || isLive}
        label="Describe"
        icon={<EyeIcon />}
        colorClasses="bg-gradient-to-br from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 focus:ring-cyan-400 shadow-cyan-500/30"
      />
      <ActionButton
        onClick={() => onAction(ActionType.ANALYZE_TERRAIN)}
        isDisabled={isDisabled || isLive}
        label="Terrain"
        icon={<TerrainIcon />}
        colorClasses="bg-gradient-to-br from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 focus:ring-orange-400 shadow-orange-500/30"
      />
      <ActionButton
        onClick={() => onAction(ActionType.CHECK_HAZARDS)}
        isDisabled={isDisabled || isLive}
        label="Hazards"
        icon={<ExclamationTriangleIcon />}
        colorClasses="bg-gradient-to-br from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 focus:ring-red-500 shadow-red-500/30"
      />
      <ActionButton
        onClick={() => onAction(ActionType.READ_TEXT)}
        isDisabled={isDisabled || isLive}
        label="Read Text"
        icon={<DocumentTextIcon />}
        colorClasses="bg-gradient-to-br from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 focus:ring-indigo-400 shadow-indigo-500/30"
      />
      <ActionButton
        onClick={() => onAction(ActionType.IDENTIFY_PEOPLE)}
        isDisabled={isDisabled || isLive}
        label="People"
        icon={<UserGroupIcon />}
        colorClasses="bg-gradient-to-br from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 focus:ring-purple-400 shadow-purple-500/30"
      />
      <ActionButton
        onClick={() => onAction(ActionType.SAVE_ITEM)}
        isDisabled={isDisabled || isLive}
        label="Save Item"
        icon={<BookmarkIcon />}
        colorClasses="bg-gradient-to-br from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 focus:ring-amber-400 shadow-amber-500/30"
      />
      <ActionButton
        onClick={() => onAction(ActionType.MANAGE_ITEMS)}
        isDisabled={isDisabled || isLive}
        label="Items"
        icon={<CogIcon />}
        colorClasses="bg-gradient-to-br from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 focus:ring-gray-400 shadow-gray-500/30"
      />
      <ActionButton
        onClick={() => onAction(ActionType.HELP)}
        isDisabled={isLive}
        label="Help"
        icon={<QuestionMarkCircleIcon />}
        colorClasses="bg-gradient-to-br from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 focus:ring-teal-400 shadow-teal-500/30"
      />
    </div>
  );
};

export { ActionType };
