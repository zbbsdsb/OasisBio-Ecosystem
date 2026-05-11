import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:path_provider/path_provider.dart';

import 'app.dart';
import 'blocs/auth/auth_bloc.dart';
import 'blocs/oasisbio/oasisbio_bloc.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  HydratedBloc.storage = await HydratedStorage.build(
    storageDirectory: await getApplicationDocumentsDirectory(),
  );

  runApp(
    MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(
          create: (context) => AuthBloc(
            AuthService(ApiService()),
          ),
        ),
        BlocProvider<OasisBioBloc>(
          create: (context) => OasisBioBloc(ApiService()),
        ),
      ],
      child: const OasisBioApp(),
    ),
  );
}
