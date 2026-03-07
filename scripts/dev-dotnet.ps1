$ErrorActionPreference = "Stop"

$base = "c:\Projects\sangu2\.user"
New-Item -ItemType Directory -Force -Path `
  "$base\AppData\Roaming\NuGet", `
  "$base\AppData\Local", `
  "c:\Projects\sangu2\.dotnet", `
  "c:\Projects\sangu2\.nuget\packages", `
  "c:\Projects\sangu2\.nuget\http-cache" | Out-Null

$env:USERPROFILE = $base
$env:APPDATA = "$base\AppData\Roaming"
$env:LOCALAPPDATA = "$base\AppData\Local"
$env:DOTNET_CLI_HOME = "c:\Projects\sangu2\.dotnet"
$env:DOTNET_SKIP_FIRST_TIME_EXPERIENCE = "1"
$env:NUGET_PACKAGES = "c:\Projects\sangu2\.nuget\packages"
$env:NUGET_HTTP_CACHE_PATH = "c:\Projects\sangu2\.nuget\http-cache"
$env:MSBuildEnableWorkloadResolver = "false"

dotnet restore c:\Projects\sangu2\Sangu.Tms.sln --configfile c:\Projects\sangu2\NuGet.Config
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

dotnet build c:\Projects\sangu2\Sangu.Tms.sln --no-restore
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
