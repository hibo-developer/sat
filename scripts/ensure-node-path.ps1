$nodePath = "C:\Program Files\nodejs"

if (-not (Test-Path "$nodePath\node.exe")) {
  Write-Error "No se encontró node.exe en '$nodePath'. Verifica la instalación de Node.js."
  exit 1
}

$pathActual = $env:Path -split ';'
if ($pathActual -notcontains $nodePath) {
  $env:Path = "$nodePath;$env:Path"
}

Write-Host "Node disponible en: $nodePath"
node -v
npm -v
