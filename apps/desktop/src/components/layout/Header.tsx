import React from 'react'
import { Menu } from 'lucide-react'
import { Button } from '../ui'

interface HeaderProps {
  onToggleSidebar: () => void
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="md:hidden mr-4"
          >
            <Menu size={24} />
          </Button>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            OasisBio Desktop
          </h2>
        </div>
        <div className="flex items-center space-x-4">
        </div>
      </div>
    </header>
  )
}
