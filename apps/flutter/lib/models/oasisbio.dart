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
    this.currentEra,
    this.species,
    required this.status,
    this.description,
    this.coverImageUrl,
    required this.defaultLanguage,
    required this.visibility,
    required this.featured,
    this.publishedAt,
    required this.createdAt,
    required this.updatedAt,
    this.abilities = const [],
    this.eras = const [],
    this.dcosFiles = const [],
    this.references = const [],
    this.worlds = const [],
    this.models = const [],
  });

  factory OasisBio.fromJson(Map<String, dynamic> json) {
    return OasisBio(
      id: json['id'],
      userId: json['userId'],
      title: json['title'],
      slug: json['slug'],
      tagline: json['tagline'],
      summary: json['summary'],
      identityMode: IdentityMode.values.firstWhere(
        (e) => e.name == json['identityMode'],
        orElse: () => IdentityMode.fictional,
      ),
      birthDate: json['birthDate'] != null
          ? DateTime.parse(json['birthDate'])
          : null,
      gender: json['gender'],
      pronouns: json['pronouns'],
      originPlace: json['originPlace'],
      currentEra: json['currentEra'],
      species: json['species'],
      status: json['status'],
      description: json['description'],
      coverImageUrl: json['coverImageUrl'],
      defaultLanguage: json['defaultLanguage'],
      visibility: Visibility.values.firstWhere(
        (e) => e.name == json['visibility'],
        orElse: () => Visibility.private,
      ),
      featured: json['featured'] ?? false,
      publishedAt: json['publishedAt'] != null
          ? DateTime.parse(json['publishedAt'])
          : null,
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      abilities: (json['abilities'] as List?)
              ?.map((e) => Ability.fromJson(e))
              .toList() ??
          [],
      eras: (json['eras'] as List?)
              ?.map((e) => EraIdentity.fromJson(e))
              .toList() ??
          [],
      dcosFiles: (json['dcosFiles'] as List?)
              ?.map((e) => DcosFile.fromJson(e))
              .toList() ??
          [],
      references: (json['references'] as List?)
              ?.map((e) => ReferenceItem.fromJson(e))
              .toList() ??
          [],
      worlds: (json['worlds'] as List?)
              ?.map((e) => WorldItem.fromJson(e))
              .toList() ??
          [],
      models: (json['models'] as List?)
              ?.map((e) => ModelItem.fromJson(e))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'title': title,
      'slug': slug,
      'tagline': tagline,
      'summary': summary,
      'identityMode': identityMode.name,
      'birthDate': birthDate?.toIso8601String(),
      'gender': gender,
      'pronouns': pronouns,
      'originPlace': originPlace,
      'currentEra': currentEra,
      'species': species,
      'status': status,
      'description': description,
      'coverImageUrl': coverImageUrl,
      'defaultLanguage': defaultLanguage,
      'visibility': visibility.name,
      'featured': featured,
      'publishedAt': publishedAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'abilities': abilities.map((e) => e.toJson()).toList(),
      'eras': eras.map((e) => e.toJson()).toList(),
      'dcosFiles': dcosFiles.map((e) => e.toJson()).toList(),
      'references': references.map((e) => e.toJson()).toList(),
      'worlds': worlds.map((e) => e.toJson()).toList(),
      'models': models.map((e) => e.toJson()).toList(),
    };
  }
}

class Ability {
  final String id;
  final String oasisBioId;
  final String name;
  final String category;
  final String sourceType;
  final int level;
  final String? description;
  final String? relatedWorldId;
  final String? relatedEraId;

  Ability({
    required this.id,
    required this.oasisBioId,
    required this.name,
    required this.category,
    required this.sourceType,
    required this.level,
    this.description,
    this.relatedWorldId,
    this.relatedEraId,
  });

  factory Ability.fromJson(Map<String, dynamic> json) {
    return Ability(
      id: json['id'],
      oasisBioId: json['oasisBioId'],
      name: json['name'],
      category: json['category'],
      sourceType: json['sourceType'],
      level: json['level'],
      description: json['description'],
      relatedWorldId: json['relatedWorldId'],
      relatedEraId: json['relatedEraId'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'oasisBioId': oasisBioId,
      'name': name,
      'category': category,
      'sourceType': sourceType,
      'level': level,
      'description': description,
      'relatedWorldId': relatedWorldId,
      'relatedEraId': relatedEraId,
    };
  }
}

class EraIdentity {
  final String id;
  final String oasisBioId;
  final String name;
  final String eraType;
  final int? startYear;
  final int? endYear;
  final String? description;
  final int sortOrder;

  EraIdentity({
    required this.id,
    required this.oasisBioId,
    required this.name,
    required this.eraType,
    this.startYear,
    this.endYear,
    this.description,
    required this.sortOrder,
  });

  factory EraIdentity.fromJson(Map<String, dynamic> json) {
    return EraIdentity(
      id: json['id'],
      oasisBioId: json['oasisBioId'],
      name: json['name'],
      eraType: json['eraType'],
      startYear: json['startYear'],
      endYear: json['endYear'],
      description: json['description'],
      sortOrder: json['sortOrder'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'oasisBioId': oasisBioId,
      'name': name,
      'eraType': eraType,
      'startYear': startYear,
      'endYear': endYear,
      'description': description,
      'sortOrder': sortOrder,
    };
  }
}

class DcosFile {
  final String id;
  final String oasisBioId;
  final String title;
  final String slug;
  final String content;
  final String folderPath;
  final String status;
  final int version;
  final String? eraId;
  final DateTime createdAt;
  final DateTime updatedAt;

