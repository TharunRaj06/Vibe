# AutoClaimAI - Intelligent Vehicle Insurance Claims Management

AutoClaimAI is a full-stack MERN application that leverages Azure AI services to streamline vehicle insurance claims processing. The platform uses Computer Vision to automatically analyze damage photos, estimate repair costs, and expedite claim approvals.

## 🚀 Features

- **AI-Powered Photo Analysis**: Automatic damage severity assessment using Azure Computer Vision
- **Smart Estimates**: Intelligent cost estimation based on damage analysis
- **Real-time Processing**: Instant claim submission and status updates
- **Secure Storage**: Azure Blob Storage for image management
- **NoSQL Database**: Azure Cosmos DB for scalable data storage
- **Email Notifications**: Automated status updates via Azure Communication Services
- **Responsive Design**: Modern React frontend with mobile support
- **Admin Dashboard**: Comprehensive claim management interface

## 🏗️ Architecture

### Frontend (React)
- **Framework**: React 18 with functional components and hooks
- **Routing**: React Router for navigation
- **Forms**: React Hook Form for form validation
- **UI Components**: Custom components with responsive design
- **File Upload**: React Dropzone for image handling
- **Notifications**: React Toastify for user feedback

### Backend (Node.js/Express)
- **Runtime**: Node.js with Express framework
- **Database**: Azure Cosmos DB (MongoDB API)
- **File Storage**: Azure Blob Storage
- **AI Services**: Azure Computer Vision API
- **Email**: Azure Communication Services / SendGrid
- **Security**: Helmet, CORS, Rate limiting

### Azure Services Integration
- **Computer Vision**: Damage analysis and severity classification
- **Blob Storage**: Secure image storage and retrieval
- **Cosmos DB**: Document database for claims and user data
- **Communication Services**: Email notifications and updates

## 📋 Prerequisites

Before setting up the project, ensure you have:

- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- **Azure Account** with active subscription
- **Git** for version control

## 🛠️ Azure Services Setup

### 1. Azure Computer Vision

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new **Computer Vision** resource
3. Choose your subscription, resource group, and region
4. Select pricing tier (F0 for free tier)
5. Note down the **Endpoint URL** and **API Key**

### 2. Azure Blob Storage

1. Create a **Storage Account** in Azure Portal
2. Choose **Standard** performance and **LRS** replication
3. Create a container named `claim-images` with **Private** access
4. Go to **Access Keys** and copy the **Connection String**

### 3. Azure Cosmos DB

1. Create a **Cosmos DB** account
2. Choose **Azure Cosmos DB for MongoDB** API
3. Set up database name: `autoclaimai`
4. Create collections: `users`, `claims`
5. Copy the **Connection String** from **Keys** section

### 4. Azure Communication Services (Optional)

1. Create **Communication Services** resource
2. Go to **Keys** and copy the **Connection String**
3. Or alternatively, set up **SendGrid** for email notifications

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/autoclaimai.git
cd autoclaimai
```

### 2. Server Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit the `.env` file with your Azure credentials:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Azure Cosmos DB
COSMOS_DB_CONNECTION_STRING=your_cosmos_db_connection_string
COSMOS_DB_DATABASE_NAME=autoclaimai

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=your_blob_storage_connection_string
AZURE_STORAGE_CONTAINER_NAME=claim-images

# Azure Computer Vision
AZURE_COMPUTER_VISION_ENDPOINT=your_computer_vision_endpoint
AZURE_COMPUTER_VISION_KEY=your_computer_vision_api_key

# Email Service (Choose one)
# Option 1: Azure Communication Services
AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING=your_acs_connection_string

# Option 2: SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@autoclaimai.com

# Fallback MongoDB (for local development)
MONGODB_URI=mongodb://localhost:27017/autoclaimai
USE_COSMOS_DB=true
```

### 3. Client Setup

```bash
# Navigate to client directory
cd ../client

# Install dependencies
npm install
```

### 4. Start the Development Servers

