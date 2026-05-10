package com.oasisbio.app.data.remote

import com.oasisbio.app.BuildConfig
import io.github.jan_tennert.supabase.SupabaseClient
import io.github.jan_tennert.supabase.createSupabaseClient
import io.github.jan_tennert.supabase.gotrue.GoTrue
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SupabaseClientProvider @Inject constructor() {
    val supabaseClient: SupabaseClient = createSupabaseClient(
        supabaseUrl = BuildConfig.SUPABASE_URL,
        supabaseKey = BuildConfig.SUPABASE_ANON_KEY
    ) {
        install(GoTrue)
    }
}