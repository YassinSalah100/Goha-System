export default function Loading() {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
  
        <div className="border rounded-lg">
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-6 w-24 bg-muted animate-pulse rounded" />
              <div className="flex gap-4">
                <div className="h-10 w-48 bg-muted animate-pulse rounded" />
                <div className="h-10 w-64 bg-muted animate-pulse rounded" />
              </div>
            </div>
  
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              </div>
  
              <div className="border rounded">
                <div className="grid grid-cols-9 gap-4 p-4 border-b bg-muted/50">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-4 bg-muted animate-pulse rounded" />
                  ))}
                </div>
  
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-9 gap-4 p-4 border-b">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <div key={j} className="h-4 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  