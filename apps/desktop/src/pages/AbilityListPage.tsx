import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Zap } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle, Spinner } from '../components/ui'
import type { Ability } from '@oasisbio/common-core'

export const AbilityListPage: React.FC = () => {
  const [abilities, setAbilities] = useState<Ability[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const mockAbilities: Ability[] = [
      { id: '1', name: '火焰操控', description: '控制和召唤火焰', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '2', name: '瞬间移动', description: '在空间中快速移动', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '3', name: '心灵感应', description: '读取和传递思想', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '4', name: '时间暂停', description: '短暂停止时间流动', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ]
    setTimeout(() => {
      setAbilities(mockAbilities)
      setIsLoading(false)
    }, 500)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">能力管理</h1>
          <p className="text-gray-600 dark:text-gray-400">配置角色能力与技能</p>
        </div>
        <Button>
          <Plus size={20} className="mr-2" />
          新建能力
        </Button>
      </div>
      {abilities.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Zap size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              还没有能力
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              创建你的第一个能力
            </p>
            <Button>
              <Plus size={20} className="mr-2" />
              创建能力
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {abilities.map((ability) => (
            <Card key={ability.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {ability.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {ability.description || '暂无描述'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Eye size={16} className="mr-1" />
                    查看
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit size={16} className="mr-1" />
                    编辑
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 size={16} className="mr-1" />
                    删除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
