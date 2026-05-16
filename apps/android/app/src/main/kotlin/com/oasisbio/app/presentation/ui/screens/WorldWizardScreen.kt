package com.oasisbio.app.presentation.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.oasisbio.app.R
import com.oasisbio.app.domain.model.WorldCharacter
import com.oasisbio.app.domain.model.WorldLore
import com.oasisbio.app.domain.model.WorldLocation
import com.oasisbio.app.domain.model.WorldRules
import com.oasisbio.app.presentation.viewmodel.WorldBuilderViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorldWizardScreen(
    navController: NavHostController,
    viewModel: WorldBuilderViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val wizardState by viewModel.wizardState.collectAsState()

    LaunchedEffect(uiState.saveSuccess) {
        if (uiState.saveSuccess) {
            navController.popBackStack()
            viewModel.clearSaveSuccess()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("创建世界 - 第 ${uiState.currentStep}/6 步") },
                navigationIcon = {
                    IconButton(onClick = {
                        if (uiState.currentStep > 1) {
                            viewModel.previousStep()
                        } else {
                            navController.popBackStack()
                        }
                    }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            StepIndicator(
                currentStep = uiState.currentStep,
                totalSteps = 6,
                modifier = Modifier.padding(16.dp)
            )

            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp)
            ) {
                when (uiState.currentStep) {
                    1 -> Step1BasicInfo(
                        name = wizardState.step1Name,
                        description = wizardState.step1Description,
                        onNameChange = { viewModel.updateStep1Data(it, wizardState.step1Description) },
                        onDescriptionChange = { viewModel.updateStep1Data(wizardState.step1Name, it) }
                    )
                    2 -> Step2GenreAndTone(
                        genre = wizardState.step2Genre,
                        tone = wizardState.step2Tone,
                        onGenreChange = { viewModel.updateStep2Data(it, wizardState.step2Tone) },
                        onToneChange = { viewModel.updateStep2Data(wizardState.step2Genre, it) }
                    )
                    3 -> Step3Themes(
                        themes = wizardState.step3Themes,
                        onThemesChange = { viewModel.updateStep3Themes(it) }
                    )
                    4 -> Step4Characters(
                        characters = wizardState.step4Characters,
                        onAddCharacter = { viewModel.addCharacter(it) },
                        onRemoveCharacter = { viewModel.removeCharacter(it) }
                    )
                    5 -> Step5Locations(
                        locations = wizardState.step5Locations,
                        onAddLocation = { viewModel.addLocation(it) },
                        onRemoveLocation = { viewModel.removeLocation(it) }
                    )
                    6 -> Step6RulesAndLore(
                        rules = wizardState.step6Rules,
                        lore = wizardState.step6Lore,
                        onRulesChange = { viewModel.updateStep6Rules(it) },
                        onAddLore = { viewModel.addLore(it) },
                        onRemoveLore = { viewModel.removeLore(it) }
                    )
                }
            }

            uiState.error?.let { error ->
                Snackbar(
                    modifier = Modifier.padding(16.dp),
                    action = {
                        TextButton(onClick = { viewModel.clearError() }) {
                            Text("关闭")
                        }
                    }
                ) {
                    Text(error)
                }
            }

            NavigationButtons(
                currentStep = uiState.currentStep,
                totalSteps = 6,
                isSaving = uiState.isSaving,
                onPrevious = { viewModel.previousStep() },
                onNext = { viewModel.nextStep() },
                onSave = { viewModel.saveWorld() }
            )
        }
    }
}

@Composable
private fun StepIndicator(
    currentStep: Int,
    totalSteps: Int,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        repeat(totalSteps) { step ->
            val stepNumber = step + 1
            val isCompleted = stepNumber < currentStep
            val isCurrent = stepNumber == currentStep

            Box(
                modifier = Modifier.size(32.dp),
                contentAlignment = Alignment.Center
            ) {
                if (isCompleted) {
                    Icon(
                        Icons.Default.Check,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(24.dp)
                    )
                } else {
                    Surface(
                        shape = MaterialTheme.shapes.small,
                        color = if (isCurrent) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.surfaceVariant
                        },
                        modifier = Modifier.size(24.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = stepNumber.toString(),
                                color = if (isCurrent) {
                                    MaterialTheme.colorScheme.onPrimary
                                } else {
                                    MaterialTheme.colorScheme.onSurfaceVariant
                                },
                                style = MaterialTheme.typography.labelMedium
                            )
                        }
                    }
                }
            }

            if (step < totalSteps - 1) {
                HorizontalDivider(
                    modifier = Modifier
                        .weight(1f)
                        .padding(horizontal = 4.dp)
                        .align(Alignment.CenterVertically),
                    color = if (stepNumber < currentStep) {
                        MaterialTheme.colorScheme.primary
                    } else {
                        MaterialTheme.colorScheme.surfaceVariant
                    }
                )
            }
        }
    }
}

