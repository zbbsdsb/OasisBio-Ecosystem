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
      margin: const EdgeInsets.symmetric