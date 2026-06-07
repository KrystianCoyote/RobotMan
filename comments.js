const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:5000/api" : "https://robotman.onrender.com/api";
let currentUser = JSON.parse(localStorage.getItem("user"));
let token = localStorage.getItem("token");

const authContainer = document.getElementById("authContainer");
const userProfile = document.getElementById("userProfile");
const commentFormContainer = document.getElementById("commentFormContainer");
const currentUsernameSpan = document.getElementById("currentUsername");
const commentsList = document.getElementById("commentsList");

// Lógica de Modal (se obtiene al momento de usarse para evitar errores de carga)
let itemToDelete = null;

document.addEventListener("DOMContentLoaded", () => {
    updateUIForAuth();
    loadComments();
});

function updateUIForAuth() {
    if (token && currentUser) {
        authContainer.style.display = "none";
        userProfile.style.display = "flex";
        commentFormContainer.style.display = "block";
        currentUsernameSpan.innerText = currentUser.username.toUpperCase();
    } else {
        authContainer.style.display = "block";
        userProfile.style.display = "none";
        commentFormContainer.style.display = "none";
    }
}

// --- FUNCIONES DE AUTH ---
document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("regUser").value;
    const password = document.getElementById("regPass").value;
    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            token = data.token;
            currentUser = data.user;
            updateUIForAuth();
            loadComments();
            if (typeof showTerminalNotification === "function") showTerminalNotification("USUARIO_REGISTRADO_EXITO");
        } else {
            if (typeof showTerminalNotification === "function") showTerminalNotification(data.msg || "ERROR_REGISTRO");
        }
    } catch (err) {
        if (typeof showTerminalNotification === "function") showTerminalNotification("ERROR_CONEXION_API");
    }
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUser").value;
    const password = document.getElementById("loginPass").value;
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            token = data.token;
            currentUser = data.user;
            updateUIForAuth();
            loadComments();
            if (typeof showTerminalNotification === "function") showTerminalNotification("ACCESO_CONCEDIDO");
        } else {
            if (typeof showTerminalNotification === "function") showTerminalNotification(data.msg || "ERROR_AUTH");
        }
    } catch (err) {
        if (typeof showTerminalNotification === "function") showTerminalNotification("ERROR_CONEXION_API");
    }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    token = null;
    currentUser = null;
    updateUIForAuth();
    loadComments();
    if (typeof showTerminalNotification === "function") showTerminalNotification("SESION_FINALIZADA");
});

// --- FUNCIONES DE COMENTARIOS ---
async function loadComments() {
    try {
        const res = await fetch(`${API_URL}/comments`);
        const comments = await res.json();
        renderComments(comments);
    } catch (err) {
        commentsList.innerHTML = "<div class=\"loading-comments\">ERROR_CARGA_DATOS</div>";
    }
}

function renderComments(comments) {
    commentsList.innerHTML = "";
    if (!Array.isArray(comments) || comments.length === 0) {
        commentsList.innerHTML = "<div class=\"loading-comments\">SIN_TRANSMISIONES_DETECTADAS</div>";
        return;
    }

    const commentMap = {};
    const roots = [];
    comments.forEach(c => {
        c.replies = [];
        commentMap[c._id] = c;
        if (c.parentId) {
            if (commentMap[c.parentId]) {
                commentMap[c.parentId].replies.push(c);
            }
        } else {
            roots.push(c);
        }
    });

    roots.forEach(root => {
        commentsList.appendChild(createCommentElement(root));
    });
}

function createCommentElement(comment, isReply = false) {
    const div = document.createElement("div");
    div.className = isReply ? "comment-item reply-item" : "comment-item";
    div.id = `comment-${comment._id}`;
    
    const isAdmin = comment.author && comment.author.role === "admin";
    const authorName = comment.author ? comment.author.username : "ANONIMO";
    const isOwner = currentUser && comment.author && (currentUser.id === comment.author._id);
    const iAmAdmin = currentUser && currentUser.role === "admin";
    const canDelete = iAmAdmin || isOwner;

    div.innerHTML = `
        <div class="comment-header">
            <span class="comment-author ${isAdmin ? "admin" : ""}">>> ${authorName.toUpperCase()} ${isAdmin ? "[ADMIN]" : ""}</span>
            <span class="comment-date">${new Date(comment.createdAt).toLocaleString()}</span>
        </div>
        <div class="comment-body" id="body-${comment._id}">
            <div class="comment-content" id="content-${comment._id}">${comment.content}</div>
        </div>
        <div class="comment-actions" id="actions-${comment._id}">
            ${currentUser ? `<button class="action-link reply-link" onclick="toggleReplyForm('${comment._id}')">RESPONDER</button>` : ""}
            ${isOwner ? `<button class="action-link edit-link" onclick="enableInlineEdit('${comment._id}')">EDITAR</button>` : ""}
            ${canDelete ? `<button class="action-link delete-link" onclick="deleteComment('${comment._id}')">ELIMINAR</button>` : ""}
        </div>
        <div id="reply-form-${comment._id}" class="reply-form" style="display:none;">
            <textarea id="reply-content-${comment._id}" placeholder="Escribe tu respuesta..."></textarea>
            <div class="inline-edit-actions">
                <button class="action-link reply-link" onclick="postReply('${comment._id}')">ENVIAR.EXE</button>
                <button class="action-link delete-link" onclick="toggleReplyForm('${comment._id}')">CANCELAR.ESC</button>
            </div>
        </div>
        <div id="replies-${comment._id}" class="replies-container"></div>
    `;

    const repliesContainer = div.querySelector(`#replies-${comment._id}`);
    if (comment.replies) {
        comment.replies.forEach(reply => {
            repliesContainer.appendChild(createCommentElement(reply, true));
        });
    }

    return div;
}

