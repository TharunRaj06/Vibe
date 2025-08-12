# Azure Web App Deployment Fix Script
# This script addresses common deployment failures

Write-Host "🔧 Fixing Azure Web App Deployment Issues..." -ForegroundColor Green

$webAppName = "autoclaims"
$resourceGroup = "AutoClaimAI-RG"
$azPath = "C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd"

Write-Host "1. Setting essential application settings..." -ForegroundColor Yellow

# Set NODE_ENV
try {
    & $azPath webapp config appsettings set --name $webAppName --resource-group $resourceGroup --settings "NODE_ENV=production"
    Write-Host "✅ NODE_ENV set to production" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set NODE_ENV: $($_.Exception.Message)" -ForegroundColor Red
}

# Set PORT
try {
    & $azPath webapp config appsettings set --name $webAppName --resource-group $resourceGroup --settings "PORT=8080"
    Write-Host "✅ PORT set to 8080" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set PORT: $($_.Exception.Message)" -ForegroundColor Red
}

# Set Node.js version
try {
    & $azPath webapp config appsettings set --name $webAppName --resource-group $resourceGroup --settings "WEBSITE_NODE_DEFAULT_VERSION=~18"
    Write-Host "✅ Node.js version set to 18" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set Node.js version: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "2. Configuring startup command..." -ForegroundColor Yellow

# Set startup command
try {
    & $azPath webapp config set --name $webAppName --resource-group $resourceGroup --startup-file "server/server.js"
    Write-Host "✅ Startup command configured" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set startup command: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "3. Checking current configuration..." -ForegroundColor Yellow

# Show current settings
try {
    Write-Host "Current App Settings:" -ForegroundColor Cyan
    & $azPath webapp config appsettings list --name $webAppName --resource-group $resourceGroup --output table
} catch {
    Write-Host "❌ Failed to retrieve app settings" -ForegroundColor Red
}

Write-Host "4. Restarting web app..." -ForegroundColor Yellow

# Restart the web app
try {
    & $azPath webapp restart --name $webAppName --resource-group $resourceGroup
    Write-Host "✅ Web app restarted" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to restart web app: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Deployment fix completed!" -ForegroundColor Green
Write-Host "Your web app URL: https://autoclaims-h5dvhdcka3cgedes.canadacentral-01.azurewebsites.net" -ForegroundColor Yellow

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Try deploying your code again using VS Code Azure extension" -ForegroundColor White
Write-Host "2. Or use: az webapp deployment source config-zip" -ForegroundColor White
Write-Host "3. Check logs with: az webapp log tail --name autoclaims --resource-group AutoClaimAI-RG" -ForegroundColor White
