# Property Listing Feature

## Overview

The Property Listing feature allows verified users to tokenize and list their real estate properties on the Homebaise platform. This feature integrates IPFS for decentralized storage and Supabase for data management.

## Features

### ✅ Implemented Features

1. **User Verification Check**
   - Only users with `kyc_status = 'verified'` can list properties
   - Automatic redirect to KYC verification if not verified

2. **Property Information Form**
   - Property title and description
   - Property type (residential, commercial, industrial, land, agricultural)
   - Location details (country, city, address)
   - Financial information (total value, token price, investment ranges)
   - Yield rate and expected returns

3. **File Upload System**
   - Property images upload (PNG, JPG up to 10MB each)
   - Legal documents upload (PDF, DOC up to 20MB each)
   - File management with remove functionality
   - Upload progress tracking

4. **IPFS Integration**
   - Mock IPFS upload simulation
   - Metadata storage on IPFS
   - Image and document CID generation
   - Progress tracking during uploads

5. **Supabase Integration**
   - Properties table with proper schema
   - Row Level Security (RLS) policies
   - User ownership tracking
   - Status management (pending_review, approved, rejected, active, sold)

6. **User Experience**
   - Responsive design with Tailwind CSS
   - Loading states and progress indicators
   - Form validation
   - Success/error messaging
   - Navigation integration

## Database Schema

### Properties Table

```sql
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  total_value DECIMAL(20,2) NOT NULL,
  token_price DECIMAL(10,2) NOT NULL,
  min_investment DECIMAL(10,2) NOT NULL,
  max_investment DECIMAL(10,2) NOT NULL,
  yield_rate TEXT,
  ipfs_metadata_cid TEXT,
  ipfs_image_cids TEXT[],
  ipfs_document_cids TEXT[],
  listed_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending_review',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### RLS Policies

- **View Policy**: Users can view all approved properties and their own properties
- **Create Policy**: Only verified users can create properties
- **Update Policy**: Users can only update their own properties

## File Structure

```
src/
├── app/
│   └── list-property/
│       └── page.tsx              # Main property listing page
├── lib/
│   ├── ipfs.ts                   # IPFS utility functions
│   └── supabase/
│       └── client.ts             # Supabase client
└── components/
    ├── MagneticEffect.tsx        # Interactive effects
    └── ScrollAnimations.tsx      # Animation components
```

## Usage

### For Users

1. **Access the Feature**
   - Navigate to `/list-property` or click "List Property" on dashboard
   - Must be a verified user (KYC completed)

2. **Fill Property Information**
   - Complete all required fields
   - Upload property images and legal documents
   - Set financial parameters

3. **Submit for Review**
   - Property is uploaded to IPFS
   - Data is stored in Supabase
   - Status set to 'pending_review'

### For Developers

1. **Setup Database**
   ```bash
   # Run the SQL setup
   psql -d your_database -f supabase-properties-setup.sql
   ```

2. **Configure Pinata (IPFS)**
   - Get your Pinata JWT token from https://app.pinata.cloud/
   - Add the token to your environment variables
   - The system will automatically use Pinata for file uploads

3. **Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_PINATA_JWT_TOKEN=your_pinata_jwt_token
   ```

## Future Enhancements

### 🔄 Planned Features

1. **Pinata Integration**
   - ✅ Real Pinata IPFS integration implemented
   - ✅ File pinning for persistence
   - ✅ Gateway URL generation

2. **Advanced Property Details**
   - Property specifications (bedrooms, bathrooms, square footage)
   - Amenities and features
   - Property history and documentation

3. **Review System**
   - Admin review interface
   - Property approval/rejection workflow
   - Feedback system for rejected properties

4. **Hedera Integration**
   - Smart contract deployment
   - Token minting on Hedera
   - Wallet integration for property ownership

5. **Enhanced Validation**
   - File type and size validation
   - Image optimization
   - Document verification

### 🚀 Technical Improvements

1. **Performance**
   - File upload optimization
   - Image compression
   - Batch processing

2. **Security**
   - File scanning for malware
   - Content validation
   - Access control improvements

3. **User Experience**
   - Multi-step form wizard
   - Draft saving
   - Preview functionality

## API Endpoints

### Properties API (Future)

```typescript
// GET /api/properties - List all approved properties
// GET /api/properties/[id] - Get specific property
// POST /api/properties - Create new property (verified users only)
// PUT /api/properties/[id] - Update property (owner only)
// DELETE /api/properties/[id] - Delete property (owner only)
```

## Testing

### Manual Testing Checklist

- [ ] Unverified users are redirected to KYC
- [ ] Form validation works correctly
- [ ] File uploads function properly
- [ ] IPFS upload simulation works
- [ ] Supabase data is stored correctly
- [ ] Success/error messages display
- [ ] Responsive design works on mobile

### Automated Testing (Future)

```typescript
// Unit tests for form validation
// Integration tests for IPFS upload
// E2E tests for complete flow
// API tests for Supabase integration
```

## Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check file size limits
   - Verify file type restrictions
   - Ensure proper file permissions

2. **IPFS Upload Issues**
   - Verify IPFS node connectivity
   - Check network configuration
   - Review error logs

3. **Database Errors**
   - Verify RLS policies
   - Check user permissions
   - Review Supabase configuration

### Debug Mode

Enable debug logging by setting:
```env
NEXT_PUBLIC_DEBUG=true
```

## Contributing

1. Follow the existing code style
2. Add proper TypeScript types
3. Include error handling
4. Test thoroughly before submitting
5. Update documentation as needed

## License

This feature is part of the Homebaise platform and follows the same licensing terms. 