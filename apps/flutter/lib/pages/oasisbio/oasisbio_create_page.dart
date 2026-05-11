import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:validatorless/validatorless.dart';

import '../../blocs/oasisbio/oasisbio_bloc.dart';
import '../../models/oasisbio.dart';

class OasisBioCreatePage extends StatefulWidget {
  const OasisBioCreatePage({super.key});

  @override
  State<OasisBioCreatePage> createState() => _OasisBioCreatePageState();
}

class _OasisBioCreatePageState extends State<OasisBioCreatePage> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _taglineController = TextEditingController();
  final _summaryController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _genderController = TextEditingController();
  final _pronounsController = TextEditingController();
  final _speciesController = TextEditingController();
  final _originPlaceController = TextEditingController();
  final _currentEraController = TextEditingController();

  IdentityMode _identityMode = IdentityMode.fictional;
  Visibility _visibility = Visibility.private;
  String _status = 'draft';

  @override
  void dispose() {
    _titleController.dispose();
    _taglineController.dispose();
    _summaryController.dispose();
    _descriptionController.dispose();
    _genderController.dispose();
    _pronounsController.dispose();
    _speciesController.dispose();
    _originPlaceController.dispose();
    _currentEraController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState?.validate() ?? false) {
      final data = {
        'title': _titleController.text,
        'tagline': _taglineController.text.isNotEmpty ? _taglineController.text : null,
        'summary': _summaryController.text.isNotEmpty ? _summaryController.text : null,
        'description': _descriptionController.text.isNotEmpty ? _descriptionController.text : null,
        'identityMode': _identityMode.name,
        'visibility': _visibility.name,
        'status': _status,
        'gender': _genderController.text.isNotEmpty ? _genderController.text : null,
        'pronouns': _pronounsController.text.isNotEmpty ? _pronounsController.text : null,
        'species': _speciesController.text.isNotEmpty ? _speciesController.text : null,
        'originPlace': _originPlaceController.text.isNotEmpty ? _originPlaceController.text : null,
        'currentEra': _currentEraController.text.isNotEmpty ? _currentEraController.text : null,
        'defaultLanguage': 'en',
        'featured': false,
      };

      context.read<OasisBioBloc>().add(OasisBioCreate(data));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Character'),
        actions: [
          BlocConsumer<OasisBioBloc, OasisBioState>(
            listenWhen: (previous, current) =>
                previous.status != current.status &&
                current.status == OasisBioStatus.success &&
                current.selectedOasisBio != null,
            listener: (context, state) {
              Navigator.pop(context);
            },
            builder: (context, state) {
              return TextButton(
                onPressed: state.status == OasisBioStatus.loading ? null : _submit,
                child: const Text('Save'),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildTitleSection(),
                const SizedBox(height: 24),
                _buildBasicInfoSection(),
                const SizedBox(height: 24),
                _buildDetailsSection(),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTitleSection() {
    return Column(
      children: [
