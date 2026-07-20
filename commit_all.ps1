# Forca flush do cache CIFS e commita todos os arquivos modificados
Set-Location "C:\Users\ramon_mrz4\Claude\Projects\Soconstrutoras"

# Remove locks
Remove-Item -Force ".git\index.lock" -ErrorAction SilentlyContinue
Remove-Item -Force ".git\HEAD.lock"  -ErrorAction SilentlyContinue

# Forca re-leitura de todos os arquivos via .NET (bypassa cache Windows)
$arquivos = @(
  "frontend/src/app/imoveis/[slug]/page.tsx",
  "frontend/src/app/page.tsx",
  "frontend/src/app/dashboard/empreendimentos/[id]/page.tsx",
  "frontend/src/lib/api.ts",
  "frontend/src/types/index.ts",
  "backend/src/app.module.ts",
  "backend/src/empreendimentos/empreendimentos.service.ts"
)

foreach ($f in $arquivos) {
  if (Test-Path $f) {
    $conteudo = [System.IO.File]::ReadAllBytes($f)
    [System.IO.File]::WriteAllBytes($f, $conteudo)
    Write-Host "Refreshed: $f"
  }
}

# Atualiza index do git
git update-index --really-refresh 2>$null

# Adiciona todos os arquivos modificados rastreados
git add -u

# Adiciona novos arquivos da feature de unidades
git add "frontend/src/components/unidades/"
git add "backend/src/unidades/"

Write-Host ""
Write-Host "=== Arquivos staged ==="
git diff --cached --name-only

Write-Host ""
Write-Host "=== Commitando ==="
git commit -m "feat: pagina imovel com faixa de preco + botao unidades; busca IA melhorada; modulo unidades completo"

Write-Host ""
Write-Host "=== Push ==="
git push origin main

Write-Host ""
Write-Host "=== Pronto! Vercel e Railway vao rebuildar ==="
Read-Host "Pressione Enter para sair"
