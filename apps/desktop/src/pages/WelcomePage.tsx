import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '../components/ui'

export const WelcomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-6">
            <Sparkles size={48} className="text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">OasisBio</h1>
          <p className="text-xl text-blue-200 mb-2">跨时代数字身份系统</p>
          <p className="text-blue-300">
            创建、管理和分享你的数字身份与虚拟世界
          </p>
        </div>
        <div className="space-y-4">
          <Link to="/login">
            <Button size="lg" className="w-full max-w-xs text-lg py-4">
              开始使用
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">∞</div>
            <div className="text-sm text-blue-200">无限可能</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">🔒</div>
            <div className="text-sm text-blue-200">安全可靠</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">✨</div>
            <div className="text-sm text-blue-200">创新体验</div>
          </div>
        </div>
      </div>
    </div>
  )
}
