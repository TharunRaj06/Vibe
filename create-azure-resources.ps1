# AutoClaimAI Azure Resources Creation Script
# This script creates all necessary Azure resources for the AutoClaimAI application

# Variables
$resourceGroupName = "AutoClaimAI-RG"
$location = "East US"
$cosmosAccountName = "autoclaimai-cosmos-$(Get-Random -Minimum 1000 -Maximum 9999)"
$computerVisionName = "autoclaimai-cv-$(Get-Random -Minimum 1000 -Maximum 9999)"
$storageAccountName = "autoclaimai$((Get-Random -Minimum 100000 -Maximum 999999))"
$appServicePlanName = "autoclaimai-plan"
$webAppName = "autoclaimai-webapp-$(Get-Random -Minimum 1000 -Maximum 9999)"

Write-Host "🚀 Creating Azure Resources for AutoClaimAI..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# 1. Create Resource Group
Write-Host "📁 Creating Resource Group..." -ForegroundColor Yellow
az group create --name $resourceGroupName --location $location

# 2. Create Storage Account
Write-Host "💾 Creating Storage Account..." -ForegroundColor Yellow
az storage account create `
    --name $storageAccountName `
    --resource-group $resourceGroupName `
    --location $location `
    --sku Standard_LRS `
    --kind StorageV2

# 3. Create Cosmos DB Account
Write-Host "🌍 Creating Cosmos DB Account..." -ForegroundColor Yellow
az cosmosdb create `
    --name $cosmosAccountName `
    --resource-group $resourceGroupName `
    --locations regionName=$location `
    --default-consistency-level Session `
    --enable-free-tier true

# 4. Create Cosmos DB Database
Write-Host "🗄️ Creating Cosmos DB Database..." -ForegroundColor Yellow
az cosmosdb sql database create `
    --account-name $cosmosAccountName `
    --resource-group $resourceGroupName `
    --name "autoclaimai"

# 5. Create Cosmos DB Containers
Write-Host "📦 Creating Cosmos DB Containers..." -ForegroundColor Yellow
az cosmosdb sql container create `
    --account-name $cosmosAccountName `
    --database-name "autoclaimai" `
    --resource-group $resourceGroupName `
    --name "users" `
    --partition-key-path "/id"

az cosmosdb sql container create `
    --account-name $cosmosAccountName `
    --database-name "autoclaimai" `
    --resource-group $resourceGroupName `
    --name "claims" `
    --partition-key-path "/id"

# 6. Create Computer Vision Service
Write-Host "👁️ Creating Computer Vision Service..." -ForegroundColor Yellow
az cognitiveservices account create `
    --name $computerVisionName `
    --resource-group $resourceGroupName `
    --kind ComputerVision `
    --sku S1 `
    --location $location `
    --yes

# 7. Create App Service Plan
Write-Host "📋 Creating App Service Plan..." -ForegroundColor Yellow
az appservice plan create `
    --name $appServicePlanName `
    --resource-group $resourceGroupName `
    --sku B1 `
    --is-linux

# 8. Create Web App
Write-Host "🌐 Creating Web App..." -ForegroundColor Yellow
az webapp create `
    --resource-group $resourceGroupName `
    --plan $appServicePlanName `
    --name $webAppName `
    --runtime "NODE:18-lts"

Write-Host "" -ForegroundColor Green
Write-Host "✅ All Resources Created Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Get connection strings and keys
Write-Host "🔑 Retrieving Connection Information..." -ForegroundColor Yellow

# Storage Account Key
$storageKey = az storage account keys list --resource-group $resourceGroupName --account-name $storageAccountName --query "[0].value" -o tsv
Write-Host "Storage Account: $storageAccountName" -ForegroundColor Cyan
Write-Host "Storage Key: $storageKey" -ForegroundColor Cyan

# Cosmos DB Connection String
$cosmosConnectionString = az cosmosdb keys list --name $cosmosAccountName --resource-group $resourceGroupName --type connection-strings --query "connectionStrings[0].connectionString" -o tsv
$cosmosEndpoint = az cosmosdb show --name $cosmosAccountName --resource-group $resourceGroupName --query "documentEndpoint" -o tsv
$cosmosKey = az cosmosdb keys list --name $cosmosAccountName --resource-group $resourceGroupName --query "primaryMasterKey" -o tsv

Write-Host "Cosmos DB Account: $cosmosAccountName" -ForegroundColor Cyan
Write-Host "Cosmos DB Endpoint: $cosmosEndpoint" -ForegroundColor Cyan
Write-Host "Cosmos DB Key: $cosmosKey" -ForegroundColor Cyan

# Computer Vision Keys
$cvEndpoint = az cognitiveservices account show --name $computerVisionName --resource-group $resourceGroupName --query "properties.endpoint" -o tsv
$cvKey = az cognitiveservices account keys list --name $computerVisionName --resource-group $resourceGroupName --query "key1" -o tsv

Write-Host "Computer Vision Endpoint: $cvEndpoint" -ForegroundColor Cyan
Write-Host "Computer Vision Key: $cvKey" -ForegroundColor Cyan

# Web App URL
$webAppUrl = az webapp show --name $webAppName --resource-group $resourceGroupName --query "defaultHostName" -o tsv
Write-Host "Web App URL: https://$webAppUrl" -ForegroundColor Cyan

Write-Host "" -ForegroundColor Green
Write-Host "📝 Environment Variables for .env file:" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "NODE_ENV=production"
Write-Host "USE_COSMOS_DB=true"
Write-Host "COSMOS_DB_ENDPOINT=$cosmosEndpoint"
Write-Host "COSMOS_DB_KEY=$cosmosKey"
Write-Host "AZURE_STORAGE_ACCOUNT_NAME=$storageAccountName"
Write-Host "AZURE_STORAGE_ACCOUNT_KEY=$storageKey"
Write-Host "AZURE_COMPUTER_VISION_ENDPOINT=$cvEndpoint"
Write-Host "AZURE_COMPUTER_VISION_KEY=$cvKey"
Write-Host "CLIENT_URL=https://$webAppUrl"
Write-Host "JWT_SECRET=$(([System.Web.Security.Membership]::GeneratePassword(32, 8)))"

Write-Host "" -ForegroundColor Green
Write-Host "🎉 Setup Complete! You can now deploy your application." -ForegroundColor Green
