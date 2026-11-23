# SessionStart hook for pave-front
# Injects essential PAVE frontend context once at session start.

$ErrorActionPreference = "Stop"

try {
    $null = [Console]::In.ReadToEnd()
    $output = @{
        injectSteps = @(
            @{
                systemMessage = @{
                    systemMessage = "Contexto PAVE-FRONT activo: React 19 + Vite 6 + Redux Toolkit + Tailwind v4 / shadcn/ui (Vercel SPA). Recuerda: (1) usa src/lib/date-utils.ts para fechas; (2) revisa docs/RUTAS_Y_PERMISOS.md e INTEGRACION_API.md; (3) el grupo Aplazamientos esta deshabilitado via AppSidebar.tsx (disabled:true)."
                }
            }
        )
    }
    $output | ConvertTo-Json -Depth 6 -Compress
} catch {
    Write-Output '{}'
}
