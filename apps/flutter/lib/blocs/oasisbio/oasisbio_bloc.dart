import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';

import '../../models/oasisbio.dart';
import '../../services/api_service.dart';

part 'oasisbio_event.dart';
part 'oasisbio_state.dart';

class OasisBioBloc extends Bloc<OasisBioEvent, OasisBioState> {
  final ApiService _apiService;

  OasisBioBloc(this._apiService) : super(const OasisBioState()) {
    on<OasisBioFetch>(_onFetch);
    on<OasisBioFetchOne>(_onFetchOne);
    on<OasisBioCreate>(_onCreate);
    on<OasisBioUpdate>(_onUpdate);
    on<OasisBioDelete>(_onDelete);
  }

  Future<void> _onFetch(OasisBioFetch event, Emitter<OasisBioState> emit) async {
    emit(state.copyWith(status: OasisBioStatus.loading));
    try {
      final oasisbios = await _apiService.getOasisBios(
        page: event.page,
        limit: event.limit,
        search: event.search,
        status: event.status,
        identityMode: event.identityMode,
      );
      emit(state.copyWith(
        status: OasisBioStatus.success,
        oasisbios: oasisbios,
        error: null,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: OasisBioStatus.error,
        error: e.toString(),
      ));
    }
  }

  Future<void> _onFetchOne(
      OasisBioFetchOne event, Emitter<OasisBioState> emit) async {
    emit(state.copyWith(status: OasisBioStatus.loading));
    try {
      final oasisbio = await _apiService.getOasisBio(event.id);
      emit(state.copyWith(
        status: OasisBioStatus.success,
        selectedOasisBio: oasisbio,
        error: null,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: OasisBioStatus.error,
        error: e.toString(),
      ));
    }
  }

  Future<void> _onCreate(OasisBioCreate event, Emitter<OasisBioState> emit) async {
    emit(state.copyWith(status: OasisBioStatus.loading));
    try {
      final oasisbio = await _apiService.createOasisBio(event.data);
      final updatedList = List<OasisBio>.from(state.oasisbios)..add(oasisbio);
      emit(state.copyWith(
        status: OasisBioStatus.success,
        oasisbios: updatedList,
        selectedOasisBio: oasisbio,
        error: null,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: OasisBioStatus.error,
        error: e.toString(),
      ));
    }
  }

  Future<void> _onUpdate(OasisBioUpdate event, Emitter<OasisBioState> emit) async {
    emit(state.copyWith(status: OasisBioStatus.loading));
    try {
      final oasisbio = await _apiService.updateOasisBio(event.id, event.data);
      final updatedList = state.oasisbios
          .map((o) => o.id == event.id ? oasisbio : o)
          .toList();
      emit(state.copyWith(
        status: OasisBioStatus.success,
        oasisbios: updatedList,
        selectedOasisBio: oasisbio,
        error: null,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: OasisBioStatus.error,
        error: e.toString(),
      ));
    }
  }

  Future<void> _onDelete(OasisBioDelete event, Emitter<OasisBioState> emit) async {
    emit(state.copyWith(status: OasisBioStatus.loading));
    try {
      await _apiService.deleteOasisBio(event.id);
      final updatedList =
          state.oasisbios.where((o) => o.id != event.id).toList();
      emit(state.copyWith(
        status: OasisBioStatus.success,
        oasisbios: updatedList,
        selectedOasisBio: state.selectedOasisBio?.id == event.id ? null : state.selectedOasisBio,
        error: null,
      ));
    } catch (e) {
      emit(state.copyWith(
        status: OasisBioStatus.error,
        error: e.toString(),
      ));
    }
  }
}
