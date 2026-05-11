import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';

import '../models/oasisbio.dart';
import '../models/user.dart';

class ApiService {
  final Dio _dio;
  String? _token;

  ApiService()
      : _dio = Dio(BaseOptions(
          baseUrl: 'http://localhost:3000/api',
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
        )) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_token != null) {
          options.headers['Authorization'] = 'Bearer $_token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        return handler.next(e);
      },
    ));
  }

  void setToken(String token) {
    _token = token;
  }

  Future<User> getCurrentUser() async {
    final response = await _dio.get('/auth/me');
    return User.fromJson(response.data);
  }

  Future<Profile> getProfile(String userId) async {
    final response = await _dio.get('/profiles/$userId');
    return Profile.fromJson(response.data);
  }

  Future<List<OasisBio>> getOasisBios({
    int page = 1,
    int limit = 20,
    String? search,
    String? status,
    String? identityMode,
  }) async {
    final response = await _dio.get('/oasisbios', queryParameters: {
      'page': page,
      'limit': limit,
      'search': search,
      'status': status,
      'identityMode': identityMode,
    });
    return (response.data['data'] as List)
        .map((e) => OasisBio.fromJson(e))
        .toList();
  }

  Future<OasisBio> getOasisBio(String id) async {
    final response = await _dio.get('/oasisbios/$id');
    return OasisBio.fromJson(response.data);
  }

  Future<OasisBio> createOasisBio(Map<String, dynamic> data) async {
    final response = await _dio.post('/oasisbios', data: data);
    return OasisBio.fromJson(response.data);
  }

  Future<OasisBio> updateOasisBio(String id, Map<String, dynamic> data) async {
    final response = await _dio.put('/oasisbios/$id', data: data);
    return OasisBio.fromJson(response.data);
  }

  Future<void> deleteOasisBio(String id) async {
    await _dio.delete('/oasisbios/$id');
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> register(
    String username,
    String email,
    String password,
  ) async {
    final response = await _dio.post('/auth/register', data: {
      'username': username,
      'email': email,
      'password': password,
    });
    return response.data;
  }

  Future<void> logout() async {
    await _dio.post('/auth/logout');
    _token = null;
  }

  Future<Map<String, dynamic>> refreshToken() async {
    final response = await _dio.post('/auth/refresh');
    return response.data;
  }
}
