# Product Management System Setup

This guide will help you set up the product management system using Supabase as the backend.

## Prerequisites

1. A Supabase account (sign up at [https://supabase.com](https://supabase.com))
2. Basic knowledge of HTML, JavaScript, and SQL

## Setup Instructions

### 1. Create a new Supabase project

1. Log in to your Supabase dashboard
2. Click "New Project"
3. Fill in your project details and create the project
4. Wait for the project to be ready (may take a few minutes)

### 2. Set up the database

1. Go to the SQL Editor in your Supabase dashboard
2. Click "New Query"
3. Copy the contents of `supabase/migrations/20230910_create_products_table.sql`
4. Paste and run the SQL script

### 3. Configure CORS

1. Go to Authentication > URL Configuration in your Supabase dashboard
2. Add your development and production domains to the "Site URL" and "Additional Redirect URLs"
   - For local development: `http://localhost`, `http://localhost:5500` (or your local server port)
   - Add your production domain when ready

### 4. Update Supabase Configuration

1. Go to Project Settings > API in your Supabase dashboard
2. Find your Project URL and anon/public key
3. Open `js/supabase-config.js`
4. Replace the placeholder values with your Supabase URL and anon key:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```

### 5. Set up Storage

1. In the Supabase dashboard, go to Storage
2. You should see a "product-images" bucket (created by the SQL script)
3. If not, create a new bucket named "product-images" with public access

## Usage

### Accessing the Admin Panel

1. Open `admin.html` in your browser
2. You should see the products management interface

### Adding a New Product

1. Click "Add New Product"
2. Fill in the product details
3. Upload an image (optional)
4. Click "Save Product"

### Editing a Product

1. Find the product in the products list
2. Click the "Edit" button
3. Make your changes
4. Click "Save Product"

### Deleting a Product

1. Open the product for editing
2. Click the "Delete Product" button
3. Confirm the deletion

## Security Notes

1. The current setup uses the public anon key for simplicity in development
2. For production, implement proper authentication and row-level security (RLS) policies
3. Consider implementing user authentication for the admin panel

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:
1. Make sure you've added your domain to the CORS settings in Supabase
2. Ensure you're accessing the page via `http://` or `https://` (not `file://`)

### Authentication Errors

If you get authentication errors:
1. Verify your Supabase URL and anon key are correct
2. Check that the anon key has the correct permissions in your Supabase project

### Image Upload Issues

If images aren't uploading:
1. Check that the "product-images" bucket exists in Supabase Storage
2. Verify the bucket has the correct permissions
3. Check the browser console for any error messages

## Deployment

When deploying to production:
1. Update the Supabase configuration with your production URL and keys
2. Set up proper authentication
3. Consider implementing server-side validation
4. Set up proper CORS policies
5. Enable HTTPS for secure connections
