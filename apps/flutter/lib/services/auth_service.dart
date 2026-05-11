import 'package:shared_preferences/shared_preferences.dart';

import '../models/user.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _apiService;

  AuthService(this._apiService);

  Future<Map<String, dynamic>> login(String email, String password) async {
    final result = await _apiService.login(email, password);
    if (result['token'] != null) {
      _apiService.setToken(result['token']);
      await _saveToken(result['token']);
    }
    return result;
  }

  Future<Map<String, dynamic>> register(
    String username,
    String email,
    String password,
  ) async {
    final result = await _apiService.register(username, email, password);
    if (result['token'] != null) {
      _apiService.setToken(result['token']);
      await _saveToken(result['token']);
    }
    return result;
  }

  Future<User?> getCurrentUser() async {
    final token = await _getToken();
    if (token != null) {
      _apiService.setToken(token);
      try {
        return await _apiService.getCurrentUser();
      } catch (_) {
        await _clearToken();
        return null;
      }
    }
    return null;
  }

  Future<void> logout() async {
    try {
      await _apiService.logout();
    } catch (_) {
    } finally {
      await _clearToken();
    }
  }

  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  Future<void> _clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  Future<bool> isAuthenticated() async {
    final token = await _getToken();
    return token != null;
  }
}
