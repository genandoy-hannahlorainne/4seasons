# Cloudflare Pages Configuration

## Build Settings

For the frontend Angular application, use the following Cloudflare Pages build configuration:

### Framework preset
- **Framework**: Angular

### Build settings
- **Build command**: `npm ci && npm run build`
- **Build output directory**: `dist/frontend/browser`
- **Root directory**: `frontend` (set this to frontend)

### Environment variables
Add these in Cloudflare Pages dashboard if needed:
- `NODE_VERSION`: `20`
- `NPM_VERSION`: `10` (optional)

### Node version
The `.node-version` file in the frontend directory specifies Node 20.

### Important files
- `frontend/_headers`: Security headers configuration
- `frontend/_redirects`: SPA routing configuration (redirects all routes to index.html)
- `frontend/.node-version`: Specifies Node.js version

## Troubleshooting

If the build fails:
1. In Cloudflare Pages dashboard, set the "Root directory" to `frontend`
2. Verify the build command is: `npm ci && npm run build`
3. Check that the output directory path is: `dist/frontend/browser`
4. Ensure Node version 20 is being used (check `.node-version` file)
5. Check build logs for specific npm or Angular CLI errors
6. Verify that the framework preset is set to "Angular" or "None" (custom)
