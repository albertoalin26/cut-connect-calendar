
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

    const adminEmail = "achi@salone.it";
    const clientEmail = "alberto@cliente.it";
    const genericPassword = "Password123!";

    // Create admin user
    const { data: adminData, error: adminError } = await supabaseAdmin.auth.signUp({
      email: adminEmail,
      password: genericPassword,
      options: {
        data: {
          first_name: "Achi",
          last_name: "Parrucchiere"
        }
      }
    });

    // Create client user
    const { data: clientData, error: clientError } = await supabaseAdmin.auth.signUp({
      email: clientEmail,
      password: genericPassword,
      options: {
        data: {
          first_name: "Alberto",
          last_name: "Cliente"
        }
      }
    });

    // Set Achi as admin
    if (adminData?.user) {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: adminData.user.id,
          role: 'admin'
        });
      
      if (roleError) {
        console.error("Error setting admin role:", roleError);
      }
    }

    // Check for errors
    if (adminError) {
      console.error("Error creating admin:", adminError);
    }
    
    if (clientError) {
      console.error("Error creating client:", clientError);
    }

    return new Response(
      JSON.stringify({ 
        message: "Initial users setup complete", 
        admin: adminError ? { error: adminError.message } : { email: adminEmail, password: genericPassword },
        client: clientError ? { error: clientError.message } : { email: clientEmail, password: genericPassword }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Error in setup-initial-users:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})
