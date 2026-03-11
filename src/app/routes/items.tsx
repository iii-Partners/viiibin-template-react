import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useItems, useCreateItem, useDeleteItem } from '@/hooks/use-items'
import { Trash2, Plus, Database, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export default function ItemsPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const { data, isLoading, error } = useItems()
  const createItem = useCreateItem()
  const deleteItem = useDeleteItem()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    createItem.mutate(
      { title: title.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          setTitle('')
          setDescription('')
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Items</h1>
        <p className="text-muted-foreground">Manage your data with D1-backed persistence.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Add Item</CardTitle>
            <CardDescription>Create a new item in the database.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter item title"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <Button type="submit" className="w-full" disabled={createItem.isPending || !title.trim()}>
                <Plus className="h-4 w-4" />
                {createItem.isPending ? 'Adding...' : 'Add Item'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Items list */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">All Items</CardTitle>
            <CardDescription>
              {data ? `${data.total} item${data.total === 1 ? '' : 's'} total` : 'Loading...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium">Failed to load items</p>
                  <p className="text-sm text-muted-foreground">
                    {(error as { message?: string }).message || 'An unexpected error occurred.'}
                  </p>
                </div>
              </div>
            )}

            {data && data.items.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Database className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No items yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first item using the form.
                  </p>
                </div>
              </div>
            )}

            {data && data.items.length > 0 && (
              <div className="divide-y">
                {data.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        item.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
                      )}
                    >
                      {item.status}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteItem.mutate(item.id)}
                      disabled={deleteItem.isPending}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete {item.title}</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