@Composable
private fun Step1BasicInfo(
    name: String,
    description: String,
    onNameChange: (String) -> Unit,
    onDescriptionChange: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(
            text = "基本信息",
            style = MaterialTheme.typography.headlineSmall
        )

        OutlinedTextField(
            value = name,
            onValueChange = onNameChange,
            label = { Text("世界名称 *") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        OutlinedTextField(
            value = description,
            onValueChange = onDescriptionChange,
            label = { Text("世界描述") },
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp),
            maxLines = 5
        )
    }
}

@Composable
private fun Step2GenreAndTone(
    genre: String,
    tone: String,
    onGenreChange: (String) -> Unit,
    onToneChange: (String) -> Unit
) {
    val genres = listOf("科幻", "奇幻", "悬疑", "冒险", "爱情", "历史", "现代", "末日")
    val tones = listOf("轻松", "严肃", "黑暗", "幽默", "浪漫", "紧张", "史诗", "日常")

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(
            text = "类型与风格",
            style = MaterialTheme.typography.headlineSmall
        )

        Text(
            text = "选择世界类型",
            style = MaterialTheme.typography.titleMedium
        )

        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            genres.forEach { g ->
                FilterChip(
                    selected = genre == g,
                    onClick = { onGenreChange(g) },
                    label = { Text(g) }
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "选择世界风格",
            style = MaterialTheme.typography.titleMedium
        )

        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            tones.forEach { t ->
                FilterChip(
                    selected = tone == t,
                    onClick = { onToneChange(t) },
                    label = { Text(t) }
                )
            }
        }
    }
}

@Composable
private fun Step3Themes(
    themes: List<String>,
    onThemesChange: (List<String>) -> Unit
) {
    val availableThemes = listOf(
        "成长", "救赎", "复仇", "爱情", "友情", "家庭",
        "战争", "和平", "自由", "命运", "身份认同", "科技"
    )

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(
            text = "核心主题",
            style = MaterialTheme.typography.headlineSmall
        )

        Text(
            text = "选择或添加世界核心主题",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            availableThemes.forEach { theme ->
                FilterChip(
                    selected = theme in themes,
                    onClick = {
                        val newThemes = if (theme in themes) {
                            themes - theme
                        } else {
                            themes + theme
                        }
                        onThemesChange(newThemes)
                    },
                    label = { Text(theme) }
                )
            }
        }
    }
}

@Composable
private fun Step4Characters(
    characters: List<WorldCharacter>,
    onAddCharacter: (WorldCharacter) -> Unit,
    onRemoveCharacter: (WorldCharacter) -> Unit
) {
    var showDialog by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "主要角色",
                style = MaterialTheme.typography.headlineSmall
            )
            FilledTonalButton(onClick = { showDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = null)
                Spacer(modifier = Modifier.width(4.dp))
                Text("添加角色")
            }
        }

        if (characters.isEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Text(
                    text = "暂未添加角色",
                    modifier = Modifier.padding(16.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(characters) { character ->
                    CharacterCard(
                        character = character,
                        onRemove = { onRemoveCharacter(character) }
                    )
                }
            }
        }
    }

    if (showDialog) {
        AlertDialog(
            onDismissRequest = {
                showDialog = false
                name = ""
                role = ""
                description = ""
            },
            title = { Text("添加角色") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("角色名称 *") },
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = role,
                        onValueChange = { role = it },
                        label = { Text("角色定位") },
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("角色描述") },
                        maxLines = 3
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        if (name.isNotBlank()) {
                            onAddCharacter(WorldCharacter(name, role, description))
                            showDialog = false
                            name = ""
                            role = ""
                            description = ""
                        }
                    }
                ) {
                    Text("添加")
                }
            },
            dismissButton = {
                TextButton(onClick = {
                    showDialog = false
                }) {
                    Text("取消")
                }
            }
        )
    }
}

@Composable
private fun CharacterCard(character: WorldCharacter, onRemove: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = character.name,
                    style = MaterialTheme.typography.titleMedium
                )
                if (character.role.isNotBlank()) {
                    Text(
                        text = character.role,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                if (character.description.isNotBlank()) {
                    Text(
                        text = character.description,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            IconButton(onClick = onRemove) {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = "删除",
                    tint = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}

@Composable
private fun Step5Locations(
    locations: List<WorldLocation>,
    onAddLocation: (WorldLocation) -> Unit,
    onRemoveLocation: (WorldLocation) -> Unit
) {
    var showDialog by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "重要地点",
                style = MaterialTheme.typography.headlineSmall
            )
            FilledTonalButton(onClick = { showDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = null)
                Spacer(modifier = Modifier.width(4.dp))
                Text("添加地点")
            }
        }

        if (locations.isEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Text(
                    text = "暂未添加地点",
                    modifier = Modifier.padding(16.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(locations) { location ->
                    LocationCard(
                        location = location,
                        onRemove = { onRemoveLocation(location) }
                    )
                }
            }
        }
    }

    if (showDialog) {
        AlertDialog(
            onDismissRequest = {
                showDialog = false
                name = ""
                type = ""
                description = ""
            },
            title = { Text("添加地点") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("地点名称 *") },
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = type,
                        onValueChange = { type = it },
                        label = { Text("地点类型") },
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("地点描述") },
                        maxLines = 3
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        if (name.isNotBlank()) {
                            onAddLocation(WorldLocation(name, type, description))
                            showDialog = false
                            name = ""
                            type = ""
                            description = ""
                        }
                    }
                ) {
                    Text("添加")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDialog = false }) {
                    Text("取消")
                }
            }
        )
    }
}

