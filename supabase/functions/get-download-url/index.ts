import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  dump_pack_id: string
  file_type: 'project' | 'stems' | 'midi'
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Client with user's JWT for auth check
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Service client for generating signed URLs
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Authenticated user:', user.id)

    // Parse request body
    const { dump_pack_id, file_type }: RequestBody = await req.json()

    if (!dump_pack_id || !file_type) {
      return new Response(
        JSON.stringify({ error: 'Missing dump_pack_id or file_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Request for pack:', dump_pack_id, 'file:', file_type)

    // Fetch dump pack
    const { data: pack, error: packError } = await supabaseAdmin
      .from('dump_packs')
      .select('id, creator_id, dump_zip_path, project_zip_path, flp_path, stems_zip_path, midi_zip_path')
      .eq('id', dump_pack_id)
      .eq('is_deleted', false)
      .single()

    if (packError || !pack) {
      console.error('Pack fetch error:', packError)
      return new Response(
        JSON.stringify({ error: 'Pack not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch creator to get user_id
    const { data: creatorData, error: creatorError } = await supabaseAdmin
      .from('creators')
      .select('id, user_id')
      .eq('id', pack.creator_id)
      .single()

    if (creatorError || !creatorData) {
      console.error('Creator fetch error:', creatorError)
      return new Response(
        JSON.stringify({ error: 'Creator not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found pack:', pack.id, 'creator user_id:', creatorData.user_id)

    // Check access: either creator owns the pack OR user has active subscription
    const isCreator = creatorData.user_id === user.id
    console.log('Is creator:', isCreator)

    let hasAccess = isCreator

    if (!isCreator) {
      // Check for active subscription
      const { data: subscription, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('id, status')
        .eq('subscriber_id', user.id)
        .eq('creator_id', pack.creator_id)
        .eq('status', 'active')
        .maybeSingle()

      console.log('Subscription check:', subscription, 'error:', subError)
      hasAccess = !!subscription
    }

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Access denied. Subscribe to download.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine file path based on file_type
    // Priority: dump_zip_path (desktop app) > project_zip_path > flp_path
    let filePath: string | null = null
    switch (file_type) {
      case 'project':
        filePath = pack.dump_zip_path || pack.project_zip_path || pack.flp_path
        break
      case 'stems':
        filePath = pack.stems_zip_path
        break
      case 'midi':
        filePath = pack.midi_zip_path
        break
    }

    if (!filePath) {
      return new Response(
        JSON.stringify({ error: 'File not available' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Generating signed URL for:', filePath)

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin
      .storage
      .from('dumps')
      .createSignedUrl(filePath, 3600)

    if (signedUrlError || !signedUrlData) {
      console.error('Signed URL error:', signedUrlError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate download URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Generated signed URL successfully')

    return new Response(
      JSON.stringify({ url: signedUrlData.signedUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
