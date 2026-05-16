package com.oasisbio.app.data.remote

import com.oasisbio.app.domain.model.OasisBio
import com.oasisbio.app.domain.model.UserProfile
import com.oasisbio.app.presentation.ui.screens.OAuthApp
import com.oasisbio.app.presentation.ui.screens.OAuthAppRegistration
import retrofit2.Response
import retrofit2.http.*

interface OasisBioApi {

    @GET("api/oasisbios")
    suspend fun getAllIdentities(): Response<List<OasisBio>>

    @GET("api/oasisbios/{id}")
    suspend fun getIdentityById(@Path("id") id: String): Response<OasisBio>

    @POST("api/oasisbios")
    suspend fun createIdentity(@Body identity: CreateIdentityRequest): Response<OasisBio>

    @PUT("api/oasisbios/{id}")
    suspend fun updateIdentity(
        @Path("id") id: String,
        @Body identity: UpdateIdentityRequest
    ): Response<OasisBio>

    @DELETE("api/oasisbios/{id}")
    suspend fun deleteIdentity(@Path("id") id: String): Response<Unit>

    @GET("api/profile")
    suspend fun getProfile(): Response<UserProfile>

    @PUT("api/profile")
    suspend fun updateProfile(@Body profile: UpdateProfileRequest): Response<UserProfile>

    @POST("api/auth/signin")
    suspend fun signIn(@Body request: SignInRequest): Response<AuthResponse>

    @POST("api/auth/verify-otp")
    suspend fun verifyOtp(@Body request: VerifyOtpRequest): Response<AuthResponse>

    @POST("api/auth/signout")
    suspend fun signOut(): Response<Unit>

    @POST("api/auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): Response<AuthResponse>

    @GET("api/worlds")
    suspend fun getAllWorlds(): Response<List<WorldResponse>>

    @GET("api/worlds/{id}")
    suspend fun getWorldById(@Path("id") id: String): Response<WorldResponse>

    @POST("api/worlds")
    suspend fun createWorld(@Body request: CreateWorldRequest): Response<WorldResponse>

    @PUT("api/worlds/{id}")
    suspend fun updateWorld(
        @Path("id") id: String,
        @Body request: UpdateWorldRequest
    ): Response<WorldResponse>

    @DELETE("api/worlds/{id}")
    suspend fun deleteWorld(@Path("id") id: String): Response<Unit>

    @GET("api/chat/sessions")
    suspend fun getChatSessions(): Response<List<ChatSessionResponse>>

    @GET("api/chat/sessions/{id}")
    suspend fun getChatSession(@Path("id") sessionId: String): Response<ChatSessionResponse>

    @POST("api/chat/sessions")
    suspend fun createChatSession(@Body request: CreateChatSessionRequest): Response<ChatSessionResponse>

    @DELETE("api/chat/sessions/{id}")
    suspend fun deleteChatSession(@Path("id") sessionId: String): Response<Unit>

    @GET("api/chat/sessions/{sessionId}/messages")
    suspend fun getChatMessages(@Path("sessionId") sessionId: String): Response<List<ChatMessageResponse>>

    @POST("api/chat/sessions/{sessionId}/messages")
    suspend fun sendChatMessage(@Body request: SendChatMessageRequest): Response<ChatMessageResponse>

    @GET("api/ai/chat")
    suspend fun chatWithAI(@Query("message") message: String): Response<AIChatResponse>

    @POST("api/ai/chat")
    suspend fun chatWithAIStream(@Body request: AIChatRequest): Response<AIChatResponse>

    @GET("api/ai/generate")
    suspend fun generateContent(@Query("prompt") prompt: String): Response<GeneratedContentResponse>

    @GET("api/oauth/providers")
    suspend fun getOAuthProviders(): Response<List<OAuthProvider>>

    @GET("api/oauth/{provider}/authorize")
    suspend fun getOAuthAuthorizeUrl(@Path("provider") provider: String): Response<OAuthAuthorizeResponse>

    @POST("api/oauth/{provider}/callback")
    suspend fun handleOAuthCallback(
        @Path("provider") provider: String,
        @Body callback: OAuthCallbackRequest
    ): Response<AuthResponse>

    @POST("api/oauth/{provider}/link")
    suspend fun linkOAuthAccount(
        @Path("provider") provider: String,
        @Body callback: OAuthCallbackRequest
    ): Response<AuthResponse>

    @DELETE("api/oauth/{provider}/unlink")
    suspend fun unlinkOAuthAccount(@Path("provider") provider: String): Response<Unit>

    @GET("api/developer/apps")
    suspend fun getOAuthApps(): Response<List<OAuthApp>>

    @GET("api/developer/apps/{id}")
    suspend fun getOAuthAppById(@Path("id") id: String): Response<OAuthApp>

    @POST("api/developer/apps")
    suspend fun createOAuthApp(@Body registration: OAuthAppRegistration): Response<OAuthApp>

    @PUT("api/developer/apps/{id}")
    suspend fun updateOAuthApp(
        @Path("id") id: String,
        @Body app: OAuthApp
    ): Response<OAuthApp>

    @DELETE("api/developer/apps/{id}")
    suspend fun deleteOAuthApp(@Path("id") id: String): Response<Unit>
}

data class CreateIdentityRequest(
    val title: String,
    val slug: String,
    val tagline: String,
    val summary: String,
    val identityMode: String
)

data class UpdateIdentityRequest(
    val title: String?,
    val slug: String?,
    val tagline: String?,
    val summary: String?,
    val identityMode: String?
)

data class UpdateProfileRequest(
    val displayName: String?,
    val avatarUrl: String?
)

data class SignInRequest(
    val email: String,
    val password: String? = null
)

data class VerifyOtpRequest(
    val email: String,
    val otp: String
)

data class RefreshTokenRequest(
    val refreshToken: String
)

data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long,
    val tokenType: String,
    val user: UserProfile
)

data class WorldResponse(
    val id: String,
    val name: String,
    val description: String,
    val setting: Map<String, Any>?,
    val createdAt: String,
    val updatedAt: String
)

data class CreateWorldRequest(
    val name: String,
    val description: String,
    val setting: Map<String, Any>
)

data class UpdateWorldRequest(
    val name: String?,
    val description: String?,
    val setting: Map<String, Any>?
)

data class ChatSessionResponse(
    val id: String,
    val title: String?,
    val assistantType: String,
    val lastMessage: String?,
    val messageCount: Int,
    val createdAt: String,
    val updatedAt: String
)

data class CreateChatSessionRequest(
    val title: String? = null
)

data class ChatMessageResponse(
    val id: String,
    val sessionId: String,
    val content: String,
    val role: String,
    val assistantType: String?,
    val createdAt: String
)

data class SendChatMessageRequest(
    val sessionId: String,
    val content: String,
    val assistantType: String
)

data class AIChatRequest(
    val message: String,
    val context: Map<String, String>? = null
)

data class AIChatResponse(
    val message: String,
    val conversationId: String?,
    val metadata: Map<String, String>?
)

data class GeneratedContentResponse(
    val content: String,
    val type: String,
    val metadata: Map<String, String>?
)

data class OAuthProvider(
    val provider: String,
    val name: String,
    val iconUrl: String?
)

data class OAuthAuthorizeResponse(
    val authorizeUrl: String,
    val state: String
)

data class OAuthCallbackRequest(
    val code: String,
    val state: String,
    val redirectUri: String
)
