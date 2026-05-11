import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../../blocs/oasisbio/oasisbio_bloc.dart';
import '../../models/oasisbio.dart';

class OasisBioDetailPage extends StatefulWidget {
  const OasisBioDetailPage({super.key});

  @override
  State<OasisBioDetailPage> createState() => _OasisBioDetailPageState();
}

class _OasisBioDetailPageState extends State<OasisBioDetailPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final id = ModalRoute.of(context)?.settings.arguments as String?;
      if (id != null) {
        context.read<OasisBioBloc>().add(OasisBioFetchOne(id));
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Character Detail'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () {
              // Navigate to edit page
            },
          ),
          IconButton(
            icon: const Icon(Icons.delete),
            onPressed: () {
              _showDeleteConfirmDialog();
            },
          ),
        ],
      ),
      body: BlocBuilder<OasisBioBloc, OasisBioState>(
        builder: (context, state) {
          if (state.status == OasisBioStatus.loading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state.status == OasisBioStatus.error) {
            return Center(child: Text(state.error!));
          }
          if (state.selectedOasisBio == null) {
            return const Center(child: Text('Character not found'));
          }

          final oasisbio = state.selectedOasisBio!;
          return SingleChildScrollView(
            child: Column(
              children: [
                _buildCoverImage(oasisbio),
                _buildInfoSection(oasisbio),
                _buildDetails(oasisbio),
                _buildAbilities(oasisbio),
                _buildEras(oasisbio),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildCoverImage(OasisBio oasisbio) {
    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: const Color(0xFFE0E7FF),
      ),
      child: Center(
        child: Text(
          oasisbio.title.isNotEmpty ? oasisbio.title[0].toUpperCase() : '?',
          style: const TextStyle(
            fontSize: 96,
            fontWeight: FontWeight.bold,
            color: Color(0xFF4F46E5),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoSection(OasisBio oasisbio) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      oasisbio.title,
                      style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    if (oasisbio.tagline != null)
                      Text(
                        oasisbio.tagline!,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: Colors.grey[600],
                            ),
                      ),
                  ],
                ),
              ),
              Row(
                children: [
                  _buildStatusBadge(oasisbio.status),
                  const SizedBox(width: 8),
                  _buildVisibilityBadge(oasisbio.visibility),
                ],
              ),
            ],
          ),
          if (oasisbio.summary != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(
                oasisbio.summary!,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDetails(OasisBio oasisbio) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Basic Information',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            _buildDetailRow('Identity Mode', _getIdentityModeLabel(oasisbio.identityMode)),
            _buildDetailRow('Status', oasisbio.status),
            if (oasisbio.gender != null) _buildDetailRow('Gender', oasisbio.gender!),
            if (oasisbio.pronouns != null) _buildDetailRow('Pronouns', oasisbio.pronouns!),
            if (oasisbio.species != null) _buildDetailRow('Species', oasisbio.species!),
            if (oasisbio.originPlace != null) _buildDetailRow('Origin', oasisbio.originPlace!),
            if (oasisbio.currentEra != null) _buildDetailRow('Current Era', oasisbio.currentEra!),
            if (oasisbio.birthDate != null)
              _buildDetailRow('Birth Date', DateFormat('MMM d, yyyy').format(oasisbio.birthDate!)),
            _buildDetailRow('Created', DateFormat('MMM d, yyyy').format(oasisbio.createdAt)),
            _buildDetailRow('Updated', DateFormat('MMM d, yyyy').format(oasisbio.updatedAt)),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            child: Text(value),
          ),
        ],
      ),
    );
  }

  Widget _buildAbilities(OasisBio oasisbio) {
    if (oasisbio.abilities.isEmpty) return const SizedBox();

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Abilities (${oasisbio.abilities.length})',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              children: oasisbio.abilities
                  .map((ability) => _buildAbilityChip(ability))
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAbilityChip(Ability ability) {
    return Chip(
      label: Text(ability.name),
      backgroundColor: const Color(0xFFE0E7FF),
      labelStyle: const TextStyle(color: Color(0xFF4F46E5)),
    );
  }

  Widget _buildEras(OasisBio oasisbio) {
    if (oasisbio.eras.isEmpty) return const SizedBox();

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Eras (${oasisbio.eras.length})',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),
            Column(
              children: oasisbio.eras
                  .map((era) => _buildEraCard(era))
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEraCard(EraIdentity era) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          color: Colors.grey[50],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  era.name,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(width: 8),
                Text(
                  era.eraType,
                  style: const TextStyle(color: Colors.grey),
                ),
              ],
            ),
            if (era.startYear != null || era.endYear != null)
              Text(
                '${era.startYear ?? '?'} - ${era.endYear ?? 'Present'}',
                style: const TextStyle(color: Colors.grey),
              ),
            if (era.description != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(era.description!),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    Color textColor;
    String label;

    switch (status) {
      case 'draft':
        bgColor = Colors.grey[100]!;
        textColor = Colors.grey;
        label = 'Draft';
        break;
      case 'published':
        bgColor = Colors.green[100]!;
        textColor = Colors.green;
        label = 'Published';
        break;
      default:
        bgColor = Colors.orange[100]!;
        textColor = Colors.orange;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: bgColor,
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          color: textColor,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildVisibilityBadge(Visibility visibility) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: visibility == Visibility.public ? Colors.blue[100]! : Colors.grey[100]!,
      ),
      child: Text(
        visibility == Visibility.public ? 'Public' : 'Private',
        style: TextStyle(
          fontSize: 12,
          color: visibility == Visibility.public ? Colors.blue : Colors.grey,
          fontWeight: FontWeight.bold,
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

  void _showDeleteConfirmDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Character'),
        content: const Text('Are you sure you want to delete this character?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              final oasisbio = context.read<OasisBioBloc>().state.selectedOasisBio;
              if (oasisbio != null) {
                context.read<OasisBioBloc>().add(OasisBioDelete(oasisbio.id));
              }
              Navigator.pop(context);
              Navigator.pop(context);
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}
