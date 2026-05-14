import React, { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Spinner } from '../components/ui'
import { useAuth } from '../hooks/useAuth'

export const VerifyPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { verifyOtp } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!email) {
      navigate('/login')
    }
  }, [email, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await verifyOtp(email, otp)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证码错误')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6">
          <ArrowLeft size={20} className="mr-2" />
          返回
        </Link>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4 mx-auto">
              <ShieldCheck size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-center">验证邮箱</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-2">
              验证码已发送至
            </p>
            <p className="text-center font-medium text-gray-900 dark:text-white mb-6">
              {email}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="验证码"
                type="text"
                placeholder="输入 6 位验证码"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                error={error}
                required
                maxLength={6}
                autoFocus
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    验证中...
                  </>
                ) : (
                  '验证并登录'
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                没有收到验证码？重新发送
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
