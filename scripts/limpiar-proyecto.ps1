<#
.SYNOPSIS
    Script de Limpieza Automatica de Metadatos de IA y Copia Limpia para Handover.
.DESCRIPTION
    Este script realiza una copia limpia de todo el proyecto SgiPortal a un directorio destino,
    removiendo cualquier carpeta, archivo o configuracion relacionada con los asistentes de IA,
    ademas de directorios temporales de dependencias o compilacion.
.PARAMETER Destino
    La ruta absoluta donde se guardara la copia limpia del proyecto. Por defecto es C:\codeapps\SgiPortal_Clean.
.EXAMPLE
    .\scripts\limpiar-proyecto.ps1 -Destino "C:\codeapps\SgiPortal_Clean"
#>

param(
    [string]$Destino = "C:\codeapps\SgiPortal_Clean"
)

# Colores de Consola
function Write-Step { param([string]$msg); Write-Host "[PASO] $msg" -ForegroundColor Cyan }
function Write-Success { param([string]$msg); Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Warning { param([string]$msg); Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-ErrorMsg { param([string]$msg); Write-Host "[ERROR] $msg" -ForegroundColor Red }

Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "   SgiPortal - Generacion de Copia Limpia para Entrega (DTI)    " -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta

# 1. Validar que estamos en la raiz del proyecto
if (-not (Test-Path "package.json")) {
    Write-ErrorMsg "No se encontro package.json. Ejecuta este script desde la raiz de SgiPortal."
    exit 1
}

$origen = (Get-Location).Path
Write-Success "Origen detectado: $origen"
Write-Success "Destino configurado: $Destino"

# 2. Validar que origen y destino no sean el mismo directorio
if ($origen.TrimEnd('\') -eq $Destino.TrimEnd('\')) {
    Write-ErrorMsg "El directorio de origen y el de destino no pueden ser el mismo."
    exit 1
}

# 3. Crear el directorio de destino si no existe
if (-not (Test-Path $Destino)) {
    Write-Step "Creando directorio de destino..."
    $null = New-Item -ItemType Directory -Force -Path $Destino
    Write-Success "Directorio creado."
} else {
    Write-Warning "El directorio de destino ya existe. Se sobrescribiran los archivos existentes."
}

# 4. Definir patrones de exclusion (Elementos de IA, temporales e historial local)
$exclusiones = @(
    '\.git$',
    '\.git\\',
    '\.agent$',
    '\.agent\\',
    '\.agents$',
    '\.agents\\',
    '\.gemini$',
    '\.gemini\\',
    '\\node_modules$',
    '\\node_modules\\',
    '\\dist$',
    '\\dist\\',
    'build\.log$',
    '\.env\.local$'
)

# 5. Obtener todos los archivos del proyecto (excluyendo patrones)
Write-Step "Analizando y copiando archivos de forma selectiva..."
$archivosACopiar = Get-ChildItem -Path $origen -Recurse -File | Where-Object {
    $relativePath = $_.FullName.Substring($origen.Length)
    $ignore = $false
    foreach ($patron in $exclusiones) {
        if ($relativePath -match $patron) {
            $ignore = $true
            break
        }
    }
    $ignore -eq $false
}

$copiados = 0
foreach ($archivo in $archivosACopiar) {
    # Calcular la ruta de destino relativa
    $rutaRelativa = $archivo.FullName.Substring($origen.Length)
    $destinoArchivo = Join-Path -Path $Destino -ChildPath $rutaRelativa
    
    # Crear el directorio padre del archivo si no existe
    $directorioDestino = Split-Path -Path $destinoArchivo -Parent
    if (-not (Test-Path $directorioDestino)) {
        $null = New-Item -ItemType Directory -Force -Path $directorioDestino
    }
    
    # Copiar archivo
    Copy-Item -Path $archivo.FullName -Destination $destinoArchivo -Force
    $copiados++
}

Write-Success "Se copiaron exitosamente $copiados archivos."

# 6. Informar sobre el resultado
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "                 COPIA LIMPIA COMPLETADA!                     " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host "La copia de entrega se encuentra en: $Destino" -ForegroundColor White
Write-Host "Esta copia NO contiene historial de Git, modulos de Node, " -ForegroundColor White
Write-Host "configuraciones locales del agente, ni rastros de metadatos de IA." -ForegroundColor White
Write-Host "Para inicializarla en la nueva maquina, ejecute alli:" -ForegroundColor Cyan
Write-Host "  .\scripts\bootstrap.ps1" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Green