@Composable
private fun LocationCard(location: WorldLocation, onRemove: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = location.name,
                    style = MaterialTheme.typography.titleMedium
                )
                if (location.type.isNotBlank()) {
                    Text(
                        text = location.type,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                if (location.description.isNotBlank()) {
                    Text(
                        text = location.description,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            IconButton(onClick = onRemove) {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = "删除",
                    tint = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}

@Composable
private fun Step6RulesAndLore(
    rules: WorldRules,
    lore: List<WorldLore>,
    onRulesChange: (WorldRules) -> Unit,
    onAddLore: (WorldLore) -> Unit,
    onRemoveLore: (WorldLore) -> Unit
) {
    var showLoreDialog by remember { mutableStateOf(false) }
    var loreTitle by remember { mutableStateOf("") }
    var loreContent by remember { mutableStateOf("") }
    var loreCategory by remember { mutableStateOf("") }

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(
            text = "规则与世界观",
            style = MaterialTheme.typography.headlineSmall
        )

        OutlinedTextField(
            value = rules.magicSystem,
            onValueChange = { onRulesChange(rules.copy(magicSystem = it)) },
            label = { Text("魔法/科技体系") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        OutlinedTextField(
            value = rules.technologyLevel,
            onValueChange = { onRulesChange(rules.copy(technologyLevel = it)) },
            label = { Text("科技水平") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        OutlinedTextField(
            value = rules.socialStructure,
            onValueChange = { onRulesChange(rules.copy(socialStructure = it)) },
            label = { Text("社会结构") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        OutlinedTextField(
            value = rules.economy,
            onValueChange = { onRulesChange(rules.copy(economy = it)) },
            label = { Text("经济体系") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        OutlinedTextField(
            value = rules.politics,
            onValueChange = { onRulesChange(rules.copy(politics = it)) },
            label = { Text("政治体系") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        HorizontalDivider()

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "世界传说/历史",
                style = MaterialTheme.typography.titleMedium
            )
            FilledTonalButton(onClick = { showLoreDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = null)
                Spacer(modifier = Modifier.width(4.dp))
                Text("添加传说")
            }
        }

        if (lore.isNotEmpty()) {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(lore) { item ->
                    LoreCard(
                        lore = item,
                        onRemove = { onRemoveLore(item) }
                    )
                }
            }
        }
    }

    if (showLoreDialog) {
        AlertDialog(
            onDismissRequest = {
                showLoreDialog = false
                loreTitle = ""
                loreContent = ""
                loreCategory = ""
            },
            title = { Text("添加传说/历史") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = loreTitle,
                        onValueChange = { loreTitle = it },
                        label = { Text("标题 *") },
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = loreCategory,
                        onValueChange = { loreCategory = it },
                        label = { Text("分类") },
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = loreContent,
                        onValueChange = { loreContent = it },
                        label = { Text("内容") },
                        maxLines = 5
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        if (loreTitle.isNotBlank()) {
                            onAddLore(WorldLore(loreTitle, loreContent, loreCategory))
                            showLoreDialog = false
                            loreTitle = ""
                            loreContent = ""
                            loreCategory = ""
                        }
                    }
                ) {
                    Text("添加")
                }
            },
            dismissButton = {
                TextButton(onClick = { showLoreDialog = false }) {
                    Text("取消")
                }
            }
        )
    }
}

@Composable
private fun LoreCard(lore: WorldLore, onRemove: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = lore.title,
                    style = MaterialTheme.typography.titleMedium
                )
                if (lore.category.isNotBlank()) {
                    Text(
                        text = lore.category,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                if (lore.content.isNotBlank()) {
                    Text(
                        text = lore.content,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            IconButton(onClick = onRemove) {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = "删除",
                    tint = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}

@Composable
private fun NavigationButtons(
    currentStep: Int,
    totalSteps: Int,
    isSaving: Boolean,
    onPrevious: () -> Unit,
    onNext: () -> Unit,
    onSave: () -> Unit
) {
    Surface(
        tonalElevation = 3.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            if (currentStep > 1) {
                OutlinedButton(onClick = onPrevious) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("上一步")
                }
            } else {
                Spacer(modifier = Modifier.width(1.dp))
            }

            if (currentStep < totalSteps) {
                Button(onClick = onNext) {
                    Text("下一步")
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null)
                }
            } else {
                Button(
                    onClick = onSave,
                    enabled = !isSaving
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp
                        )
                    } else {
                        Icon(Icons.Default.Check, contentDescription = null)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("完成创建")
                    }
                }
            }
        }
    }
}
