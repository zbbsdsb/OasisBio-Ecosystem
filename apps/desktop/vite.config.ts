import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import electron from 'vite-plugin-electron/simple'
import renderer from 'vite-plugin-electron-renderer'
import { visualizer } from 'rollup-plugin-visualizer'

const isAnalyze = process.env.ANALYZE === 'true'
const isProduction = process.env.NODE_ENV === 'production'
const isDev = !isProduction

export default defineConfig({
  plugins: [
    react({
      fastRefresh: isDev,
      babel: {
        plugins: [
          ['@babel/plugin-proposal-decorators', { legacy: true }],
        ],
      },
    }),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            minify: isProduction,
            rollupOptions: {
              output: {
                manualChunks: {
                  'electron-vendor': ['electron-store', 'keytar'],
                  'supabase': ['@supabase/supabase-js'],
                  'fs-extra': ['fs-extra'],
                },
              },
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload.ts'),
        vite: {
          build: {
            minify: isProduction,
            rollupOptions: {
              output: {
                manualChunks: (id) => {
                  if (id.includes('node_modules')) {
                    return 'preload-vendor'
                  }
                },
              },
            },
          },
        },
      },
      renderer: {},
    }),
    renderer(),
    isAnalyze && visualizer({
      filename: 'stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ].filter(Boolean),

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      '@supabase/supabase-js',
    ],
    exclude: ['electron', 'electron-store', 'keytar'],
    esbuildOptions: {
      target: 'esnext',
    },
    prebuildIterations: 2,
  },

  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: !isProduction,
   manifest: isDev ? 'vite.config.mf' : undefined,
    
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react'
            if (id.includes('react-dom')) return 'vendor-react-dom'
            if (id.includes('react-router-dom')) return 'vendor-router'
            if (id.includes('lucide-react') || id.includes('@iconify')) return 'vendor-icons'
            if (id.includes('@supabase/supabase-js')) return 'vendor-supabase'
            if (id.includes('@oasisbio')) return 'vendor-oasisbio'
            if (id.includes('date-fns') || id.includes('dayjs') || id.includes('moment')) return 'vendor-date'
            if (id.includes('zustand') || id.includes('jotai') || id.includes('recoil')) return 'vendor-state'
            return 'vendor'
          }

          if (id.includes('/src/components/ui/')) return 'components-ui'
          if (id.includes('/src/components/layout/')) return 'components-layout'
          if (id.includes('/src/components/assistant/')) return 'components-assistant'
          if (id.includes('/src/components/world/')) return 'components-world'
          if (id.includes('/src/components/auth/')) return 'components-auth'

          if (id.includes('/src/pages/')) {
            if (id.includes('DashboardPage')) return 'page-dashboard'
            if (id.includes('AssistantPage') || id.includes('AssistantSettingsPage')) return 'page-assistant'
            if (id.includes('WorldListPage') || id.includes('WorldBuilderPage') || id.includes('WorldDetailPage')) return 'page-world'
            if (id.includes('IdentityListPage') || id.includes('IdentityDetailPage') || id.includes('IdentityFormPage')) return 'page-identity'
            if (id.includes('SettingsPage')) return 'page-settings'
            return 'pages'
          }

          if (id.includes('/src/services/')) return 'services'
          if (id.includes('/src/hooks/')) return 'hooks'
          if (id.includes('/src/contexts/')) return 'contexts'
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').slice(-2).join('/')
            : ''
          return `assets/${chunkInfo.name || 'chunk'}-[hash].js`
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || []
          const ext = info[info.length - 1]
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name || '')) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
            return 'assets/fonts/[name]-[hash][extname]'
          }
          if (ext === 'css') {
            return 'assets/css/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        },
        inlineDynamicImports: null,
      },
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: (id) => {
          if (id.includes('node_modules')) {
            return !id.includes('.test.') && !id.includes('.spec.')
          }
          return true
        },
        annotations: true,
        treatReturnAsSideEffect: true,
      },
    },

    chunkSizeWarningLimit: 500,
    reportCompressedSize: true,

    sourcemap: false,
  },

  esbuild: {
    drop: isProduction ? ['console', 'debugger'] : [],
    legalComments: isProduction ? 'none' : 'inline',
    treeShaking: true,
    minifyIdentifiers: isProduction,
    minifySyntax: isProduction,
    minifyWhitespace: isProduction,
    keepNames: !isProduction,
  },

  server: {
    preTransformRequests: true,
    warmup: {
      clientFiles: [
        './src/main.tsx',
        './src/App.tsx',
      ],
    },
    fs: {
      strict: false,
      allow: ['..'],
    },
  },

  preview: {
    port: 4173,
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    __DEV__: JSON.stringify(!isProduction),
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(process.env.npm_package_version),
  },
})
