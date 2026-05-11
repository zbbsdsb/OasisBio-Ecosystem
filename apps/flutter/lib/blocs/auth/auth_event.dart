part of 'auth_bloc.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object> get props => [];
}

class AuthLogin extends AuthEvent {
  final String email;
  final String password;

  const AuthLogin({required this.email, required this.password});

  @override
  List<Object> get props => [email, password];
}

class AuthRegister extends AuthEvent {
  final String username;
  final String email;
  final String password;

  const AuthRegister({
    required this.username,
    required this.email,
    required this.password,
  });

  @override
  List<Object> get props => [username, email, password];
}

class AuthLogout extends AuthEvent {
  const AuthLogout();
}

class AuthCheck extends AuthEvent {
  const AuthCheck();
}

class AuthUpdateUser extends AuthEvent {
  final User user;

  const AuthUpdateUser(this.user);

  @override
  List<Object> get props => [user];
}
