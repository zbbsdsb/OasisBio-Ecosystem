enum IdentityMode {
  real,
  fictional,
  hybrid,
  future,
  alternate,
}

enum Visibility {
  private,
  public,
}

class OasisBio {
  final String id;
  final String userId;
  final String title;
  final String slug;
  final String? tagline;
  final String? summary;
  final IdentityMode identityMode;
  final DateTime? birthDate;
  final String? gender;
  final String? pronouns;
  final String? originPlace;
  final String? currentEra;
  final String? species;
  final String status;
  final String? description;
  final String? coverImageUrl;
  final String defaultLanguage;
  final Visibility visibility;
  final bool featured;
  final DateTime? publishedAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<Ability> abilities;
  final List<EraIdentity> eras;
  final List<DcosFile> dcosFiles;
  final List<ReferenceItem> references;
  final List<WorldItem> worlds;
  final List<ModelItem> models;

  OasisBio({
    required this.id,
    required this.userId,
    required this.title,
    required this.slug,
    this.tagline,
    this.summary,
    required this.identityMode,
    this.birthDate,
    this.gender,
    this.pronouns,
    this.originPlace,
