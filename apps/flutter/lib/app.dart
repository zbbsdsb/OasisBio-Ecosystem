import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'blocs/auth/auth_bloc.dart';
import 'pages/auth/login_page.dart';
import 'pages/dashboard/dashboard_page.dart';
import 'pages/oasisbio/oasisbio_detail_page.dart';
import 'pages/oasisbio/oasisbio_list_page.dart';
import 'pages/oasisbio/oasisbio_create_page.dart';

class OasisBioApp extends StatelessWidget {
  const OasisBioApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'OasisBio',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        fontFamily: 'Inter',
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4F46E5),
          brightness: Brightness.light,
        ),
      ),
      home: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, state) {
          if (state.status == AuthStatus.authenticated) {
            return const DashboardPage();
          } else {
            return const LoginPage();
          }
        },
      ),
      routes: {
        '/dashboard': (context) => const DashboardPage(),
        '/oasisbios': (context) => const OasisBioListPage(),
        '/oasisbio/create': (context) => const OasisBioCreatePage(),
        '/oasisbio/detail': (context) => const OasisBioDetailPage(),
        '/login': (context) => const LoginPage(),
      },
    );
  }
}
