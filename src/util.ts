/**
 * 判断是否为对象
 */
export const isObject = (value: unknown): value is object => {
  return !!value && value.constructor === Object
}

/**
 * 判断是否为数组
 */
export const isArray = Array.isArray

/**
 * 拼接路径
 */
export function joinPaths(...paths: string[]): string {
  return (
    paths.filter(Boolean).join('/').replace(/\/+/g, '/').replace(/\/$/, '') ||
    '/'
  )
}