**Terminal 1 - Start Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Start Frontend:**
```bash
cd client
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🗂️ Project Structure

```
autoclaimai/
├── client/                     # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   └── Layout/         # Navigation and footer
│   │   ├── pages/              # Page components
│   │   │   ├── Auth/           # Login and registration
│   │   │   ├── Claims/         # Claim management
│   │   │   ├── Dashboard/      # User dashboard
│   │   │   └── Profile/        # User profile
│   │   ├── services/           # API service layer
│   │   ├── utils/              # Utility functions
│   │   ├── App.js              # Main app component
│   │   └── index.js            # Entry point
│   └── package.json
├── server/                     # Node.js backend
│   ├── middleware/             # Custom middleware
│   ├── models/                 # Database models
│   │   ├── User.js
│   │   └── Claim.js
│   ├── routes/                 # API routes
│   │   ├── users.js
│   │   └── claims.js
│   ├── services/               # Azure service integrations
│   │   ├── azureBlobStorage.js
│   │   ├── azureComputerVision.js
│   │   ├── azureCosmosDB.js
│   │   └── notificationService.js
│   ├── server.js               # Main server file
│   └── package.json
├── README.md
└── .env.example                # Environment variables template
```

## 🔌 API Endpoints

### Users
- `POST /api/users/register` - Register new user
- `GET /api/users/:userId` - Get user by ID
- `GET /api/users/email/:email` - Get user by email
- `PATCH /api/users/:userId` - Update user profile
- `GET /api/users` - Get all users (admin)
- `DELETE /api/users/:userId` - Delete user (admin)

### Claims
- `POST /api/claims/submit` - Submit new claim with images
- `GET /api/claims/user/:userId` - Get user's claims
- `GET /api/claims/:claimId` - Get claim details
- `GET /api/claims/admin/all` - Get all claims (admin)
- `PATCH /api/claims/:claimId/status` - Update claim status (admin)
- `DELETE /api/claims/:claimId` - Delete claim (admin)
- `GET /api/claims/admin/statistics` - Get claim statistics

## 🤖 AI Integration

### Computer Vision Analysis

The application automatically analyzes uploaded images using Azure Computer Vision:

1. **Image Upload**: Users upload damage photos
2. **AI Processing**: Computer Vision analyzes images for:
   - Damage type detection
   - Severity classification (minor/moderate/severe)
   - Object recognition
   - Text extraction (if applicable)
3. **Cost Estimation**: Based on analysis results:
   - Minor damage: Base cost × 1
   - Moderate damage: Base cost × 2.5
   - Severe damage: Base cost × 5

### Damage Classification Logic

```javascript
const analyzeDamage = (visionResults) => {
  // Analyze computer vision results
  // Classify damage severity
  // Generate cost estimates
  // Return structured analysis
}
```

## 📧 Email Notifications

Automated emails are sent for:
- **Claim Submission Confirmation**
- **Status Updates** (Under Review, Approved, Rejected)
- **Final Approval with Amount**

Configure either Azure Communication Services or SendGrid in the environment variables.

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: Type and size restrictions
- **CORS Configuration**: Controlled cross-origin requests
- **Environment Variables**: Sensitive data protection

## 🚀 Deployment

### Azure App Service Deployment

1. **Create App Service**:
   ```bash
   az webapp create --resource-group myResourceGroup --plan myAppServicePlan --name autoclaimai --runtime "NODE|16-lts"
   ```

2. **Deploy Backend**:
   ```bash
   cd server
   zip -r ../server.zip .
   az webapp deployment source config-zip --resource-group myResourceGroup --name autoclaimai --src ../server.zip
   ```

3. **Deploy Frontend** (to Azure Static Web Apps):
   ```bash
   cd client
   npm run build
   # Deploy build folder to Azure Static Web Apps
   ```

4. **Configure Environment Variables** in Azure App Service settings

### Alternative: Docker Deployment

```dockerfile
# Dockerfile for backend
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

### Run Backend Tests
```bash
cd server
npm test
```

### Run Frontend Tests
```bash
cd client
npm test
```

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Claim submission with image upload
- [ ] AI analysis results display
- [ ] Claim status updates
- [ ] Email notifications
- [ ] Admin dashboard functionality
- [ ] Responsive design on mobile

## 🐛 Troubleshooting

### Common Issues

1. **Azure Connection Errors**:
   - Verify connection strings in `.env`
   - Check Azure resource availability
   - Ensure proper access permissions

2. **Image Upload Failures**:
   - Check Azure Blob Storage container permissions
   - Verify file size limits (10MB max)
   - Ensure supported image formats

3. **Computer Vision API Errors**:
   - Validate API key and endpoint
   - Check service quota limits
   - Verify image URL accessibility

4. **Database Connection Issues**:
   - Confirm Cosmos DB connection string
   - Check network connectivity
   - Verify database and collection names

### Debug Mode

Enable debug logging:
```env
NODE_ENV=development
DEBUG=autoclaimai:*
```

## 📚 Additional Resources

- [Azure Computer Vision Documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/computer-vision/)
- [Azure Blob Storage SDK](https://docs.microsoft.com/en-us/javascript/api/@azure/storage-blob/)
- [Azure Cosmos DB MongoDB API](https://docs.microsoft.com/en-us/azure/cosmos-db/mongodb-introduction)
- [React Documentation](https://reactjs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



---

**AutoClaimAI** - Transforming insurance claims with the power of AI 🚗✨
