part of 'oasisbio_bloc.dart';

enum OasisBioStatus {
  loading,
  success,
  error,
}

class OasisBioState extends Equatable {
  final OasisBioStatus status;
  final List<OasisBio> oasisbios;
  final OasisBio? selectedOasisBio;
  final String? error;

  const OasisBioState({
    this.status = OasisBioStatus.loading,
    this.oasisbios = const [],
    this.selectedOasisBio,
    this.error,
  });

  OasisBioState copyWith({
    OasisBioStatus? status,
    List<OasisBio>? oasisbios,
    OasisBio? selectedOasisBio,
    String? error,
  }) {
    return OasisBioState(
      status: status ?? this.status,
      oasisbios: oasisbios ?? this.oasisbios,
      selectedOasisBio: selectedOasisBio ?? this.selectedOasisBio,
      error: error ?? this.error,
    );
  }

  @override
  List<Object?> get props => [status, oasisbios, selectedOasisBio, error];
}
