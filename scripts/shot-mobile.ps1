$ErrorActionPreference = 'Stop'
$outDir = 'C:\Users\mckafei\Desktop\OpenGrokWeb\.verify'
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$file = Join-Path $outDir 'mobile.png'
$profile = Join-Path $outDir 'edge-mobile2'
New-Item -ItemType Directory -Force -Path $profile | Out-Null
$args = @(
  '--headless=new',
  '--disable-gpu',
  '--disable-cache',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  "--user-data-dir=$profile",
  '--window-size=390,844',
  "--screenshot=$file",
  'http://127.0.0.1:4173/?lang=zh&theme=light'
)
Start-Process -FilePath $edge -ArgumentList $args -Wait
Write-Output "wrote $((Get-Item $file).Length)"
