# Aircrew Transportation Management System

A comprehensive React application built with AWS Amplify Gen 2 for managing aircrew transportation scheduling and assignments.

## Features

### Management Dashboard
- **Trip Scheduling**: Create and manage transportation trips with:
  - Trip Type Selection (Airport Trip with flight number or Standard Trip with job/PO number)
  - Pickup Date and Time
  - Flight Number (for Airport Trips) or Job/PO Number (for Standard Trips)
  - Pickup Location (with category support)
  - Dropoff Location (with category support)
  - Number of Passengers
  - Driver Assignment
  - Status Tracking (Unassigned, Assigned, InProgress, Completed)
  - GPS Location Tracking (start and completion coordinates with reverse geocoding)
- **Driver Management**: Add, edit, and manage driver information with notification preferences
- **Location Management**: Manage saved locations with categories for better organization
- **Filter Categories**: Create custom filters for trip organization and searching
- **Calendar View**: Visual monthly calendar showing trips by date
- **Driver Reports**: Comprehensive analytics on driver performance, trips by airline, and statistics
- **Trip Reports**: Analytics on trips by status, airline, location, and driver
- **Real-time Flight Status**: Integration with flight status APIs (premium tier) or FlightRadar24 links (standard tier)
- **Trip Tracking**: View actual pickup and dropoff times recorded by drivers
- **Daily Assignment Emails**: Send daily summaries to all drivers or specific drivers

### Driver Dashboard
- **Assigned Jobs View**: Drivers see all their assigned transportation jobs
- **Job Details**: View pickup/dropoff locations, flight numbers/job identifiers, passenger counts, and scheduled times
- **GPS Location Recording**: Automatically records GPS coordinates when starting or completing trips
- **Timestamp Recording**: One-click buttons to record actual pickup and dropoff times
- **Flight Status**: Real-time flight status information (premium tier) or FlightRadar24 links (standard tier)
- **Auto-Refresh**: Dashboard automatically refreshes every 30 seconds to show new assignments

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- AWS Account
- GitHub Account (for deployment)
- Flight Status API Key (optional, for flight status features)

## Project Structure

```
Aircrew transportation app/
├── amplify/
│   ├── backend.ts          # Amplify backend configuration
│   ├── auth/
│   │   └── resource.ts     # Authentication configuration
│   └── data/
│       └── resource.ts     # Data model schema
├── src/
│   ├── components/
│   │   ├── ManagementDashboard.tsx
│   │   ├── DriverDashboard.tsx
│   │   ├── TripForm.tsx
│   │   ├── TripList.tsx
│   │   ├── DriverManagement.tsx
│   │   └── Navigation.tsx
│   ├── utils/
│   │   └── flightStatus.ts # Flight status API integration
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
└── README.md
```

## Installation and Setup

### 1. Install Dependencies

```bash
cd "Aircrew transportation app"
npm install
```

### 2. Configure AWS Amplify Gen 2

#### Option A: Using AWS Amplify Console (Recommended)

1. **Create a New App in AWS Amplify Console**:
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click "New app" → "Host web app"
   - Select "GitHub" as your source
   - Authorize GitHub and select your repository
   - Choose the branch (e.g., `main`)

2. **Configure Build Settings**:
   - The `amplify.yml` file is already configured
   - Amplify will automatically detect the build settings

3. **Set Environment Variables** (if using flight status API):
   - In Amplify Console, go to your app → Environment variables
   - Add: `VITE_FLIGHT_API_KEY` with your API key value

#### Option B: Using Amplify CLI

```bash
# Install Amplify CLI globally
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize Amplify in your project
npx ampx sandbox
```

### 3. Set Up Flight Status API (Optional)

