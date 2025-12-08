# Render Static Site Deployment Guide

## 🚀 Deployment Steps for Render

### 1. Static Site Settings

**Build Command:**
```bash
cd Project-IRIS-2.0 && rm -rf node_modules package-lock.json && npm install && npm run build
```

**Publish Directory:**
```
Project-IRIS-2.0/dist
```

### 2. Environment Variables

Add these in Render's Environment section:

```env
NODE_VERSION=20.11.0
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
VITE_FRONTEND_URL=https://your-frontend-url.onrender.app
```

### 3. Root Directory (IMPORTANT!)

Since your frontend is in a subdirectory, set:
- **Root Directory**: `Project-IRIS-2.0`

This tells Render to run all commands from inside the Project-IRIS-2.0 folder.

## 🔧 Alternative: Use render.yaml

Create a `render.yaml` in the root (`proto/`) directory for auto-configuration:

```yaml
services:
  # Backend Web Service
  - type: web
    name: iris-backend
    runtime: node
    rootDir: backend
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGO_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
      - key: RAZORPAY_KEY_ID
        sync: false
      - key: RAZORPAY_KEY_SECRET
        sync: false

  # Frontend Static Site
  - type: web
    name: iris-frontend
    runtime: static
    rootDir: Project-IRIS-2.0
    buildCommand: rm -rf node_modules package-lock.json && npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: NODE_VERSION
        value: 20.11.0
      - key: VITE_GEMINI_API_KEY
        sync: false
      - key: VITE_API_BASE_URL
        sync: false
      - key: VITE_FRONTEND_URL
        sync: false
```

## 🐛 Troubleshooting the Rollup Error

The error occurs because of npm's optional dependencies bug. Solutions:

### Solution 1: Use Node.js 20 (Recommended)
Set in Render dashboard:
```
NODE_VERSION=20.11.0
```

### Solution 2: Clean Install (Current Fix)
Build command that removes cache:
```bash
cd Project-IRIS-2.0 && rm -rf node_modules package-lock.json && npm install && npm run build
```

### Solution 3: Update package-lock.json locally
```bash
cd Project-IRIS-2.0
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "Update package-lock.json for Render compatibility"
git push
```

## 📋 Step-by-Step Setup

1. **Go to Render Dashboard** → New Static Site

2. **Connect Repository**: `Project-IRIS-2.0`

3. **Configure Settings**:
   - **Name**: `iris-frontend` (or your choice)
   - **Root Directory**: `Project-IRIS-2.0`
   - **Build Command**: 
     ```
     rm -rf node_modules package-lock.json && npm install && npm run build
     ```
   - **Publish Directory**: `dist`

4. **Add Environment Variables**:
   - `NODE_VERSION`: `20.11.0`
   - `VITE_GEMINI_API_KEY`: Your Gemini API key
   - `VITE_API_BASE_URL`: Your backend URL (e.g., `https://iris-backend.onrender.com/api`)
   - `VITE_FRONTEND_URL`: Your frontend URL (will be provided by Render)

5. **Deploy!**

## 🔄 After Deployment

1. **Update Backend CORS**:
   - Go to backend Render service
   - Update `FRONTEND_URL` environment variable with your deployed frontend URL
   - Example: `https://iris-frontend.onrender.app`

2. **Update Frontend API URL** (if needed):
   - Update `VITE_API_BASE_URL` with your deployed backend URL
   - Trigger redeploy

## ✅ Verification

After deployment:
```bash
# Check if frontend is accessible
curl https://your-frontend-url.onrender.app

# Check if it can reach backend
# Open browser console and test API calls
```

## 📝 Common Issues

### Build Still Fails
- Try Node.js version 18.x or 20.x instead of 22.x
- Check Render build logs for specific errors

### CORS Errors After Deployment
- Ensure backend `FRONTEND_URL` matches your deployed frontend URL exactly
- No trailing slash in URLs

### Environment Variables Not Working
- Frontend: Must start with `VITE_`
- Rebuild after adding/changing environment variables

## 🎯 Production Checklist

- [ ] Root directory set to `Project-IRIS-2.0`
- [ ] Node version set to 20.11.0
- [ ] All VITE_ environment variables added
- [ ] Backend CORS configured with frontend URL
- [ ] Frontend API URL points to backend
- [ ] Test all features after deployment