// --- ACCIONES CRUD ---
window.enableInlineEdit = (id) => {
    const contentDiv = document.getElementById(`content-${id}`);
    const actionsDiv = document.getElementById(`actions-${id}`);
    const bodyDiv = document.getElementById(`body-${id}`);
    const originalContent = contentDiv.innerText;

    contentDiv.style.display = "none";
    actionsDiv.style.display = "none";

    const editContainer = document.createElement("div");
    editContainer.id = `edit-container-${id}`;
    editContainer.className = "inline-edit-container";
    editContainer.innerHTML = `
        <textarea id="edit-textarea-${id}" class="inline-edit-textarea">${originalContent}</textarea>
        <div class="inline-edit-actions">
            <button class="action-link edit-link" onclick="saveInlineEdit('${id}')">GUARDAR.SYS</button>
            <button class="action-link delete-link" onclick="cancelInlineEdit('${id}')">CANCELAR.ESC</button>
        </div>
    `;
    bodyDiv.appendChild(editContainer);
};

window.cancelInlineEdit = (id) => {
    const contentDiv = document.getElementById(`content-${id}`);
    const actionsDiv = document.getElementById(`actions-${id}`);
    const editContainer = document.getElementById(`edit-container-${id}`);

    if (editContainer) editContainer.remove();
    contentDiv.style.display = "block";
    actionsDiv.style.display = "flex";
};

window.saveInlineEdit = async (id) => {
    const newContent = document.getElementById(`edit-textarea-${id}`).value;
    const contentDiv = document.getElementById(`content-${id}`);
    if (!newContent || newContent === contentDiv.innerText) {
        cancelInlineEdit(id);
        return;
    }
    try {
        const res = await fetch(`${API_URL}/comments/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "x-auth-token": token },
            body: JSON.stringify({ content: newContent })
        });
        if (res.ok) {
            showTerminalNotification("TRANSMISION_ACTUALIZADA");
            loadComments();
        } else {
            cancelInlineEdit(id);
        }
    } catch (err) {
        cancelInlineEdit(id);
    }
};

document.getElementById("commentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = document.getElementById("commentContent").value;
    await postComment(content);
    document.getElementById("commentContent").value = "";
});

async function postComment(content, parentId = null) {
    const payload = { content };
    if (parentId) payload.parentId = parentId;
    try {
        const res = await fetch(`${API_URL}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-auth-token": token },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            showTerminalNotification("TRANSMISION_EXITOSA");
            loadComments();
        }
    } catch (err) {}
}

window.toggleReplyForm = (id) => {
    const form = document.getElementById(`reply-form-${id}`);
    form.style.display = form.style.display === "block" ? "none" : "block";
};

window.postReply = async (parentId) => {
    const content = document.getElementById(`reply-content-${parentId}`).value;
    if (!content) return;
    await postComment(content, parentId);
    document.getElementById(`reply-content-${parentId}`).value = "";
    document.getElementById(`reply-form-${parentId}`).style.display = "none";
};

// --- LÓGICA DE MODAL ROBUSTA ---
window.deleteComment = (id) => {
    itemToDelete = id;
    const modal = document.getElementById("cyberModal");
    if (modal) {
        modal.style.display = "flex";
        
        // Asignar eventos a los botones del modal cada vez que se abre
        document.getElementById("modalConfirm").onclick = async () => {
            await executeDelete(itemToDelete);
            modal.style.display = "none";
        };
        document.getElementById("modalCancel").onclick = () => {
            modal.style.display = "none";
        };
    } else {
        // Si el modal no existe por alguna razón, usar el confirm normal
        if (confirm("¿ELIMINAR TRANSMISIÓN?")) executeDelete(id);
    }
};

async function executeDelete(id) {
    try {
        const res = await fetch(`${API_URL}/comments/${id}`, {
            method: "DELETE",
            headers: { "x-auth-token": token }
        });
        if (res.ok) {
            showTerminalNotification("DATOS_BORRADOS");
            loadComments();
        }
    } catch (err) {}
}
