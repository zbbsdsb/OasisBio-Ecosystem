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
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 0.85,
          ),
          itemCount: state.oasisbios.length,
          itemBuilder: (context, index) {
            return _buildOasisBioCard(state.oasisbios[index]);
          },
        );
      },
    );
  }

  Widget _buildOasisBioCard(OasisBio oasisbio) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        onTap: () {
          Navigator.pushNamed(context, '/oasisbio/detail',
              arguments: oasisbio.id);
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(16),
                    topRight: Radius.circular(16),
                  ),
                  color: const Color(0xFFE0E7FF),
                ),
                child: Center(
                  child: Text(
                    oasisbio.title.isNotEmpty ? oasisbio.title[0].toUpperCase() : '?',
                    style: const TextStyle(
                      fontSize: 48,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF4F46E5),
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    oasisbio.title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (oasisbio.tagline != null)
                    Text(
                      oasisbio.tagline!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey,
                          ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _buildStatusBadge(oasisbio.status),
                      const SizedBox(width: 8),
                      _buildVisibilityBadge(oasisbio.visibility),
                    ],
                  ),
                ],
              ),
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
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        color: bgColor,
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          color: textColor,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildVisibilityBadge(Visibility visibility) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        color: visibility == Visibility.public ? Colors.blue[100]! : Colors.grey[100]!,
      ),
      child: Text(
        visibility == Visibility.public ? 'Public' : 'Private',
        style: TextStyle(
          fontSize: 10,
          color: visibility == Visibility.public ? Colors.blue : Colors.grey,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
