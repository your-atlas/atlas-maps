/**
 * Atlas Maps Plugin
 * 
 * Provides offline maps with downloadable regions.
 */

// Plugin types
interface PluginAPI {
  pluginId: string
  permissions: string[]
  hasPermission: (permission: string) => boolean
  storage: {
    get: <T>(key: string) => Promise<T | null>
    set: <T>(key: string, value: T) => Promise<void>
    delete: (key: string) => Promise<void>
    clear: () => Promise<void>
    keys: () => Promise<string[]>
  }
  core: {
    getLocations: () => Promise<Array<{
      id: string
      name: string
      slug: string
      coordinates: { lat: number; lon: number }
      isHome: boolean
    }>>
    getVaultPath: () => Promise<string>
  }
  ui: {
    registerRoute: (route: any) => void
    registerSidebarItem: (item: any) => void
    registerWidget: (widget: any) => void
    showToast: (message: string, type?: string) => void
  }
}

interface SharedDependencies {
  React: typeof import('react')
  Button: any
  Card: any
  CardContent: any
  CardHeader: any
  Input: any
  Dialog: any
  DialogContent: any
  DialogDescription: any
  DialogFooter: any
  DialogHeader: any
  DialogTitle: any
  Select: any
  SelectContent: any
  SelectItem: any
  SelectTrigger: any
  SelectValue: any
  useAppData: () => any
  useNavigate: () => any
  useState: typeof import('react').useState
  useEffect: typeof import('react').useEffect
  useCallback: typeof import('react').useCallback
  useMemo: typeof import('react').useMemo
  useRef: typeof import('react').useRef
  cn: (...args: any[]) => string
  lucideIcons: Record<string, any>
  useSecondarySidebar?: () => any
}

// Store shared deps globally
let shared: SharedDependencies
let api: PluginAPI

/**
 * Maps Page Component
 * 
 * Note: This is a simplified version. The full maps functionality
 * would need maplibre-gl which is provided by the host app.
 */
function MapsPage() {
  const { React, Card, CardContent, Button, lucideIcons, useAppData } = shared
  const { useState, useEffect, useRef, useCallback } = React
  
  const { savedLocations, currentLocation } = useAppData()
  const { Map, MapPin, Download, Plus, Wifi, WifiOff } = lucideIcons

  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [useOffline, setUseOffline] = useState(false)
  const [isAddingLocation, setIsAddingLocation] = useState(false)

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-switch to offline mode if offline
  useEffect(() => {
    if (!isOnline) {
      setUseOffline(true)
    }
  }, [isOnline])

  return (
    <div className="flex-1 min-h-screen bg-background">
      <div className="h-screen flex flex-col">
        {/* Header Controls */}
        <div className="p-4 border-b bg-card">
          <div className="mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold">Maps</h1>
            <div className="flex items-center gap-2">
              {/* Online/Offline Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted">
                {isOnline ? (
                  <>
                    <Wifi className="h-4 w-4" />
                    <span className="text-sm">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4" />
                    <span className="text-sm">Offline</span>
                  </>
                )}
              </div>

              {/* Toggle Offline Mode */}
              {isOnline && (
                <Button
                  variant={useOffline ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUseOffline(!useOffline)}
                >
                  {useOffline ? 'Offline Mode' : 'Online Mode'}
                </Button>
              )}

              {/* Add Location Button */}
              <Button
                variant={isAddingLocation ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsAddingLocation(!isAddingLocation)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isAddingLocation ? 'Cancel' : 'Add Location'}
              </Button>

              {/* Download Region Button */}
              <Button
                variant="outline"
                size="sm"
                disabled={!isOnline}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Region
              </Button>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative bg-muted">
          {/* Placeholder for map - actual map requires maplibre-gl */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Map className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Maps Plugin</h2>
              <p className="text-muted-foreground max-w-md">
                The maps feature requires MapLibre GL to render. 
                This plugin registers the /maps route and provides 
                offline map download capabilities.
              </p>
              {savedLocations.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Saved Locations:</h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {savedLocations.map((loc: any) => (
                      <div 
                        key={loc.id} 
                        className="flex items-center gap-1 px-2 py-1 bg-card rounded text-sm"
                      >
                        <MapPin className="h-3 w-3" />
                        {loc.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Click to Add Instructions */}
          {isAddingLocation && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">Click on the map to add a location</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Plugin activation
 */
export function activate(pluginApi: PluginAPI, sharedDeps: SharedDependencies) {
  api = pluginApi
  shared = sharedDeps
  
  console.log(`[${api.pluginId}] Activating Maps plugin...`)

  // Register sidebar item
  api.ui.registerSidebarItem({
    id: 'maps',
    title: 'Maps',
    icon: 'Map',
    route: '/maps',
    order: 40,
  })

  // Register the route
  api.ui.registerRoute({
    path: '/maps',
    component: MapsPage,
  })

  console.log(`[${api.pluginId}] Maps plugin activated`)
}

/**
 * Plugin deactivation
 */
export function deactivate() {
  console.log(`[${api?.pluginId}] Maps plugin deactivated`)
}
