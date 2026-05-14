import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Spinner } from '../components/ui'
import { ContinueWithOasisButton } from '../components/auth'
import { useAuth } from '../hooks/useAuth'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { sendOtp, isOAuthAvailable } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await sendOtp(email)
      navigate(`/verify?email=${encodeURIComponent(email)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送验证码失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6">
          <ArrowLeft size={20} className="mr-2" />
          返回
        </Link>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4 mx-auto">
              <Mail size={32} className="text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-center">登录 OasisBio</CardTitle>
          </CardHeader>
          <CardContent>
            {isOAuthAvailable && (
              <div className="mb-6">
                <ContinueWithOasisButton
                  variant="secondary"
                  size="md"
                  className="w-full"
                  redirectTo="/dashboard"
                />
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      或使用邮箱登录
                    </span>
                  </div>
                </div>
              </div>
            )}
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              输入你的邮箱地址，我们将发送验证码给你
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="邮箱地址"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error}
                required
                autoFocus
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    发送中...
                  </>
                ) : (
                  '发送验证码'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
