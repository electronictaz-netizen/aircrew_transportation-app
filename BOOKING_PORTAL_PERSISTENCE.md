# Booking Portal: bookingEnabled / bookingCode Not Persisting

## What you see

- In Company Settings: enable the portal, set a booking code (e.g. TEST, BOOKTEST), Save → **success toast, no errors**.
- Disable, Save → **success**. Re-enable, set code, Save → **success**.
- Booking portal URL returns **"Booking Portal Not Found"**; CloudWatch shows `bookingEnabled: null`, `bookingCode: null` for that company.

So the **UpdateCompany** mutation reports success but those two fields are **not** being written to DynamoDB.

---

## 1. Check what the API returns (browser)

After a successful Save with the portal **enabled** and a code set, open DevTools → **Console** and look for:

```
[Company.update] API returned: { bookingEnabled: ..., bookingCode: ..., sent: {...} }
```

- If **`bookingEnabled` and `bookingCode` are `null`**  
  → The AppSync/UpdateCompany resolver is **not** persisting them. Go to §2 and §3.

- If **`bookingEnabled: true` and `bookingCode: "TEST"` (or your code)**  
  → The backend *did* write them. The Lambda may be using a different table/API or there’s a cache. Re-check Lambda config and that it uses the same AppSync/Data source as the main app.

---

## 2. Confirm the backend phase runs and succeeds

The `UpdateCompany` resolver is deployed by `ampx pipeline-deploy` in the **backend** phase of `amplify.yml`. If that phase is skipped or fails, resolvers (and schema) stay old and may not include `bookingCode` / `bookingEnabled`.

1. In **Amplify Console** → your app → **Build history** → latest build.
2. Find the **Backend** / **backend** phase in the log.
3. Check:
   - Does the backend phase run at all? (Some apps are “frontend only” and never run it.)
   - Does `npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID --outputs-out-dir .` finish **without** errors?

If the backend phase is **missing or failed**:

- Re-enable/fix the backend build in **App settings → Build settings** so that `amplify.yml`’s `backend` section is used.
- Fix any `ampx pipeline-deploy` errors (perms, branch, app-id, etc.) so the backend deploys successfully.

---

## 3. Check AppSync schema and resolver

The deployed AppSync API must have `bookingCode` and `bookingEnabled` in the **UpdateCompany** flow. If they were added to `amplify/data/resource.ts` after the last successful backend deploy, the live API may not have them.

1. **AWS Console** → **AppSync** → your API (same as in `amplify_outputs.json` / `data.url`).
2. **Schema**:
   - Find `UpdateCompanyInput`.
   - Confirm `bookingCode` and `bookingEnabled` exist.
3. **Resolvers**:
   - Open the resolver for `Mutation.updateCompany` (or the update mutation used by Amplify Data).
   - Inspect the **request** mapping: it should use `$ctx.args.input` and build a DynamoDB `UpdateExpression` that includes `bookingCode` and `bookingEnabled` when present. If the resolver uses a fixed list of attributes and omits these, they will never be written.

If `UpdateCompanyInput` or the resolver does **not** include these fields:

- The backend (and thus the resolver) was generated from an older schema. **Redeploy the backend** so the resolver is regenerated from the current `amplify/data/resource.ts` (see §4).

---

## 4. Force a backend redeploy

You need a successful run of `ampx pipeline-deploy` for the branch your app uses (e.g. `main`).

### A. Via Amplify Hosting (recommended)

- Ensure the backend phase in `amplify.yml` is executed (see §2).
- Push a commit to the connected branch (or use **Redeploy this version** in the Amplify Console) and wait for the **full** build, including the **backend** phase, to succeed.

### B. Manually from your machine

If you use the Amplify CLI and have the right AWS credentials and app/branch:

```bash
npx ampx pipeline-deploy --branch main --app-id <YOUR_APP_ID> --outputs-out-dir .
```

Use the same `--branch` and `--app-id` as in your Hosting build. `--app-id` is in the Amplify Console URL or in **App settings → General**.

---

## 5. Optional: force resolver regeneration with a schema change

If `ampx pipeline-deploy` has been succeeding but the resolver still doesn’t include `bookingCode` / `bookingEnabled`, a small schema change can force CDK/AppSync to regenerate it.

In `amplify/data/resource.ts`, make a **benign** change to the `Company` model, e.g.:

- Add a comment, or
- Add an optional field you don’t use (e.g. `_schemaRevision: a.string()`) and then run a backend deploy.

Revert the change once the resolver is confirmed to include the booking fields.

---

## 6. Remove the temporary `[Company.update]` log

After the issue is fixed, remove the `console.warn('[Company.update] API returned:', ...)` block from `src/components/CompanyManagement.tsx` in the success path of the company update.
