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
        TextFormField(
          controller: _titleController,
          decoration: const InputDecoration(
            labelText: 'Title *',
            border: OutlineInputBorder(),
          ),
          validator: Validatorless.required('Title is required'),
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _taglineController,
          decoration: const InputDecoration(
            labelText: 'Tagline',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _summaryController,
          maxLines: 3,
          decoration: const InputDecoration(
            labelText: 'Summary',
            border: OutlineInputBorder(),
            alignLabelWithHint: true,
          ),
        ),
      ],
    );
  }

  Widget _buildBasicInfoSection() {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Basic Settings',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            _buildIdentityModeSelector(),
            const SizedBox(height: 16),
            _buildStatusSelector(),
            const SizedBox(height: 16),
            _buildVisibilitySelector(),
          ],
        ),
      ),
    );
  }

  Widget _buildIdentityModeSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Identity Mode'),
        const SizedBox(height: 8),
        Row(
          children: IdentityMode.values.map((mode) {
            return Expanded(
              child: RadioListTile<IdentityMode>(
                title: Text(_getIdentityModeLabel(mode)),
                value: mode,
                groupValue: _identityMode,
                onChanged: (value) {
                  setState(() => _identityMode = value!);
                },
                contentPadding: EdgeInsets.zero,
                dense: true,
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildStatusSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Status'),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: RadioListTile<String>(
                title: const Text('Draft'),
                value: 'draft',
                groupValue: _status,
                onChanged: (value) {
                  setState(() => _status = value!);
                },
                contentPadding: EdgeInsets.zero,
                dense: true,
              ),
            ),
            Expanded(
              child: RadioListTile<String>(
                title: const Text('Published'),
                value: 'published',
                groupValue: _status,
                onChanged: (value) {
                  setState(() => _status = value!);
                },
                contentPadding: EdgeInsets.zero,
                dense: true,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildVisibilitySelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Visibility'),
        const SizedBox(height: 8),
        Row(
          children: Visibility.values.map((visibility) {
            return Expanded(
              child: RadioListTile<Visibility>(
                title: Text(visibility == Visibility.public ? 'Public' : 'Private'),
                value: visibility,
                groupValue: _visibility,
                onChanged: (value) {
                  setState(() => _visibility = value!);
                },
                contentPadding: EdgeInsets.zero,
                dense: true,
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildDetailsSection() {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Character Details',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            GridView(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              children: [
                TextFormField(
                  controller: _genderController,
                  decoration: const InputDecoration(
                    labelText: 'Gender',
                    border: OutlineInputBorder(),
                  ),
                ),
                TextFormField(
                  controller: _pronounsController,
                  decoration: const InputDecoration(
                    labelText: 'Pronouns',
                    border: OutlineInputBorder(),
                  ),
                ),
                TextFormField(
                  controller: _speciesController,
                  decoration: const InputDecoration(
                    labelText: 'Species',
                    border: OutlineInputBorder(),
                  ),
                ),
                TextFormField(
                  controller: _originPlaceController,
                  decoration: const InputDecoration(
                    labelText: 'Origin Place',
                    border: OutlineInputBorder(),
                  ),
                ),
                TextFormField(
                  controller: _currentEraController,
                  decoration: const InputDecoration(
                    labelText: 'Current Era',
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descriptionController,
              maxLines: 5,
              decoration: const InputDecoration(
                labelText: 'Description',
                border: OutlineInputBorder(),
                alignLabelWithHint: true,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getIdentityModeLabel(IdentityMode mode) {
    switch (mode) {
      case IdentityMode.real:
        return 'Real';
      case IdentityMode.fictional:
        return 'Fictional';
      case IdentityMode.hybrid:
        return 'Hybrid';
      case IdentityMode.future:
        return 'Future';
      case IdentityMode.alternate:
        return 'Alternate';
    }
  }
}
