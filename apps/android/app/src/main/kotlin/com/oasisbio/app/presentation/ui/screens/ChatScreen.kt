package com.oasisbio.app.presentation.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.oasisbio.app.R
import com.oasisbio.app.domain.model.ChatMessage
import com.oasisbio.app.domain.model.ChatSession
import com.oasisbio.app.domain.model.MessageRole
import com.oasisbio.app.domain.repository.AssistantType
import com.oasisbio.app.presentation.viewmodel.AssistantViewModel
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    navController: NavHostController,
    sessionId: String? = null,
    viewModel: AssistantViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val sessions by viewModel.sessions.collectAsState()
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    var messageInput by remember { mutableStateOf("") }
    var showSessionList by remember { mutableStateOf(sessionId == null) }

    LaunchedEffect(sessionId) {
        if (sessionId != null) {
            val session = sessions.find { it.id == sessionId }
            if (session != null) {
                viewModel.selectSession(session)
                showSessionList = false
            }
        }
    }

    LaunchedEffect(uiState.messages.size) {
        if (uiState.messages.isNotEmpty()) {
            coroutineScope.launch {
                listState.animateScrollToItem(uiState.messages.size - 1)
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    if (showSessionList) {
                        Text("AI 助手")
                    } else {
                        Column {
                            Text(
                                uiState.currentSession?.title ?: "新会话",
                                style = MaterialTheme.typography.titleMedium
                            )
                            Text(
                                "与 ${uiState.selectedAssistantType.displayName} 对话",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                navigationIcon = {
                    if (!showSessionList) {
                        IconButton(onClick = {
                            viewModel.clearCurrentSession()
                            showSessionList = true
                        }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回")
                        }
                    }
                },
                actions = {
                    if (!showSessionList) {
                        IconButton(onClick = {
                            val newType = if (uiState.selectedAssistantType == AssistantType.DEO) {
                                AssistantType.DIA
                            } else {
                                AssistantType.DEO
                            }
                            viewModel.switchAssistantType(newType)
                        }) {
                            Icon(Icons.Default.SwapHoriz, contentDescription = "切换助手")
                        }
                        IconButton(onClick = {
                            uiState.currentSession?.id?.let { viewModel.deleteSession(it) }
                            showSessionList = true
                        }) {
                            Icon(Icons.Default.Delete, contentDescription = "删除会话")
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            if (showSessionList) {
                SessionListContent(
                    sessions = sessions,
                    isLoading = uiState.isLoading,
                    error = uiState.error,
                    onSessionClick = { session ->
                        viewModel.selectSession(session)
                        showSessionList = false
                    },
                    onCreateSession = {
                        viewModel.createSession()
                        showSessionList = false
                    },
                    onRetry = { viewModel.loadSessions() },
                    onClearError = { viewModel.clearError() }
                )
            } else {
                ChatContent(
                    messages = uiState.messages,
                    messageInput = messageInput,
                    isSending = uiState.isSending,
                    isLoading = uiState.isLoading,
                    error = uiState.error,
                    listState = listState,
                    onMessageInputChange = { messageInput = it },
                    onSendMessage = {
                        if (messageInput.isNotBlank()) {
                            viewModel.sendMessage(messageInput)
                            messageInput = ""
                        }
                    },
                    onRetry = { viewModel.loadMessages(uiState.currentSession?.id ?: "") },
                    onClearError = { viewModel.clearError() }
                )
            }
        }
    }
}

@Composable
private fun SessionListContent(
    sessions: List<ChatSession>,
    isLoading: Boolean,
    error: String?,
    onSessionClick: (ChatSession) -> Unit,
    onCreateSession: () -> Unit,
    onRetry: () -> Unit,
    onClearError: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        if (error != null) {
            Snackbar(
                modifier = Modifier.padding(16.dp),
                action = {
                    TextButton(onClick = onClearError) {
                        Text("关闭")
                    }
                }
            ) {
                Text(error)
            }
        }

        when {
            isLoading -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            sessions.isEmpty() -> {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "暂无会话",
                            style = MaterialTheme.typography.headlineSmall,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = onCreateSession) {
                            Icon(Icons.Default.Add, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("开始新会话")
                        }
                    }
                }
            }
            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(sessions, key = { it.id }) { session ->
                        SessionCard(
                            session = session,
                            onClick = { onSessionClick(session) }
                        )
                    }
                }
            }
        }

        FloatingActionButton(
            onClick = onCreateSession,
            modifier = Modifier
                .align(Alignment.End)
                .padding(16.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = "新建会话")
        }
    }
}

@Composable
private fun SessionCard(session: ChatSession, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = session.title ?: "新会话",
                    style = MaterialTheme.typography.titleMedium
                )
                SuggestionChip(
                    onClick = {},
                    label = {
                        Text(
                            session.assistantType,
                            style = MaterialTheme.typography.labelSmall
                        )
                    }
                )
            }
            if (!session.lastMessage.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = session.lastMessage,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2
                )
            }
        }
    }
}

