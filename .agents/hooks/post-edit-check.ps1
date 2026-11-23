# PostToolUse hook for pave-front (matcher: edit_file|write_file)
# Validates JSON syntax when .json files (such as vercel.json, package.json, components.json) are modified.

$ErrorActionPreference = "Stop"

try {
    $rawInput = [Console]::In.ReadToEnd()
    if (-not [string]::IsNullOrWhiteSpace($rawInput)) {
        $payload = $rawInput | ConvertFrom-Json
        $targetPath = ""
        if ($payload.toolCall -and $payload.toolCall.args -and $payload.toolCall.args.Path) {
            $targetPath = [string]$payload.toolCall.args.Path
        }

        if ($targetPath -match '(?i)\.json$' -and (Test-Path -LiteralPath $targetPath)) {
            $null = (Get-Content -LiteralPath $targetPath -Raw -Encoding UTF8) | ConvertFrom-Json
        }
    }
} catch {
    [Console]::Error.WriteLine("PAVE-FRONT PostToolUse JSON validation warning: $($_.Exception.Message)")
}

Write-Output '{}'
