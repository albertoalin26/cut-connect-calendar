
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
    console.log("Starting setup-initial-users function");
    
    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',  // Important: use service role key for admin operations
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

    console.log("Deleting existing users if they exist");
    
    // Delete existing users if they exist (to avoid conflicts)
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    
    for (const user of existingUsers?.users || []) {
      if (user.email === adminEmail || user.email === clientEmail) {
        console.log(`Deleting existing user: ${user.email}`);
        await supabaseAdmin.auth.admin.deleteUser(user.id);
      }
    }
    
    console.log("Creating admin user");
    
    // Create admin user with auto-confirmation
    const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: genericPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: "Achi",
        last_name: "Parrucchiere"
      }
    });

    console.log("Creating client user");
    
    // Create client user with auto-confirmation
    const { data: clientData, error: clientError } = await supabaseAdmin.auth.admin.createUser({
      email: clientEmail,
      password: genericPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: "Alberto",
        last_name: "Cliente"
      }
    });

    console.log("Setting admin role");
    
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
      } else {
        console.log("Admin role set successfully");
      }
    }

    // Check for errors
    if (adminError) {
      console.error("Error creating admin:", adminError);
    } else {
      console.log("Admin created successfully");
    }
    
    if (clientError) {
      console.error("Error creating client:", clientError);
    } else {
      console.log("Client created successfully");
    }

    const responseData = {
      message: "Initial users setup complete", 
      admin: adminError ? { error: adminError.message } : { email: adminEmail, password: genericPassword },
      client: clientError ? { error: clientError.message } : { email: clientEmail, password: genericPassword }
    };
    
    console.log("Returning response data", JSON.stringify(responseData));

    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
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
