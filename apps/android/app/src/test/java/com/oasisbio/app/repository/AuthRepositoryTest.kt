package com.oasisbio.app.repository

import com.oasisbio.app.domain.model.Session
import com.oasisbio.app.domain.model.UserProfile
import com.oasisbio.app.domain.repository.AuthRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.Mock
import org.mockito.MockitoAnnotations
import org.mockito.kotlin.any
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

class AuthRepositoryTest {

    @Mock
    private lateinit var authRepository: AuthRepository

    private val mockUser = UserProfile(
        id = "test-user-id",
        email = "test@example.com",
        displayName = "Test User",
        avatarUrl = null
    )

    private val mockSession = Session(
        accessToken = "access-token-123",
        refreshToken = "refresh-token-456",
        expiresIn = 3600L,
        expiresAt = System.currentTimeMillis() / 1000 + 3600,
        tokenType = "Bearer",
        userId = "test-user-id"
    )

    @Before
    fun setup() {
        MockitoAnnotations.openMocks(this)
    }

    @Test
    fun sendOtp_success() {
        whenever(authRepository.sendOtp(any())).thenReturn(Result.success(Unit))

        val result = authRepository.sendOtp("user@example.com")

        assertTrue(result.isSuccess)
        verify(authRepository).sendOtp("user@example.com")
    }

    @Test
    fun sendOtp_failure() {
        whenever(authRepository.sendOtp(any())).thenReturn(Result.failure(Exception("Invalid email")))

        val result = authRepository.sendOtp("invalid-email")

        assertTrue(result.isFailure)
        assertEquals("Invalid email", result.exceptionOrNull()?.message)
    }

    @Test
    fun verifyOtp_success() {
        whenever(authRepository.verifyOtp(any(), any())).thenReturn(Result.success(mockSession))

        val result = authRepository.verifyOtp("user@example.com", "123456")

        assertTrue(result.isSuccess)
        assertNotNull(result.getOrNull())
        assertEquals("access-token-123", result.getOrNull()?.accessToken)
        assertEquals("test-user-id", result.getOrNull()?.userId)
    }

    @Test
    fun verifyOtp_invalidOtp() {
        whenever(authRepository.verifyOtp(any(), any())).thenReturn(Result.failure(Exception("Invalid OTP")))

        val result = authRepository.verifyOtp("user@example.com", "000000")

        assertTrue(result.isFailure)
        assertEquals("Invalid OTP", result.exceptionOrNull()?.message)
    }

    @Test
    fun getProfile_success() {
        whenever(authRepository.getProfile()).thenReturn(Result.success(mockUser))

        val result = authRepository.getProfile()

        assertTrue(result.isSuccess)
        assertEquals("test@example.com", result.getOrNull()?.email)
        assertEquals("Test User", result.getOrNull()?.displayName)
    }

    @Test
    fun getProfile_notLoggedIn() {
        whenever(authRepository.getProfile()).thenReturn(Result.failure(Exception("Not authenticated")))

        val result = authRepository.getProfile()

        assertTrue(result.isFailure)
    }

    @Test
    fun signOut_success() {
        whenever(authRepository.signOut()).thenReturn(Result.success(Unit))

        val result = authRepository.signOut()

        assertTrue(result.isSuccess)
        verify(authRepository).signOut()
    }

    @Test
    fun isLoggedIn_returnsTrue() {
        whenever(authRepository.isLoggedIn()).thenReturn(true)

        val result = authRepository.isLoggedIn()

        assertTrue(result)
    }

    @Test
    fun isLoggedIn_returnsFalse() {
        whenever(authRepository.isLoggedIn()).thenReturn(false)

        val result = authRepository.isLoggedIn()

        assertFalse(result)
    }

    @Test
    fun refreshToken_success() {
        whenever(authRepository.refreshToken()).thenReturn(Result.success(mockSession))

        val result = authRepository.refreshToken()

        assertTrue(result.isSuccess)
        assertEquals("access-token-123", result.getOrNull()?.accessToken)
    }

    @Test
    fun getCurrentSession_success() {
        whenever(authRepository.getCurrentSession()).thenReturn(Result.success(mockSession))

        val result = authRepository.getCurrentSession()

        assertTrue(result.isSuccess)
        assertNotNull(result.getOrNull())
        assertEquals("Bearer", result.getOrNull()?.tokenType)
    }
}
