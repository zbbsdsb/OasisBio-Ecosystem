import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  Users,
  Globe,
  Zap,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  User,
  MessageSquare
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../../hooks/useAuth'

const SidebarItem: React.FC<{
  to: string
  icon: React.ReactNode
  label: string
  active: boolean
}> = ({ to, icon, label, active }) => {
  return (
    <Link
      to={to}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  )
}

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { signOut, session } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { to: '/dashboard', icon: <Home size={20} />, label: '仪表盘' },
    { to: '/identities', icon: <Users size={20} />, label: '身份管理' },
    { to: '/worlds', icon: <Globe size={20} />, label: '世界管理' },
    { to: '/abilities', icon: <Zap size={20} />, label: '能力管理' },
    { to: '/assistant', icon: <MessageSquare size={20} />, label: 'AI 助手' },
    { to: '/settings', icon: <Settings size={20} />, label: '设置' }
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              OasisBio
            </h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map(item => (
              <SidebarItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                active={location.pathname === item.to}
              />
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              <span className="font-medium">
                {theme === 'dark' ? '浅色模式' : '深色模式'}
              </span>
            </button>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              {session && (
                <div className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  <User size={20} />
                  <span className="truncate">{session.user?.email}</span>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">退出登录</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
