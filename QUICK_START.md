# Quick Start Guide

Get your Aircrew Transportation App up and running in minutes!

## Prerequisites

- Node.js 18.x or higher
- npm or yarn
- AWS Account (for deployment)

## Local Development Setup

### 1. Install Dependencies

```bash
cd "Aircrew transportation app"
npm install
```

### 2. Set Up Environment Variables (Optional)

Create a `.env` file in the root directory:

```env
VITE_FLIGHT_API_KEY=your_api_key_here
```

**Note**: Flight status API is optional. The app will work without it, but flight status will show as "Unknown".

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 4. Set Up Amplify Backend (Local)

For local development with Amplify Gen 2:

```bash
# Install Amplify CLI (if not already installed)
npm install -g @aws-amplify/cli

# Start Amplify sandbox (creates local backend)
npx ampx sandbox
```

This will:
- Create local backend resources
- Generate `amplify_outputs.json`
- Start a local development environment

**Note**: For production deployment, you'll deploy through AWS Amplify Console (see DEPLOYMENT.md).

## First-Time Usage

### 1. Sign Up

1. Open the app in your browser
2. Click "Create account"
3. Enter your email and password
4. Verify your email (check your inbox)

### 2. Add a Driver

1. Sign in to the app
2. Go to "Management" dashboard
3. Click "Manage Drivers"
4. Click "+ Add Driver"
5. Fill in driver information:
   - **Name**: Driver's full name
   - **Email**: Use the same email the driver will use to sign in
   - **Phone**: Contact number
   - **License Number**: Driver's license
   - **Active**: Check to make driver available
6. Click "Create Driver"

### 3. Create a Trip

1. In Management dashboard, click "+ New Trip"
2. Fill in trip details:
   - **Pickup Date and Time**: When to pick up
   - **Flight Number**: e.g., AA1234
   - **Pickup Location**: Where to pick up
   - **Dropoff Location**: Where to drop off
   - **Number of Passengers**: How many passengers
   - **Driver Assigned**: Select a driver (optional)
3. Click "Create Trip"

### 4. Test Driver View

1. Sign out
2. Sign in with the driver's email address
3. Go to "Driver View"
4. You should see the assigned trip
5. Test "Record Pickup" and "Record Dropoff" buttons

## Common Tasks

### Adding Multiple Drivers

1. Go to Management → Manage Drivers
2. Click "+ Add Driver" for each driver
3. Ensure each driver's email matches their login email

### Assigning a Trip to a Driver

1. Create or edit a trip
2. Select a driver from the "Driver Assigned" dropdown
3. Save the trip
4. The status will automatically change to "Assigned"

### Viewing All Trips

- Management dashboard shows all trips in a table
- Filter by status, driver, or date
- Edit or delete trips as needed

### Recording Pickup/Dropoff Times

1. Driver signs in and goes to Driver View
2. When arriving at pickup location, click "Record Pickup"
3. When completing dropoff, click "Record Dropoff"
4. Times are automatically recorded with current timestamp

## Troubleshooting

### App Won't Start

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Authentication Errors

- Ensure you've verified your email
- Check that you're using the correct email/password
- Clear browser cache and cookies

### Data Not Loading

- Check browser console for errors
- Verify `amplify_outputs.json` exists and is valid
- Ensure backend is running (if using local sandbox)

### Flight Status Not Working

- Verify `VITE_FLIGHT_API_KEY` is set in `.env`
- Check API key is valid and has quota remaining
- Flight status may show "Unknown" if API is unavailable

## Next Steps

- **Deploy to Production**: See `DEPLOYMENT.md` for full deployment guide
- **Customize**: Edit components in `src/components/`
- **Add Features**: Extend the data model in `amplify/data/resource.ts`

## Getting Help

- Check `README.md` for detailed documentation
- Review `DEPLOYMENT.md` for deployment instructions
- Check AWS Amplify documentation for backend questions

---

**Happy coding!** 🚀
