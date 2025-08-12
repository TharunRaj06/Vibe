# Azure Resources Creation Guide for AutoClaimAI

## Overview
This guide will help you create all necessary Azure resources for your AutoClaimAI application through the Azure Portal.

## Resources to Create

### 1. Resource Group ✅ (Already Created)
- **Name**: AutoClaimAI-RG
- **Location**: East US
- **Status**: ✅ Created successfully

### 2. Azure Cosmos DB
**Manual Creation Steps:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → Search for "Azure Cosmos DB"
3. Select "Azure Cosmos DB" → Click "Create"
4. Configuration:
   - **Subscription**: Visual Studio Enterprise Subscription – MPN
   - **Resource Group**: AutoClaimAI-RG
   - **Account Name**: autoclaimai-cosmosdb-[random-number]
   - **API**: Core (SQL) - NoSQL
   - **Location**: West US 2 (due to East US capacity issues)
   - **Capacity Mode**: Serverless (for cost optimization)
   - **Apply Free Tier Discount**: Yes
5. Click "Review + Create" → "Create"

**After Creation:**
- Create Database: "autoclaimai"
- Create Containers:
  - Container 1: "users" (Partition key: /id)
  - Container 2: "claims" (Partition key: /id)

### 3. Azure Storage Account
**Manual Creation Steps:**
1. Go to Azure Portal → "Create a resource" → "Storage account"
2. Configuration:
   - **Subscription**: Visual Studio Enterprise Subscription – MPN
   - **Resource Group**: AutoClaimAI-RG
   - **Storage Account Name**: autoclaimai[random6digits]
   - **Region**: West US 2
   - **Performance**: Standard
   - **Redundancy**: LRS (Locally redundant storage)
   - **Account Kind**: StorageV2
3. Click "Review + Create" → "Create"

**After Creation:**
- Create Container: "claim-documents" (for file uploads)

### 4. Computer Vision Service ✅ (Already Created)
- **Name**: autoclaimai-cv-1686
- **Location**: East US
- **Pricing Tier**: S1
- **Endpoint**: https://eastus.api.cognitive.microsoft.com/
- **Key**: ee6b49fdd2e44352a82e4f14dc26f67f
- **Status**: ✅ Created successfully

### 5. App Service Plan and Web App
**Manual Creation Steps:**
1. Go to Azure Portal → "Create a resource" → "Web App"
2. Configuration:
   - **Subscription**: Visual Studio Enterprise Subscription – MPN
   - **Resource Group**: AutoClaimAI-RG
   - **Name**: autoclaimai-webapp-[random]
   - **Publish**: Code
   - **Runtime Stack**: Node 18 LTS
   - **Operating System**: Linux
   - **Region**: West US 2
   - **App Service Plan**: Create new "autoclaimai-plan" (B1 Basic)
3. Click "Review + Create" → "Create"

### 6. Azure Active Directory App Registration (for Authentication)
**Manual Creation Steps:**
1. Go to Azure Portal → "Azure Active Directory" → "App registrations"
2. Click "New registration"
3. Configuration:
   - **Name**: AutoClaimAI-App
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: Web → https://[your-webapp-name].azurewebsites.net/api/auth/callback
4. Click "Register"

**After Creation:**
1. Go to "Certificates & secrets" → "New client secret"
2. Add description: "AutoClaimAI App Secret"
3. Copy the secret value (you won't see it again!)
4. Note down:
   - Application (client) ID
   - Directory (tenant) ID
   - Client Secret

### 7. SendGrid Email Service
**Option 1: Through Azure Marketplace**
1. Go to Azure Portal → "Create a resource" → Search "SendGrid"
2. Select "SendGrid Email Delivery"
3. Configuration:
   - **Plan**: Free tier (25,000 emails/month)
   - **Resource Group**: AutoClaimAI-RG
   - **Account Name**: autoclaimai-sendgrid

**Option 2: Direct SendGrid Account**
1. Go to [SendGrid.com](https://sendgrid.com)
2. Sign up for free account
3. Verify your account
4. Create API Key in Settings → API Keys

## Environment Variables Configuration

After creating all resources, update your `.env.production` file:

```env
# Production Environment Variables
NODE_ENV=production
PORT=8080

# Database Configuration
USE_COSMOS_DB=true
COSMOS_DB_ENDPOINT=[Get from Cosmos DB Settings → Keys]
COSMOS_DB_KEY=[Get from Cosmos DB Settings → Keys → Primary Key]
COSMOS_DB_DATABASE_ID=autoclaimai

# Azure Services
AZURE_STORAGE_ACCOUNT_NAME=[Your storage account name]
AZURE_STORAGE_ACCOUNT_KEY=[Get from Storage Account → Access Keys → Key1]
AZURE_STORAGE_CONTAINER_NAME=claim-documents

# Computer Vision (Already Available)
AZURE_COMPUTER_VISION_ENDPOINT=https://eastus.api.cognitive.microsoft.com/
AZURE_COMPUTER_VISION_KEY=ee6b49fdd2e44352a82e4f14dc26f67f

# Authentication
JWT_SECRET=[Generate a random 32-character string]
AZURE_AD_CLIENT_ID=[Application ID from App Registration]
AZURE_AD_CLIENT_SECRET=[Client Secret from App Registration]
AZURE_AD_TENANT_ID=[Directory ID from App Registration]

# Client Configuration
CLIENT_URL=https://[your-webapp-name].azurewebsites.net

# Email/Notification Service
SENDGRID_API_KEY=[API Key from SendGrid]
NOTIFICATION_EMAIL=[Your notification email address]
```

## Deployment Configuration

### Configure Web App Environment Variables:
1. Go to your Web App in Azure Portal
2. Navigate to "Configuration" → "Application settings"
3. Add all the environment variables listed above
4. Click "Save"

### Configure Deployment:
1. In your Web App, go to "Deployment Center"
2. Choose your deployment source:
   - **GitHub**: Connect your repository
   - **Local Git**: Use Azure Git repository
   - **Azure DevOps**: Connect your Azure DevOps project

## Cost Optimization Tips
1. **Cosmos DB**: Use Serverless mode for development
2. **App Service**: Start with B1 Basic, scale up if needed
3. **Storage**: Use LRS redundancy for development
4. **SendGrid**: Use free tier (25,000 emails/month)
5. **Computer Vision**: Monitor usage to stay within limits

## Next Steps
1. Create the resources manually through Azure Portal
2. Gather all connection strings and keys
3. Update your `.env.production` file
4. Configure Web App environment variables
5. Deploy your application
6. Test all functionality

## Troubleshooting
- If regions show capacity issues, try different regions (West US 2, Central US, North Europe)
- For Cosmos DB capacity issues, consider using existing resources or different regions
- Monitor costs in Azure Cost Management
