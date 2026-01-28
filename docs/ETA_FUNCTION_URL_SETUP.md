# getTripEta Function URL Setup

The dispatcher map shows **ETA to dropoff** (driving time from current vehicle position to dropoff) when the getTripEta Lambda is exposed via a Function URL and the frontend env is set.

## What getTripEta does

- **Lambda:** `getTripEta` – calls OSRM (router.project-osrm.org) for driving route from origin to destination; returns `{ durationMinutes, distanceKm }` with CORS headers.
- **Frontend:** `src/utils/tripEta.ts` – `fetchEtaToDropoff(originLat, originLng, destLat, destLng)` calls the Function URL (2-minute cache). `VehicleTrackingMap` shows "ETA to dropoff: ~X min" in the marker popup when `VITE_ETA_FUNCTION_URL` is set.

If `VITE_ETA_FUNCTION_URL` is not set, the map works normally; ETA simply does not appear.

## Step 1: Deploy backend

Deploy so the getTripEta Lambda exists:

```bash
npx ampx pipeline-deploy --branch main --app-id YOUR_APP_ID
```

Or for sandbox:

```bash
npx ampx sandbox
```

## Step 2: Create Function URL in AWS Lambda

1. Open **AWS Lambda** in the AWS Console.
2. Find the getTripEta function (name like `[app-id]-[branch]-getTripEta-[hash]`).
3. Open the function → **Configuration** → **Function URL** (left sidebar).
4. Click **Create function URL**.
   - **Auth type:** NONE (the Lambda uses query/body params only; no auth required if you accept public ETA calls from your frontend origin).
   - **CORS:** Enable CORS. Add your frontend origin(s) (e.g. `https://your-app.amplifyapp.com`, `http://localhost:5173`) to **Allow origin**.
5. Save and copy the **Function URL** (e.g. `https://[id].lambda-url.[region].on.aws/`).

## Step 3: Set frontend env

Set the URL in the environment used by the frontend:

- **Local:** In project root `.env.local`:
  ```env
  VITE_ETA_FUNCTION_URL=https://[id].lambda-url.[region].on.aws
  ```
  (No trailing slash.) Restart `npm run dev` after changing.

- **Amplify Hosting:** In Amplify Console → App → Hosting → Environment variables, add:
  - **Key:** `VITE_ETA_FUNCTION_URL`
  - **Value:** the getTripEta Function URL (no trailing slash).

Redeploy the frontend so the build picks up the variable.

## Step 4: Verify

1. Open the dispatcher map with at least one active trip that has **dropoff coordinates** (trip created/saved with geocoding).
2. When the driver is sending location and the map shows the vehicle, open the marker popup.
3. You should see **ETA to dropoff: ~X min** when the URL is set and OSRM returns a route.

## Troubleshooting

- **ETA never appears:** Ensure `VITE_ETA_FUNCTION_URL` is set and the frontend was built/restarted after setting it. Ensure the trip has `dropoffLat` and `dropoffLng` (geocoding on save).
- **CORS errors:** In Lambda Function URL configuration, enable CORS and add your frontend origin to allowed origins.
- **Lambda errors:** Check CloudWatch Logs for the getTripEta function; OSRM can be rate-limited or unreachable from the Lambda region.
