import React from 'react'
import { Link } from 'react-router-dom'
import { Settings, Bell, Shield, Palette, Database, Code, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '../components/ui'
import { useAuth } from '../hooks/useAuth'

export const SettingsPage: React.FC = () => {
  const { isOAuthAvailable } = useAuth()

  const settingsSections = [
    { title: '通知设置', icon: <Bell size={24} />, description: '管理通知偏好' },
    { title: '隐私设置', icon: <Shield size={24} />, description: '配置隐私选项' },
    { title: '外观设置', icon: <Palette size={24} />, description: '自定义界面外观' },
    { title: '数据管理', icon: <Database size={24} />, description: '导入导出数据' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">设置</h1>
        <p className="text-gray-600 dark:text-gray-400">配置应用程序偏好</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-400">
                  {section.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {section.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {section.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isOAuthAvailable && (
        <>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">开发者选项</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/developer/apps">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg text-green-600 dark:text-green-400">
                      <Code size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        OAuth 应用管理
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        注册和管理第三方 OAuth 应用
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to="/developer/docs">
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg text-purple-600 dark:text-purple-400">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        OAuth 集成文档
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        了解如何集成 "Continue with Oasis" 登录
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
