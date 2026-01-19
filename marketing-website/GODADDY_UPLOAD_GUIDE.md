# GoDaddy Upload Guide for tazsoftware.biz

## Step-by-Step Upload Instructions

### Step 1: Access GoDaddy File Manager

1. **Log into GoDaddy**
   - Go to [godaddy.com](https://godaddy.com)
   - Sign in to your account

2. **Navigate to Web Hosting**
   - Go to **My Products** or **Web Hosting**
   - Find your hosting plan for `tazsoftware.biz`
   - Click **Manage** or **cPanel** (depending on your hosting type)

3. **Open File Manager**
   - Look for **File Manager** or **Files** section
   - Click to open it

### Step 2: Find the Correct Directory

The files need to be in the **root directory** of your website. This is typically one of these:

- `public_html/` (most common)
- `www/`
- `htdocs/`
- `httpdocs/`
- Root directory (shown as `/` or `.`)

**How to find it:**
- Look for a folder that contains your current website files
- If you see an existing `index.html` or website files, that's the right folder
- If you're not sure, check both `public_html` and `www`

### Step 3: Upload Files

**Option A: Using File Manager (Recommended)**

1. **Navigate to the root directory** (public_html, www, etc.)
2. **Upload files:**
   - Click **Upload** button (usually at the top)
   - Select all three files:
     - `index.html`
     - `styles.css`
     - `script.js`
   - Wait for upload to complete
   - **Important:** Make sure files are in the root directory, NOT in a subfolder

**Option B: Using FTP**

1. **Get FTP credentials** from GoDaddy:
   - Go to hosting settings
   - Find FTP/File Transfer section
   - Note your FTP host, username, and password

2. **Use an FTP client** (FileZilla, WinSCP, etc.):
   - Connect to your FTP server
   - Navigate to `public_html` or `www` directory
   - Upload the three files

### Step 4: Verify File Locations

After uploading, verify the files are in the correct location:

**Correct structure:**
```
public_html/
  ├── index.html
  ├── styles.css
  └── script.js
```

**Wrong structure (files in subfolder):**
```
public_html/
  └── marketing-website/
      ├── index.html
      ├── styles.css
      └── script.js
```

### Step 5: Set Permissions (if needed)

If files still don't work, check file permissions:

1. **Right-click on each file** in File Manager
2. **Select "Change Permissions"** or "File Permissions"
3. **Set to:** `644` for files, `755` for directories
4. **Apply to all files**

### Step 6: Test the Website

1. **Wait 1-2 minutes** after uploading
2. **Visit:** `https://tazsoftware.biz`
3. **Hard refresh:** `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
4. **Try incognito/private window** to bypass cache

## Troubleshooting "Page Not Found"

### Issue 1: Files in Wrong Directory

**Symptom:** 404 error or "Page Not Found"

**Solution:**
- Check that files are in `public_html/` or `www/` (root directory)
- NOT in a subfolder like `marketing-website/` or `website/`

### Issue 2: Wrong File Names

**Symptom:** Page loads but looks broken

**Solution:**
- Verify file names are exactly:
  - `index.html` (not `Index.html` or `INDEX.HTML`)
  - `styles.css` (not `style.css` or `Styles.css`)
  - `script.js` (not `Script.js` or `SCRIPT.JS`)

### Issue 3: Index File Not Set

**Symptom:** Directory listing shows instead of website

**Solution:**
- GoDaddy should automatically use `index.html` as the default
- If not, check hosting settings for "Directory Index" or "Default Document"
- Ensure `index.html` is listed

### Issue 4: DNS/Propagation Delay

**Symptom:** Old site still shows

**Solution:**
- Wait 5-10 minutes for DNS propagation
- Clear browser cache completely
- Try different browser or incognito mode
- Check if you can access via IP address (if GoDaddy provides it)

### Issue 5: SSL/HTTPS Issues

**Symptom:** Connection errors or security warnings

**Solution:**
- Ensure SSL certificate is active in GoDaddy
- Try accessing `http://tazsoftware.biz` (without 's') to test
- Check SSL settings in hosting control panel

## Quick Checklist

- [ ] Files uploaded to `public_html/` or `www/` (root directory)
- [ ] All three files present: `index.html`, `styles.css`, `script.js`
- [ ] File names are lowercase and match exactly
- [ ] Waited 1-2 minutes after upload
- [ ] Cleared browser cache or used incognito mode
- [ ] Checked file permissions (644 for files)
- [ ] Verified `index.html` is the default document

## Still Not Working?

If you've checked everything above and it's still not working:

1. **Check GoDaddy hosting type:**
   - Some GoDaddy plans use different directory structures
   - Contact GoDaddy support to confirm the correct directory

2. **Verify domain pointing:**
   - Ensure `tazsoftware.biz` is pointing to the correct hosting account
   - Check DNS settings if domain is separate from hosting

3. **Check for .htaccess file:**
   - If there's an `.htaccess` file, it might be redirecting
   - Temporarily rename it to test

4. **Contact GoDaddy Support:**
   - They can verify the correct directory structure
   - They can check if there are any server-side issues

## Alternative: Test with a Simple File

To verify the directory is correct, create a simple test:

1. **Create a file called `test.html`** with this content:
   ```html
   <!DOCTYPE html>
   <html>
   <head><title>Test</title></head>
   <body><h1>It Works!</h1></body>
   </html>
   ```

2. **Upload it to the same directory as `index.html`**

3. **Visit:** `https://tazsoftware.biz/test.html`

4. **If this works**, the directory is correct and the issue is with `index.html`

5. **If this doesn't work**, the files are in the wrong directory
