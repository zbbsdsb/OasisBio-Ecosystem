import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { Users, ExternalLink, UserCircle } from 'lucide-react';
import type { OasisBio } from '@oasisbio/common-core';

interface CharacterSectionProps {
  characters: OasisBio[];
  worldId: string;
  onUnlinkCharacter?: (characterId: string) => void;
}

export const CharacterSection: React.FC<CharacterSectionProps> = memo(({
  characters,
  worldId,
  onUnlinkCharacter
}) => {
  if (characters.length === 0) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
        <div className="flex flex-col items-center text-center">
          <Users size={40} className="text-gray-400 dark:text-gray-500 mb-3" />
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            No characters in this world yet
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
            Characters can be linked to this world through their profile settings. 
            Go to a character's edit page to assign them to this world.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} className="text-blue-600 dark:text-blue-400" />
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Characters in this World ({characters.length})
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {characters.map((character) => (
          <div
            key={character.id}
            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              {character.coverImageUrl ? (
                <img
                  src={character.coverImageUrl}
                  alt={character.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <UserCircle size={24} className="text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <Link
                to={`/identities/${character.id}`}
                className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate block"
              >
                {character.name}
              </Link>
              {character.tagline && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {character.tagline}
                </p>
              )}
            </div>

            <Link
              to={`/identities/${character.id}`}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ExternalLink size={16} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
});

CharacterSection.displayName = 'CharacterSection';
