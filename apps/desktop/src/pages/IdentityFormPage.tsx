import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Save } from 'lucide-react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Spinner } from '../components/ui'
import type { OasisBio, CreateOasisBioRequest, UpdateOasisBioRequest } from '@oasisbio/common-core'
import { apiClient } from '../services/api'

export const IdentityFormPage: React.FC<{ isEdit?: boolean }> = ({ isEdit = false }) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<CreateOasisBioRequest>>({
    name: '',
    description: '',
    status: 'ACTIVE'
  })

  useEffect(() => {
    if (isEdit && id) {
      fetchIdentity(id)
    }
  }, [isEdit, id])

  const fetchIdentity = async (identityId: string) => {
    try {
      setIsLoading(true)
      const response = await apiClient.oasisBios.getById(identityId)
      if (response.data) {
        setFormData({
          name: response.data.name,
          description: response.data.description,
          status: response.data.status
        })
      }
    } catch (error) {
      console.error('Failed to fetch identity:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSaving(true)
      if (isEdit && id) {
        await apiClient.oasisBios.update(id, formData as UpdateOasisBioRequest)
      } else {
        await apiClient.oasisBios.create(formData as CreateOasisBioRequest)
      }
      navigate('/identities')
    } catch (error) {
      console.error('Failed to save identity:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center">
        <Link to="/identities" className="mr-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={20} className="mr-2" />
            返回
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? '编辑身份' : '新建身份'}
          </h1>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>身份信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="身份名称"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="输入身份名称"
              required
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="输入身份描述"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-4 pt-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save size={20} className="mr-2" />
                    保存
                  </>
                )}
              </Button>
              <Link to="/identities">
                <Button variant="secondary">取消</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
