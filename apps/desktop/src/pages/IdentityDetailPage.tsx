import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Users } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle, Spinner } from '../components/ui'
import type { OasisBio } from '@oasisbio/common-core'
import { apiClient } from '../services/api'

export const IdentityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [identity, setIdentity] = useState<OasisBio | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchIdentity(id)
    }
  }, [id])

  const fetchIdentity = async (identityId: string) => {
    try {
      setIsLoading(true)
      const response = await apiClient.oasisBios.getById(identityId)
      if (response.data) {
        setIdentity(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch identity:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !confirm('确定要删除这个身份吗？')) return
    try {
      await apiClient.oasisBios.delete(id)
      navigate('/identities')
    } catch (error) {
      console.error('Failed to delete identity:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!identity) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">身份不存在</p>
        <Link to="/identities">
          <Button className="mt-4">返回列表</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/identities" className="mr-4">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={20} className="mr-2" />
              返回
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {identity.name}
            </h1>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => navigate(`/identities/${id}/edit`)}>
            <Edit size={20} className="mr-2" />
            编辑
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={20} className="mr-2" />
            删除
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full mb-6 mx-auto">
            <Users size={48} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
            {identity.name}
          </h2>
          {identity.description && (
            <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
              {identity.description}
            </p>
          )}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">状态</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {identity.status}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">创建时间</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {new Date(identity.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