@Composable
private fun ChatContent(
    messages: List<ChatMessage>,
    messageInput: String,
    isSending: Boolean,
    isLoading: Boolean,
    error: String?,
    listState: androidx.compose.foundation.lazy.LazyListState,
    onMessageInputChange: (String) -> Unit,
    onSendMessage: () -> Unit,
    onRetry: () -> Unit,
    onClearError: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        if (error != null) {
            Snackbar(
                modifier = Modifier.padding(8.dp),
                action = {
                    TextButton(onClick = onClearError) {
                        Text("关闭")
                    }
                }
            ) {
                Text(error)
            }
        }

        when {
            isLoading -> {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            messages.isEmpty() -> {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "开始对话吧！",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    state = listState,
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(messages, key = { it.id }) { message ->
                        MessageBubble(message = message)
                    }
                }
            }
        }

        MessageInput(
            messageInput = messageInput,
            isSending = isSending,
            onMessageInputChange = onMessageInputChange,
            onSendMessage = onSendMessage
        )
    }
}

@Composable
private fun MessageBubble(message: ChatMessage) {
    val isUser = message.role == MessageRole.USER
    val alignment = if (isUser) Alignment.End else Alignment.Start
    val backgroundColor = if (isUser) {
        MaterialTheme.colorScheme.primary
    } else {
        MaterialTheme.colorScheme.secondaryContainer
    }
    val textColor = if (isUser) {
        MaterialTheme.colorScheme.onPrimary
    } else {
        MaterialTheme.colorScheme.onSecondaryContainer
    }

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = alignment
    ) {
        Box(
            modifier = Modifier
                .widthIn(max = 280.dp)
                .clip(
                    RoundedCornerShape(
                        topStart = 16.dp,
                        topEnd = 16.dp,
                        bottomStart = if (isUser) 16.dp else 4.dp,
                        bottomEnd = if (isUser) 4.dp else 16.dp
                    )
                )
                .background(backgroundColor)
                .padding(12.dp)
        ) {
            Text(
                text = message.content,
                color = textColor,
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

@Composable
private fun MessageInput(
    messageInput: String,
    isSending: Boolean,
    onMessageInputChange: (String) -> Unit,
    onSendMessage: () -> Unit
) {
    Surface(
        tonalElevation = 3.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .padding(horizontal = 16.dp, vertical = 8.dp)
                .imePadding(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = messageInput,
                onValueChange = onMessageInputChange,
                modifier = Modifier.weight(1f),
                placeholder = { Text("输入消息...") },
                maxLines = 4,
                enabled = !isSending
            )
            Spacer(modifier = Modifier.width(8.dp))
            IconButton(
                onClick = onSendMessage,
                enabled = !isSending && messageInput.isNotBlank()
            ) {
                if (isSending) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        strokeWidth = 2.dp
                    )
                } else {
                    Icon(
                        Icons.AutoMirrored.Filled.Send,
                        contentDescription = "发送",
                        tint = if (messageInput.isNotBlank()) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.onSurfaceVariant
                        }
                    )
                }
            }
        }
    }
}
