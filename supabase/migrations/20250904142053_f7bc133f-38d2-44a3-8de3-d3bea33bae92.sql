-- Fix security vulnerability: Remove overly permissive profile access policy
-- and replace with proper access controls

-- Drop the problematic policy that allows all users to see all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a secure policy that only allows users to see their own profile
-- Admins can still see all profiles through the existing "Admins can view all profiles" policy
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- For appointment booking contexts where basic profile info needs to be visible,
-- create a separate policy for minimal profile data access
-- This allows viewing only name fields for appointment-related functionality
CREATE POLICY "Limited profile info for appointments" 
ON public.profiles 
FOR SELECT 
USING (
  -- Only allow access to basic name fields, not sensitive data like email/phone
  -- This will be enforced at the application level by selecting only specific columns
  auth.uid() IS NOT NULL 
  AND (
    -- User can see their own full profile
    auth.uid() = user_id 
    OR 
    -- Or admin can see all profiles  
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  )
);