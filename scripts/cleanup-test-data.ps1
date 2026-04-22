$lineas = Get-Content .env | Where-Object { $_ -match '=' }
$url = (($lineas | Where-Object { $_ -like 'VITE_SUPABASE_URL=*' }) -split '=', 2)[1]
$key = (($lineas | Where-Object { $_ -like 'VITE_SUPABASE_ANON_KEY=*' }) -split '=', 2)[1]
$headersJson = @{ apikey = $key; Authorization = "Bearer $key"; 'Content-Type' = 'application/json' }
$headersAuth = @{ apikey = $key; Authorization = "Bearer $key" }

function Normalizar-RespuestaRest($respuesta) {
  if ($null -eq $respuesta) {
    return @()
  }

  if ($respuesta -is [System.Array]) {
    return @($respuesta)
  }

  if ($respuesta.PSObject.Properties.Name -contains 'id') {
    return @($respuesta)
  }

  return @()
}

$clientes = Normalizar-RespuestaRest (Invoke-RestMethod -Method Get -Uri "$url/rest/v1/clientes?or=(nombre.like.Demo%20SAT%20-%20*,nombre.like.Cliente%20Prueba%20SAT%20*,nombre.like.Cliente%20Tiempo%20Columna%20*)&select=id" -Headers $headersAuth)
$tecnicos = Normalizar-RespuestaRest (Invoke-RestMethod -Method Get -Uri "$url/rest/v1/tecnicos?or=(nombre.like.Demo%20SAT%20-%20*,nombre.eq.Tecnico%20Prueba,nombre.eq.Tecnico%20Tiempo%20Columna)&select=id" -Headers $headersAuth)
$equipos = Normalizar-RespuestaRest (Invoke-RestMethod -Method Get -Uri "$url/rest/v1/equipos?or=(numero_serie.like.SAT-DEMO-*,nombre.eq.Equipo%20Prueba,nombre.eq.Equipo%20Tiempo%20Columna)&select=id" -Headers $headersAuth)

$clienteIds = @($clientes | ForEach-Object { $_.id } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
$tecnicoIds = @($tecnicos | ForEach-Object { $_.id } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
$equipoIds = @($equipos | ForEach-Object { $_.id } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
$ordenIds = New-Object System.Collections.Generic.HashSet[string]

foreach ($clienteId in $clienteIds) {
  Normalizar-RespuestaRest (Invoke-RestMethod -Method Get -Uri "$url/rest/v1/ordenes_trabajo?cliente_id=eq.$clienteId&select=id" -Headers $headersAuth) | ForEach-Object { if (-not [string]::IsNullOrWhiteSpace($_.id)) { [void]$ordenIds.Add($_.id) } }
}

foreach ($tecnicoId in $tecnicoIds) {
  Normalizar-RespuestaRest (Invoke-RestMethod -Method Get -Uri "$url/rest/v1/ordenes_trabajo?tecnico_id=eq.$tecnicoId&select=id" -Headers $headersAuth) | ForEach-Object { if (-not [string]::IsNullOrWhiteSpace($_.id)) { [void]$ordenIds.Add($_.id) } }
}

foreach ($equipoId in $equipoIds) {
  Normalizar-RespuestaRest (Invoke-RestMethod -Method Get -Uri "$url/rest/v1/ordenes_trabajo?equipo_id=eq.$equipoId&select=id" -Headers $headersAuth) | ForEach-Object { if (-not [string]::IsNullOrWhiteSpace($_.id)) { [void]$ordenIds.Add($_.id) } }
}

foreach ($descripcion in @('No enfria correctamente', 'No alcanza temperatura de consigna', 'Fuga de vapor en junta principal', 'Prueba tiempo en columna')) {
  $descripcionCodificada = [uri]::EscapeDataString($descripcion)
  Normalizar-RespuestaRest (Invoke-RestMethod -Method Get -Uri "$url/rest/v1/ordenes_trabajo?descripcion_averia=eq.$descripcionCodificada&select=id" -Headers $headersAuth) | ForEach-Object { if (-not [string]::IsNullOrWhiteSpace($_.id)) { [void]$ordenIds.Add($_.id) } }
}

foreach ($ordenId in $ordenIds) {
  Invoke-RestMethod -Method Delete -Uri "$url/rest/v1/materiales_orden?orden_id=eq.$ordenId" -Headers $headersJson | Out-Null
  Invoke-RestMethod -Method Delete -Uri "$url/rest/v1/ordenes_trabajo?id=eq.$ordenId" -Headers $headersJson | Out-Null
}

foreach ($equipoId in $equipoIds) {
  Invoke-RestMethod -Method Delete -Uri "$url/rest/v1/equipos?id=eq.$equipoId" -Headers $headersJson | Out-Null
}

foreach ($tecnicoId in $tecnicoIds) {
  Invoke-RestMethod -Method Delete -Uri "$url/rest/v1/tecnicos?id=eq.$tecnicoId" -Headers $headersJson | Out-Null
}

foreach ($clienteId in $clienteIds) {
  Invoke-RestMethod -Method Delete -Uri "$url/rest/v1/clientes?id=eq.$clienteId" -Headers $headersJson | Out-Null
}

Write-Output "CLIENTES_LIMPIADOS=$($clienteIds.Count)"
Write-Output "TECNICOS_LIMPIADOS=$($tecnicoIds.Count)"
Write-Output "EQUIPOS_LIMPIADOS=$($equipoIds.Count)"
Write-Output "ORDENES_LIMPIADAS=$($ordenIds.Count)"
