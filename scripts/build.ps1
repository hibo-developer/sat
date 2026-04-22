$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. "$scriptDir\ensure-node-path.ps1"

npm run build
