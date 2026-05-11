import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../blocs/oasisbio/oasisbio_bloc.dart';
import '../../models/oasisbio.dart';

class OasisBioListPage extends StatefulWidget {
  const OasisBioListPage({super.key});

  @override
  State<OasisBioListPage> createState() => _OasisBioListPageState();
}

class _OasisBioListPageState extends State<OasisBioListPage> {
  final _searchController = TextEditingController();
  String? _statusFilter;
  String? _identityModeFilter;

  @override
  void initState() {
    super.initState();
    context.read<OasisBioBloc>().add(const OasisBioFetch());
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _applyFilters() {
    context.read<OasisBioBloc>().add(OasisBioFetch(
          search: _searchController.text.isNotEmpty ? _searchController.text : null,
          status: _statusFilter,
          identityMode: _identityModeFilter,
        ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Characters'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              Navigator.pushNamed(context, '/oasisbio/create');
            },
          ),
        ],
      ),
      body: Column(
        children: [
          _buildSearchBar(),
          _buildFilters(),
          Expanded(child: _buildOasisBioList()),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'Search characters...',
          prefixIcon: const Icon(Icons.search),
          border: const OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(12)),
          ),
          suffixIcon: IconButton(
            icon: const Icon(Icons.clear),
            onPressed: () {
              _searchController.clear();
              _applyFilters();
            },
          ),
        ),
        onSubmitted: (_) => _applyFilters(),
      ),
    );
  }

  Widget _buildFilters() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: DropdownButtonFormField<String>(
              value: _statusFilter,
              hint: const Text('Status'),
              items: const [
                DropdownMenuItem(value: null, child: Text('All')),
                DropdownMenuItem(value: 'draft', child: Text('Draft')),
                DropdownMenuItem(value: 'published', child: Text('Published')),
              ],
              onChanged: (value) {
                setState(() => _statusFilter = value);
                _applyFilters();
              },
              decoration: const InputDecoration(
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(8)),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: DropdownButtonFormField<String>(
              value: _identityModeFilter,
              hint: const Text('Identity Mode'),
              items: const [
                DropdownMenuItem(value: null, child: Text('All')),
                DropdownMenuItem(value: 'real', child: Text('Real')),
                DropdownMenuItem(value: 'fictional', child: Text('Fictional')),
                DropdownMenuItem(value: 'hybrid', child: Text('Hybrid')),
                DropdownMenuItem(value: 'future', child: Text('Future')),
                DropdownMenuItem(value: 'alternate', child: Text('Alternate')),
              ],
              onChanged: (value) {
                setState(() => _identityModeFilter = value);
                _applyFilters();
              },
              decoration: const InputDecoration(
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.all(Radius.circular(8)),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOasisBioList() {
    return BlocBuilder<OasisBioBloc, OasisBioState>(
      builder: (context, state) {
        if (state.status == OasisBioStatus.loading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state.status == OasisBioStatus.error) {
          return Center(child: Text(state.error!));
        }
        if (state.oasisbios.isEmpty) {
          return const Center(child: Text('No characters found'));
        }
        return GridView.builder(
