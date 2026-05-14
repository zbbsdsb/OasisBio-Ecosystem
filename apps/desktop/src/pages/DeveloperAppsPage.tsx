import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Edit, Trash2, ExternalLink, Copy, Check } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea, Spinner } from '../components/ui'
import type { OAuthApp, OAuthAppRegistration } from '../types/oauth'

const MOCK_APPS: OAuthApp[] = []

export const DeveloperAppsPage: React.FC = () => {
  const [apps, setApps] = useState<OAuthApp[]>(MOCK_APPS)
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingApp, setEditingApp] = useState<OAuthApp | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              to="/settings"
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Settings
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Developer Apps</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your OAuth applications for "Continue with Oasis" integration
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus size={20} />
            New App
          </Button>
        </div>

        {apps.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExternalLink size={32} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No OAuth Apps Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Create your first OAuth application to enable "Continue with Oasis" login in your products.
              </p>
              <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 mx-auto">
                <Plus size={20} />
                Create Your First App
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {apps.map((app) => (
              <Card key={app.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {app.name}
                        </h3>
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded">
                          Active
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{app.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-500">Client ID</span>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                              {app.clientId}
                            </code>
                            <button
                              onClick={() => handleCopy(app.clientId, `${app.id}-clientId`)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              {copiedId === `${app.id}-clientId` ? (
                                <Check size={16} className="text-green-500" />
                              ) : (
                                <Copy size={16} />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-500">Redirect URIs</span>
                          <div className="mt-1 space-y-1">
                            {app.redirectUris.slice(0, 2).map((uri, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <code className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                                  {uri}
                                </code>
                              </div>
                            ))}
                            {app.redirectUris.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{app.redirectUris.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingApp(app)}
                        className="flex items-center gap-1"
                      >
                        <Edit size={16} />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {(showCreateModal || editingApp) && (
        <AppFormModal
          app={editingApp}
          onClose={() => {
            setShowCreateModal(false)
            setEditingApp(null)
          }}
          onSave={(newApp) => {
            if (editingApp) {
              setApps(apps.map(a => a.id === editingApp.id ? newApp : a))
            } else {
              setApps([...apps, newApp])
            }
            setShowCreateModal(false)
            setEditingApp(null)
          }}
        />
      )}
    </div>
  )
}

interface AppFormModalProps {
  app: OAuthApp | null
  onClose: () => void
  onSave: (app: OAuthApp) => void
}

const AppFormModal: React.FC<AppFormModalProps> = ({ app, onClose, onSave }) => {
  const [name, setName] = useState(app?.name || '')
  const [description, setDescription] = useState(app?.description || '')
  const [homepageUrl, setHomepageUrl] = useState(app?.homepageUrl || '')
  const [redirectUris, setRedirectUris] = useState(app?.redirectUris.join('\n') || '')
  const [logoUrl, setLogoUrl] = useState(app?.logoUrl || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const uris = redirectUris.split('\n').map(u => u.trim()).filter(Boolean)
      
      if (!name || !description || !homepageUrl || uris.length === 0) {
        throw new Error('Please fill in all required fields')
      }

      const newApp: OAuthApp = {
        id: app?.id || crypto.randomUUID(),
        clientId: app?.clientId || generateClientId(),
        clientSecret: app?.clientSecret || generateClientSecret(),
        name,
        description,
        homepageUrl,
        redirectUris: uris,
        logoUrl: logoUrl || null,
        ownerUserId: 'current-user',
        createdAt: app?.createdAt || new Date(),
        updatedAt: new Date()
      }

      onSave(newApp)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save app')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{app ? 'Edit App' : 'Create New App'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="App Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome App"
              required
            />
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what your app does..."
              rows={3}
              required
            />
            <Input
              label="Homepage URL"
              type="url"
              value={homepageUrl}
              onChange={(e) => setHomepageUrl(e.target.value)}
              placeholder="https://myapp.com"
              required
            />
            <Textarea
              label="Redirect URIs (one per line)"
              value={redirectUris}
              onChange={(e) => setRedirectUris(e.target.value)}
              placeholder="https://myapp.com/callback&#10;http://localhost:3000/callback"
              rows={3}
              required
            />
            <Input
              label="Logo URL (optional)"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://myapp.com/logo.png"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner size="sm" /> : app ? 'Save Changes' : 'Create App'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function generateClientId(): string {
  return crypto.randomUUID()
}

function generateClientSecret(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}
