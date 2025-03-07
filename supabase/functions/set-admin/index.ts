
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the request body
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // Get the user by email
    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { 
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // Check if user already has admin role
    const { data: existingRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', userData.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (existingRole) {
      return new Response(
        JSON.stringify({ message: "User is already an admin" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      )
    }

    // Set user as admin
    const { error: updateError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userData.id,
        role: 'admin'
      })

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ message: "Successfully set user as admin" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})
