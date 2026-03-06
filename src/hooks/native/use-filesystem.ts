import { useCallback, useState } from 'react'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'

type ReadFileOptions = {
  path: string
  directory?: Directory
  encoding?: Encoding
}

type WriteFileOptions = {
  path: string
  data: string
  directory?: Directory
  encoding?: Encoding
  recursive?: boolean
}

type DeleteFileOptions = {
  path: string
  directory?: Directory
}

export function useFilesystem() {
  const [error, setError] = useState<string | null>(null)

  const readFile = useCallback(
    async ({ path, directory = Directory.Data, encoding = Encoding.UTF8 }: ReadFileOptions) => {
      setError(null)
      try {
        const result = await Filesystem.readFile({
          path,
          directory,
          encoding,
        })
        return result.data as string
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to read file'
        setError(message)
        return null
      }
    },
    [],
  )

  const writeFile = useCallback(
    async ({
      path,
      data,
      directory = Directory.Data,
      encoding = Encoding.UTF8,
      recursive = true,
    }: WriteFileOptions) => {
      setError(null)
      try {
        const result = await Filesystem.writeFile({
          path,
          data,
          directory,
          encoding,
          recursive,
        })
        return result.uri
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to write file'
        setError(message)
        return null
      }
    },
    [],
  )

  const deleteFile = useCallback(
    async ({ path, directory = Directory.Data }: DeleteFileOptions) => {
      setError(null)
      try {
        await Filesystem.deleteFile({
          path,
          directory,
        })
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete file'
        setError(message)
        return false
      }
    },
    [],
  )

  return { readFile, writeFile, deleteFile, error }
}
