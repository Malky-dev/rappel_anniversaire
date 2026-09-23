$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$source = Join-Path $projectRoot 'extension'
$manifest = Get-Content -LiteralPath (Join-Path $source 'manifest.json') -Raw | ConvertFrom-Json
$buildRoot = Join-Path $projectRoot ('dist/build-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
$utf8 = New-Object System.Text.UTF8Encoding($false, $true)
foreach ($browser in @('chrome', 'firefox')) {
    $destination = Join-Path $buildRoot $browser
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
    Get-ChildItem -LiteralPath $source | Copy-Item -Destination $destination -Recurse
    $browserManifest = Get-Content -LiteralPath (Join-Path $source 'manifest.json') -Raw | ConvertFrom-Json
    if ($browser -eq 'chrome') {
        $browserManifest.background.PSObject.Properties.Remove('scripts')
        $browserManifest.PSObject.Properties.Remove('browser_specific_settings')
    } else {
        $browserManifest.background.PSObject.Properties.Remove('service_worker')
        $browserManifest.PSObject.Properties.Remove('minimum_chrome_version')
    }
    [IO.File]::WriteAllText((Join-Path $destination 'manifest.json'), ($browserManifest | ConvertTo-Json -Depth 8) + "`n", $utf8)
    $archive = Join-Path $buildRoot ("rappel_anniversaire-$browser-" + $manifest.version + '.zip')
    Compress-Archive -Path (Join-Path $destination '*') -DestinationPath $archive
    Write-Output $archive
}
