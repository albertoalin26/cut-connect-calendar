import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestUser {
  email: string
  password: string
  role: 'admin' | 'client'
  first_name: string
  last_name: string
  phone?: string
}

const testUsers: TestUser[] = [
  {
    email: 'admin@test.it',
    password: 'Test123456!',
    role: 'admin',
    first_name: 'Mario',
    last_name: 'Rossi',
    phone: '+39 123 456 7890'
  },
  {
    email: 'cliente1@test.it',
    password: 'Test123456!',
    role: 'client',
    first_name: 'Giulia',
    last_name: 'Bianchi',
    phone: '+39 987 654 3210'
  },
  {
    email: 'cliente2@test.it',
    password: 'Test123456!',
    role: 'client',
    first_name: 'Marco',
    last_name: 'Verdi',
    phone: '+39 555 123 4567'
  }
]

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const results = []

    for (const testUser of testUsers) {
      try {
        // Create user with admin client
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          email_confirm: true, // Auto-confirm email for test users
          user_metadata: {
            first_name: testUser.first_name,
            last_name: testUser.last_name
          }
        })

        if (authError) {
          console.error('Auth error for', testUser.email, ':', authError.message)
          results.push({
            email: testUser.email,
            success: false,
            error: authError.message
          })
          continue
        }

        if (!authUser.user) {
          results.push({
            email: testUser.email,
            success: false,
            error: 'User creation failed - no user returned'
          })
          continue
        }

        // Update profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            user_id: authUser.user.id,
            first_name: testUser.first_name,
            last_name: testUser.last_name,
            email: testUser.email,
            phone: testUser.phone
          })

        if (profileError) {
          console.error('Profile error for', testUser.email, ':', profileError.message)
        }

        // Set user role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert({
            user_id: authUser.user.id,
            role: testUser.role
          })

        if (roleError) {
          console.error('Role error for', testUser.email, ':', roleError.message)
        }

        results.push({
          email: testUser.email,
          success: true,
          role: testUser.role,
          user_id: authUser.user.id
        })

      } catch (error) {
        console.error('Error creating user', testUser.email, ':', error)
        results.push({
          email: testUser.email,
          success: false,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Test users creation completed',
        results: results,
        credentials: testUsers.map(u => ({
          email: u.email,
          password: u.password,
          role: u.role,
          name: `${u.first_name} ${u.last_name}`
        }))
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})