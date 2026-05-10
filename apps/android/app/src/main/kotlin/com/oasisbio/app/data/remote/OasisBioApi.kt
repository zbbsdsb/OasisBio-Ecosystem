package com.oasisbio.app.data.remote

import com.oasisbio.app.domain.model.OasisBio
import com.oasisbio.app.domain.model.UserProfile
import retrofit2.Response
import retrofit2.http.*

interface OasisBioApi {
    @GET("api/oasisbios")
    suspend fun getAllIdentities(): Response<List<OasisBio>>

    @GET("api/oasisbios/{id}")
    suspend fun getIdentityById(@Path("id") id: String): Response<OasisBio>

    @POST("api/oasisbios")
    suspend fun createIdentity(@Body identity: OasisBio): Response<OasisBio>

    @PUT("api/oasisbios/{id}")
    suspend fun updateIdentity(@Path("id") id: String, @Body identity: OasisBio): Response<OasisBio>

    @DELETE("api/oasisbios/{id}")
    suspend fun deleteIdentity(@Path("id") id: String): Response<Unit>

    @GET("api/profile")
    suspend fun getProfile(): Response<UserProfile>

    @PUT("api/profile")
    suspend fun updateProfile(@Body profile: UserProfile): Response<UserProfile>
}