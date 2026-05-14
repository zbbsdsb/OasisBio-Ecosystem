import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Book, Code, Shield, Key, Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '../components/ui'
import { ContinueWithOasisButton } from '../components/auth'

export const OAuthDocsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <Link
          to="/settings"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Settings
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">OAuth Integration Guide</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Learn how to integrate "Continue with Oasis" login into your application
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book size={20} />
                Quick Start
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Follow these steps to integrate OAuth authentication into your application:
              </p>
              <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>Register your application</strong> in the Developer Portal to get your <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm">client_id</code>
                </li>
                <li>
                  <strong>Implement PKCE flow</strong> in your application to generate <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm">code_verifier</code> and <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm">code_challenge</code>
                </li>
                <li>
                  <strong>Redirect users</strong> to the OasisBio authorization endpoint
                </li>
                <li>
                  <strong>Exchange the authorization code</strong> for access and refresh tokens
                </li>
                <li>
                  <strong>Use the access token</strong> to call protected API endpoints
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code size={20} />
                Integration Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">1. Authorization URL Generation</h4>
                <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm overflow-x-auto">
{`const authUrl = new URL('${import.meta.env.VITE_OAUTH_API_URL || '/oauth/authorize'}');
authUrl.searchParams.set('client_id', YOUR_CLIENT_ID);
authUrl.searchParams.set('redirect_uri', YOUR_REDIRECT_URI);
authUrl.searchParams.set('scope', 'profile email oasisbios:read');
authUrl.searchParams.set('state', generateRandomState());
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');

// Redirect user
window.location.href = authUrl.toString();`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">2. Token Exchange</h4>
                <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm overflow-x-auto">
{`const response = await fetch('${import.meta.env.VITE_OAUTH_API_URL || '/oauth/token'}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: YOUR_REDIRECT_URI,
    code_verifier: codeVerifier,
    client_id: YOUR_CLIENT_ID
  })
});

const { access_token, refresh_token, expires_in } = await response.json();`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">3. Refresh Token</h4>
                <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm overflow-x-auto">
{`const response = await fetch('${import.meta.env.VITE_OAUTH_API_URL || '/oauth/token'}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: YOUR_CLIENT_ID
  })
});`}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key size={20} />
                Available Scopes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { scope: 'profile', label: 'Profile', desc: 'User ID, username, display name, avatar' },
                  { scope: 'email', label: 'Email', desc: 'User email address' },
                  { scope: 'oasisbios:read', label: 'Character List', desc: 'Public character list (title, slug, tagline, cover image)' },
                  { scope: 'oasisbios:full', label: 'Full Character Data', desc: 'Complete character data with abilities, worlds, eras' },
                  { scope: 'dcos:read', label: 'DCOS Documents', desc: 'Character DCOS document content' }
                ].map((item) => (
                  <div key={item.scope} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <code className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-sm font-mono">
                      {item.scope}
                    </code>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield size={20} />
                Security Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Always use PKCE (S256 method) for authorization requests
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Validate the state parameter to prevent CSRF attacks
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Store tokens securely (never in localStorage for web apps)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Implement refresh token rotation
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Use HTTPS for all OAuth communications
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  Validate redirect URIs exactly (no wildcards in production)
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe size={20} />
                API Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { method: 'GET', endpoint: '/oauth/authorize', desc: 'Authorization endpoint' },
                  { method: 'POST', endpoint: '/oauth/token', desc: 'Token exchange & refresh' },
                  { method: 'GET', endpoint: '/oauth/userinfo', desc: 'Get user profile' },
                  { method: 'POST', endpoint: '/oauth/revoke', desc: 'Revoke tokens' },
                  { method: 'GET', endpoint: '/oauth/.well-known/openid-configuration', desc: 'OIDC discovery' }
                ].map((item) => (
                  <div key={item.endpoint} className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      item.method === 'GET' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    }`}>
                      {item.method}
                    </span>
                    <code className="text-sm text-gray-700 dark:text-gray-300">{item.endpoint}</code>
                    <span className="text-sm text-gray-500">{item.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="py-8 text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Try the "Continue with Oasis" Button
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Experience the OAuth flow firsthand
              </p>
              <ContinueWithOasisButton variant="primary" size="lg" redirectTo="/dashboard" />
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Link to="/developer/apps">
              <Button variant="outline" className="flex items-center gap-2">
                <ExternalLink size={20} />
                Go to Developer Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
