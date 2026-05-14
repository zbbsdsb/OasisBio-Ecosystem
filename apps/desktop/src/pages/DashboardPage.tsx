import React from 'react'
import { Link } from 'react-router-dom'
import { Home, Users, Globe, Zap, Plus, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '../components/ui'

export const DashboardPage: React.FC = () => {
  const stats = [
    { label: '身份总数', value: '12', icon: <Users size={24} />, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900' },
    { label: '世界数量', value: '5', icon: <Globe size={24} />, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900' },
    { label: '能力配置', value: '34', icon: <Zap size={24} />, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900' },
    { label: '活跃项目', value: '8', icon: <TrendingUp size={24} />, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">仪表盘</h1>
          <p className="text-gray-600 dark:text-gray-400">欢迎回到 OasisBio</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                  {stat.icon}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/identities/new">
              <Button className="w-full" variant="primary">
                <Plus size={20} className="mr-2" />
                创建新身份
              </Button>
            </Link>
            <Link to="/worlds/new">
              <Button className="w-full" variant="secondary">
                <Plus size={20} className="mr-2" />
                创建新世界
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {i === 1 ? '更新了身份 "探险家"' : i === 2 ? '创建了新世界 "未来之城"' : '添加了新能力'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {i} 小时前
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
