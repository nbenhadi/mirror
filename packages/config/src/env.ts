export type NodeEnv = 'development' | 'test' | 'staging' | 'production'

export function getNodeEnv(): NodeEnv {
  const env = process.env['NODE_ENV']
  if (env === 'test' || env === 'staging' || env === 'production') return env
  return 'development'
}

export function isDev(): boolean {
  return getNodeEnv() === 'development'
}

export function isProd(): boolean {
  return getNodeEnv() === 'production'
}

export function isTest(): boolean {
  return getNodeEnv() === 'test'
}
