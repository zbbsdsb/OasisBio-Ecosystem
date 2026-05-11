import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';

import '../../models/user.dart';
import '../../services/auth_service.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthService _authService;

  AuthBloc(this._authService) : super(const AuthState()) {
    on<AuthLogin>(_onLogin);
    on<AuthRegister>(_onRegister);
    on<AuthLogout>(_onLogout);
    on<AuthCheck>(_onCheck);
    on<AuthUpdateUser>(_onUpdateUser);
  }

  Future<void> _onLogin(AuthLogin event, Emitter<AuthState> emit) async {
    emit(state.copyWith(status: AuthStatus.loading));
    try {
      await _authService.login(event.email, event.password);
      final user = await _authService.getCurrentUser();
      emit(state.copyWith(
        status: AuthStatus.authenticated,
        user: user,
        error: null,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: AuthStatus.unauthenticated,
        error: e.toString(),
      ));
    }
  }

  Future<void> _onRegister(AuthRegister event, Emitter<AuthState> emit) async {
    emit(state.copyWith(status: AuthStatus.loading));
    try {
      await _authService.register(
        event.username,
        event.email,
        event.password,
      );
      final user = await _authService.getCurrentUser();
      emit(state.copyWith(
        status: AuthStatus.authenticated,
        user: user,
        error: null,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: AuthStatus.unauthenticated,
        error: e.toString(),
      ));
    }
  }

  Future<void> _onLogout(AuthLogout event, Emitter<AuthState> emit) async {
    await _authService.logout();
    emit(state.copyWith(
      status: AuthStatus.unauthenticated,
      user: null,
      error: null,
    ));
  }

  Future<void> _onCheck(AuthCheck event, Emitter<AuthState> emit) async {
    emit(state.copyWith(status: AuthStatus.loading));
    try {
      final user = await _authService.getCurrentUser();
      if (user != null) {
        emit(state.copyWith(
          status: AuthStatus.authenticated,
          user: user,
          error: null,
        ));
      } else {
        emit(state.copyWith(status: AuthStatus.unauthenticated));
      }
    } catch (e) {
      emit(state.copyWith(status: AuthStatus.unauthenticated));
    }
  }

  void _onUpdateUser(AuthUpdateUser event, Emitter<AuthState> emit) {
    emit(state.copyWith(user: event.user));
  }
}
