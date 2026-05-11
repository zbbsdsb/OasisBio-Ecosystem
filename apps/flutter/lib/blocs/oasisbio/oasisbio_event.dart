part of 'oasisbio_bloc.dart';

abstract class OasisBioEvent extends Equatable {
  const OasisBioEvent();

  @override
  List<Object> get props => [];
}

class OasisBioFetch extends OasisBioEvent {
  final int page;
  final int limit;
  final String? search;
  final String? status;
  final String? identityMode;

  const OasisBioFetch({
    this.page = 1,
    this.limit = 20,
    this.search,
    this.status,
    this.identityMode,
  });

  @override
  List<Object?> get props => [page, limit, search, status, identityMode];
}

class OasisBioFetchOne extends OasisBioEvent {
  final String id;

  const OasisBioFetchOne(this.id);

  @override
  List<Object> get props => [id];
}

class OasisBioCreate extends OasisBioEvent {
  final Map<String, dynamic> data;

  const OasisBioCreate(this.data);

  @override
  List<Object> get props => [data];
}

class OasisBioUpdate extends OasisBioEvent {
  final String id;
  final Map<String, dynamic> data;

  const OasisBioUpdate(this.id, this.data);

  @override
  List<Object> get props => [id, data];
}

class OasisBioDelete extends OasisBioEvent {
  final String id;

  const OasisBioDelete(this.id);

  @override
  List<Object> get props => [id];
}
