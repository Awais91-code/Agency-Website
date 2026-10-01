param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string] $CommandPath,

  [Parameter(Mandatory = $true, Position = 1)]
  [string] $ArgumentsBase64
)

$ErrorActionPreference = "Stop"

try {
  $json = [System.Text.Encoding]::UTF8.GetString(
    [System.Convert]::FromBase64String($ArgumentsBase64)
  )

  $decoded = ConvertFrom-Json -InputObject $json
  $CommandArgs = @($decoded)

  & $CommandPath @CommandArgs

  if ($null -ne $LASTEXITCODE) {
    exit $LASTEXITCODE
  }

  exit 0
}
catch {
  [Console]::Error.WriteLine($_.Exception.Message)
  exit 1
}