  DcosFile({
    required this.id,
    required this.oasisBioId,
    required this.title,
    required this.slug,
    required this.content,
    required this.folderPath,
    required this.status,
    required this.version,
    this.eraId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory DcosFile.fromJson(Map<String, dynamic> json) {
    return DcosFile(
      id: json['id'],
      oasisBioId: json['oasisBioId'],
      title: json['title'],
      slug: json['slug'],
      content: json['content'],
      folderPath: json['folderPath'],
      status: json['status'],
      version: json['version'],
      eraId: json['eraId'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'oasisBioId': oasisBioId,
      'title': title,
      'slug': slug,
      'content': content,
      'folderPath': folderPath,
      'status': status,
      'version': version,
      'eraId': eraId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

class ReferenceItem {
  final String id;
  final String oasisBioId;
  final String url;
  final String title;
  final String? description;
  final String sourceType;
  final String? provider;
  final String? coverImage;
  final String? metadata;
  final String? eraId;
  final String? worldId;
  final String tags;

  ReferenceItem({
    required this.id,
    required this.oasisBioId,
    required this.url,
    required this.title,
    this.description,
    required this.sourceType,
    this.provider,
    this.coverImage,
    this.metadata,
    this.eraId,
    this.worldId,
    required this.tags,
  });

  factory ReferenceItem.fromJson(Map<String, dynamic> json) {
    return ReferenceItem(
      id: json['id'],
      oasisBioId: json['oasisBioId'],
      url: json['url'],
      title: json['title'],
      description: json['description'],
      sourceType: json['sourceType'],
      provider: json['provider'],
      coverImage: json['coverImage'],
      metadata: json['metadata'],
      eraId: json['eraId'],
      worldId: json['worldId'],
      tags: json['tags'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'oasisBioId': oasisBioId,
      'url': url,
      'title': title,
      'description': description,
      'sourceType': sourceType,
      'provider': provider,
      'coverImage': coverImage,
      'metadata': metadata,
      'eraId': eraId,
      'worldId': worldId,
      'tags': tags,
    };
  }
}

class WorldItem {
  final String id;
  final String oasisBioId;
  final String name;
  final String summary;
  final String? timeSetting;
  final String? geography;
  final String? physicsRules;
  final String? socialStructure;
  final String? aestheticKeywords;
  final String? majorConflict;
  final Visibility visibility;
  final String? timeline;
  final String? rules;
  final String? factions;

  WorldItem({
    required this.id,
    required this.oasisBioId,
    required this.name,
    required this.summary,
    this.timeSetting,
    this.geography,
    this.physicsRules,
    this.socialStructure,
    this.aestheticKeywords,
    this.majorConflict,
    required this.visibility,
    this.timeline,
    this.rules,
    this.factions,
  });

  factory WorldItem.fromJson(Map<String, dynamic> json) {
    return WorldItem(
      id: json['id'],
      oasisBioId: json['oasisBioId'],
      name: json['name'],
      summary: json['summary'],
      timeSetting: json['timeSetting'],
      geography: json['geography'],
      physicsRules: json['physicsRules'],
      socialStructure: json['socialStructure'],
      aestheticKeywords: json['aestheticKeywords'],
      majorConflict: json['majorConflict'],
      visibility: Visibility.values.firstWhere(
        (e) => e.name == json['visibility'],
        orElse: () => Visibility.private,
      ),
      timeline: json['timeline'],
      rules: json['rules'],
      factions: json['factions'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'oasisBioId': oasisBioId,
      'name': name,
      'summary': summary,
      'timeSetting': timeSetting,
      'geography': geography,
      'physicsRules': physicsRules,
      'socialStructure': socialStructure,
      'aestheticKeywords': aestheticKeywords,
      'majorConflict': majorConflict,
      'visibility': visibility.name,
      'timeline': timeline,
      'rules': rules,
      'factions': factions,
    };
  }
}

class ModelItem {
  final String id;
  final String oasisBioId;
  final String modelName;
  final String filePath;
  final String modelFormat;
  final String? previewImage;
  final String? relatedWorldId;
  final String? relatedEraId;
  final bool isPrimary;
  final int version;
  final DateTime createdAt;
  final DateTime updatedAt;

  ModelItem({
    required this.id,
    required this.oasisBioId,
    required this.modelName,
    required this.filePath,
    required this.modelFormat,
    this.previewImage,
    this.relatedWorldId,
    this.relatedEraId,
    required this.isPrimary,
    required this.version,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ModelItem.fromJson(Map<String, dynamic> json) {
    return ModelItem(
      id: json['id'],
      oasisBioId: json['oasisBioId'],
      modelName: json['modelName'],
      filePath: json['filePath'],
      modelFormat: json['modelFormat'],
      previewImage: json['previewImage'],
      relatedWorldId: json['relatedWorldId'],
      relatedEraId: json['relatedEraId'],
      isPrimary: json['isPrimary'],
      version: json['version'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'oasisBioId': oasisBioId,
      'modelName': modelName,
      'filePath': filePath,
      'modelFormat': modelFormat,
      'previewImage': previewImage,
      'relatedWorldId': relatedWorldId,
      'relatedEraId': relatedEraId,
      'isPrimary': isPrimary,
      'version': version,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
