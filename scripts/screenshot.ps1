$ErrorActionPreference = 'Stop'
$outDir = 'C:\Users\mckafei\Desktop\OpenGrokWeb\.verify'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

function Capture([string]$name, [string]$url, [string]$size) {
  $file = Join-Path $outDir $name
  $profile = Join-Path $outDir ("edge-" + [IO.Path]::GetFileNameWithoutExtension($name))
  New-Item -ItemType Directory -Force -Path $profile | Out-Null
  $args = @(
    '--headless=new',
    '--disable-gpu',
    '--disable-cache',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    "--user-data-dir=$profile",
    "--window-size=$size",
    "--screenshot=$file",
    $url
  )
  $proc = Start-Process -FilePath $edge -ArgumentList $args -PassThru -Wait
  if (-not (Test-Path $file)) {
    throw "missing screenshot $file exit $($proc.ExitCode)"
  }
  Write-Output "wrote $name $((Get-Item $file).Length)"
}

Capture 'desktop.png' 'http://127.0.0.1:4173/?lang=zh&theme=light' '1440,900'
Capture 'desktop-en.png' 'http://127.0.0.1:4173/?lang=en&theme=light' '1440,900'
Capture 'desktop-dark.png' 'http://127.0.0.1:4173/?lang=zh&theme=dark' '1440,900'
Capture 'features.png' 'http://127.0.0.1:4173/?lang=zh&theme=light#features' '1440,1100'
Capture 'download.png' 'http://127.0.0.1:4173/?lang=zh&theme=light#download' '1440,1100'
Capture 'mobile.png' 'http://127.0.0.1:4173/?lang=zh&theme=light' '390,844'
Capture 'mobile-en.png' 'http://127.0.0.1:4173/?lang=en&theme=light' '390,844'
Capture 'full.png' 'http://127.0.0.1:4173/?lang=zh&theme=light' '1440,2600'
