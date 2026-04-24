param(
  [ValidateSet("nsis", "portable")]
  [string]$Target = "nsis"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")
$defaultOutputDir = Join-Path $repoRoot "release-desktop"
$fallbackOutputDir = Join-Path $repoRoot "release-desktop-fallback"

. (Join-Path $scriptDir "ensure-node-path.ps1")

function Remove-DirSafe([string]$path) {
  if (-not (Test-Path $path)) {
    return $true
  }

  try {
    Remove-Item -Recurse -Force -Path $path -ErrorAction Stop
    return $true
  }
  catch {
    Write-Warning "No se pudo limpiar '$path': $($_.Exception.Message)"
    return $false
  }
}

function Stop-DesktopProcesses {
  $processNames = @("SAT Movil COTEPA", "electron")

  foreach ($name in $processNames) {
    Get-Process -Name $name -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  }
}

function Build-DesktopPortable([string]$outputDir) {
  npx electron-builder --win $Target --config.directories.output="$outputDir"
  if ($LASTEXITCODE -ne 0) {
    throw "Fallo en electron-builder para target '$Target' y output '$outputDir' (exit code $LASTEXITCODE)."
  }
}

function Ensure-ReleaseFolder([string]$path) {
  if (-not (Test-Path $path)) {
    New-Item -ItemType Directory -Path $path | Out-Null
  }
}

function Get-BuildArtifact([string]$outputDir) {
  $artifact = Get-ChildItem -Path $outputDir -Filter *.exe -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if (-not $artifact) {
    throw "No se encontro ningun .exe generado en '$outputDir'."
  }

  return $artifact
}

Push-Location $repoRoot
try {
  Write-Host "[1/4] Build web (Vite)..."
  npm run build
  if ($LASTEXITCODE -ne 0) {
    throw "Fallo en 'npm run build' (exit code $LASTEXITCODE)."
  }

  Write-Host "[2/4] Cerrando procesos de escritorio que puedan bloquear artefactos..."
  Stop-DesktopProcesses

  Write-Host "[3/4] Limpiando salida previa en release-desktop..."
  $canUseDefaultOutput = $true
  $defaultWinUnpacked = Join-Path $defaultOutputDir "win-unpacked"
  if (-not (Remove-DirSafe $defaultWinUnpacked)) {
    $canUseDefaultOutput = $false
    Write-Warning "release-desktop esta bloqueado. Se usara carpeta de fallback para empaquetar."
  }

  Write-Host "[4/4] Empaquetando build Windows ($Target)..."
  $outputDir = if ($canUseDefaultOutput) { $defaultOutputDir } else { $fallbackOutputDir }
  Build-DesktopPortable $outputDir

  $artifact = Get-BuildArtifact $outputDir
  $artifactPath = $artifact.FullName

  if ($outputDir -ne $defaultOutputDir) {
    Ensure-ReleaseFolder $defaultOutputDir
    $finalArtifactPath = Join-Path $defaultOutputDir $artifact.Name
    Copy-Item -Path $artifactPath -Destination $finalArtifactPath -Force
    $artifactPath = $finalArtifactPath
  }

  Write-Host "Build desktop completado correctamente:"
  Get-Item $artifactPath | Select-Object FullName, Length, LastWriteTime | Format-List
}
finally {
  Pop-Location
}