1. **Get an API Key**:
   - Sign up at [AviationStack](https://aviationstack.com/) (free tier available)
   - Or use another flight status API service

2. **Configure API Key**:
   - For local development: Create a `.env` file:
     ```
     VITE_FLIGHT_API_KEY=your_api_key_here
     ```
   - For production: Add as environment variable in AWS Amplify Console

### 4. Local Development

```bash
# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`

## Deployment to AWS Amplify

### Step 1: Initialize Git Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Aircrew Transportation App"

# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/aircrew-transportation.git

# Push to GitHub
git push -u origin main
```

### Step 2: Deploy via AWS Amplify Console

1. **Go to AWS Amplify Console**:
   - Navigate to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Sign in to your AWS account

2. **Create New App**:
   - Click "New app" → "Host web app"
   - Select "GitHub" as your source provider
   - Authorize AWS Amplify to access your GitHub account
   - Select your repository: `aircrew-transportation` (or your repo name)
   - Select the branch: `main` (or your default branch)

3. **Configure App Settings**:
   - App name: `aircrew-transportation` (or your preferred name)
   - Environment: `production` (or create multiple environments)
   - The build settings should auto-detect from `amplify.yml`

4. **Review and Deploy**:
   - Review the build settings
   - Click "Save and deploy"
   - Amplify will:
     - Set up the backend (Auth, Data)
     - Build the frontend
     - Deploy to a CloudFront distribution
     - Provide you with a URL

### Step 3: Configure Backend Resources

After the first deployment:

1. **Access Backend Resources**:
   - In Amplify Console, go to your app
   - Navigate to "Backend environments"
   - Click on your environment

2. **Set Up Authentication**:
   - The authentication is already configured in `amplify/auth/resource.ts`
   - Users can sign up with email

3. **Set Up Data Model**:
   - The data model is configured in `amplify/data/resource.ts`
   - Amplify will create DynamoDB tables automatically

### Step 4: Set Environment Variables

1. In Amplify Console, go to your app
2. Navigate to "Environment variables"
3. Add the following if using flight status API:
   - Key: `VITE_FLIGHT_API_KEY`
   - Value: Your API key
4. Redeploy the app for changes to take effect

### Step 5: Access Your Deployed App

- After deployment, Amplify provides a URL like: `https://main.xxxxx.amplifyapp.com`
- You can also set up a custom domain in the Amplify Console

## Using the Application

### First-Time Setup

1. **Sign Up**:
   - Visit your deployed app URL
   - Click "Create account"
   - Enter your email and password
   - Verify your email (if email verification is enabled)

2. **Add Drivers**:
   - Go to Management Dashboard
   - Click "Manage Drivers"
   - Add driver information (name, email, phone, license number)
   - **Important**: Use the same email for drivers that matches their login email

3. **Create Trips**:
   - Click "New Trip"
   - Fill in trip details
   - Assign a driver (optional)
   - Save the trip

### For Drivers

1. **Access Driver Dashboard**:
   - Sign in with the email associated with your driver profile
   - Navigate to "Driver View"
   - View all assigned trips

2. **Record Pickup/Dropoff**:
   - When you arrive at pickup location, click "Record Pickup"
   - When you complete dropoff, click "Record Dropoff"
   - Timestamps are automatically recorded

## Data Model

### Driver
- `id`: Unique identifier
- `name`: Driver's full name
- `email`: Email address (should match login email)
- `phone`: Contact phone number
- `licenseNumber`: Driver's license number
- `isActive`: Boolean flag for active/inactive status

### Trip
- `id`: Unique identifier
- `tripType`: Trip type ("Airport Trip" or "Standard Trip")
- `pickupDate`: Scheduled pickup date and time
- `flightNumber`: Flight number (e.g., AA1234) or job/PO identifier for Standard Trips
- `pickupLocation`: Pickup location address
- `dropoffLocation`: Dropoff location address
- `numberOfPassengers`: Number of passengers
- `status`: Trip status (Unassigned, Assigned, InProgress, Completed)
- `driverId`: Reference to assigned driver
- `actualPickupTime`: Timestamp when driver recorded pickup
- `actualDropoffTime`: Timestamp when driver recorded dropoff
- `startLocationLat`: GPS latitude when trip was started
- `startLocationLng`: GPS longitude when trip was started
- `completeLocationLat`: GPS latitude when trip was completed
- `completeLocationLng`: GPS longitude when trip was completed
- `flightStatus`: Current flight status
- `flightStatusLastUpdated`: Last time flight status was checked

### Location
- `id`: Unique identifier
- `companyId`: Reference to company (for multi-tenancy)
- `name`: Location name
- `address`: Full address
- `description`: Additional details
- `category`: Location category (e.g., "Airport", "Hotel", "Office", "Other")
- `isActive`: Active status flag

## Customization

### Adding More Fields

To add more fields to trips or drivers, edit `amplify/data/resource.ts`:

```typescript
Trip: a.model({
  // ... existing fields
  newField: a.string(),
})
```

Then run:
```bash
npx ampx sandbox --once
```

### Changing Flight Status API

Edit `src/utils/flightStatus.ts` to integrate with a different flight status API provider.

## Troubleshooting

### Build Failures

1. **Check Node.js version**: Ensure you're using Node.js 18.x or higher
2. **Clear cache**: Delete `node_modules` and `package-lock.json`, then run `npm install`
3. **Check Amplify outputs**: Ensure `amplify_outputs.json` is properly generated

### Authentication Issues

1. **Check user pool configuration**: Verify in AWS Cognito Console
2. **Check email verification**: Ensure email verification is completed
3. **Check IAM permissions**: Verify Amplify has proper permissions

### Flight Status Not Working

1. **Check API key**: Verify `VITE_FLIGHT_API_KEY` is set correctly
2. **Check API limits**: Free tier APIs have rate limits
3. **Check flight number format**: Ensure flight numbers are in correct format (e.g., AA1234)

## Security Considerations

1. **API Keys**: Never commit API keys to Git. Use environment variables.
2. **Authentication**: All data operations require authentication
3. **Authorization**: Users can only access their own data (configured via Amplify authorization)

## Support and Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [AWS Amplify Gen 2 Guide](https://docs.amplify.aws/react/build-a-backend/)
- [React Documentation](https://react.dev/)
- [AviationStack API Documentation](https://aviationstack.com/documentation)

## License

This project is provided as-is for demonstration purposes.
