import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Eye, Users, Search } from 'lucide-react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Spinner } from '../components/ui'
import type { OasisBio } from '@oasisbio/common-core'
import { apiClient } from '../services/api'

export const IdentityListPage: React.FC = () => {
  const [identities, setIdentities] = useState<OasisBio[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchIdentities()
  }, [])

  const fetchIdentities = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.oasisBios.list()
      if (response.data) {
        setIdentities(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch identities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个身份吗？')) return
    try {
      await apiClient.oasisBios.delete(id)
      setIdentities(prev => prev.filter(i => i.id !== id))
    } catch (error) {
      console.error('Failed to delete identity:', error)
    }
  }

  const filteredIdentities = identities.filter(identity =>
    identity.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">身份管理</h1>
          <p className="text-gray-600 dark:text-gray-400">管理你的数字身份</p>
        </div>
        <Link to="/identities/new">
          <Button>
            <Plus size={20} className="mr-2" />
            新建身份
          </Button>
        </Link>
      </div>
      <div className="max-w-md">
        <Input
          placeholder="搜索身份..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search size={20} />}
        />
      </div>
      {filteredIdentities.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              还没有身份
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              创建你的第一个数字身份
            </p>
            <Link to="/identities/new">
              <Button>
                <Plus size={20} className="mr-2" />
                创建身份
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIdentities.map((identity) => (
            <Card key={identity.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {identity.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {identity.description || '暂无描述'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/identities/${identity.id}`)}
                  >
                    <Eye size={16} className="mr-1" />
                    查看
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/identities/${identity.id}/edit`)}
                  >
                    <Edit size={16} className="mr-1" />
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(identity.id)}
                    className="text-red-600 hover:text-red-700"
                  >
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
