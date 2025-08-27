# Pinata Setup Guide

## Overview

Pinata is used for IPFS file storage in the Homebaise platform. This guide will help you set up Pinata for the property listing feature.

## Step 1: Create Pinata Account

1. Go to [https://app.pinata.cloud/](https://app.pinata.cloud/)
2. Sign up for a free account
3. Verify your email address

## Step 2: Get Your API Keys

1. Log in to your Pinata dashboard
2. Go to **API Keys** in the left sidebar
3. Click **New Key**
4. Give your key a name (e.g., "Homebaise Property Uploads")
5. Select the following permissions:
   - **Pin File to IPFS** ✅
   - **Pin JSON to IPFS** ✅
   - **Pin By Hash** ✅
   - **Pin List** ✅
6. Click **Create**
7. Copy your **JWT Token** (you'll only see it once!)

## Step 3: Configure Environment Variables

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Add your Pinata JWT token:

```env
NEXT_PUBLIC_PINATA_JWT_TOKEN=your_jwt_token_here
```

3. Restart your development server:
```bash
npm run dev
```

## Step 4: Test the Integration

1. Go to your property listing page (`/list-property`)
2. Try uploading a test image
3. Check the browser console for any errors
4. Verify the file appears in your Pinata dashboard

## Features

### ✅ What Pinata Provides

- **File Upload**: Direct upload to IPFS
- **File Pinning**: Ensures files stay available
- **Gateway Access**: Files accessible via `https://gateway.pinata.cloud/ipfs/{cid}`
- **Metadata Storage**: JSON metadata storage
- **File Management**: View and manage uploaded files

### 📁 File Types Supported

- **Images**: PNG, JPG, JPEG, GIF, WebP (up to 10MB each)
- **Documents**: PDF, DOC, DOCX (up to 20MB each)
- **Metadata**: JSON files for property information

### 🔧 API Endpoints Used

- `POST /pinning/pinFileToIPFS` - Upload files
- `POST /pinning/pinByHash` - Pin existing files
- `GET /pinning/pinList` - List pinned files
- `GET /data/testAuthentication` - Test connection

## Troubleshooting

### Common Issues

1. **"Pinata upload failed"**
   - Check your JWT token is correct
   - Verify the token has the right permissions
   - Ensure your Pinata account is active

2. **"CORS error"**
   - This shouldn't happen with Pinata's API
   - Check your network connection
   - Try refreshing the page

3. **"File too large"**
   - Pinata free tier has limits
   - Consider upgrading or compressing files
   - Check file size before upload

### Debug Mode

Enable debug logging by setting:
```env
NEXT_PUBLIC_DEBUG=true
```

This will show detailed upload information in the console.

## Free Tier Limits

- **Storage**: 1GB
- **File Size**: Up to 100MB per file
- **Requests**: 100 requests per day
- **Bandwidth**: 1GB per month

For production use, consider upgrading to a paid plan.

## Security Notes

- Keep your JWT token secure
- Don't commit `.env.local` to version control
- Use environment-specific tokens for dev/staging/prod
- Monitor your Pinata usage regularly

## Support

- [Pinata Documentation](https://docs.pinata.cloud/)
- [Pinata Support](https://support.pinata.cloud/)
- [IPFS Documentation](https://docs.ipfs.io/)

## Next Steps

Once Pinata is configured:

1. Test file uploads work correctly
2. Verify files are accessible via gateway URLs
3. Check that metadata uploads function
4. Monitor upload performance and errors
5. Consider implementing file optimization (compression, resizing) 