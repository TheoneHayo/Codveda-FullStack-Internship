const apiUrl = "/users";

// UI Elements
const usersList = document.getElementById("usersList");
const form = document.getElementById("userForm");
const errorMessage = document.getElementById("errorMessage");
const successMessage = document.getElementById("successMessage");
const loading = document.getElementById("loading");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");
const logoutBtn = document.getElementById("logoutBtn");
const pagination = document.getElementById("pagination");

let currentPage = 1;
let currentSearch = "";

// ================= HELPERS =================
function getToken() {
    return localStorage.getItem("token");
}

function showApp() {
    authSection.style.display = "none";
    appSection.style.display = "block";
    logoutBtn.style.display = "inline-block";
}

function showAuth() {
    authSection.style.display = "block";
    appSection.style.display = "none";
    logoutBtn.style.display = "none";
}

function toggleAuth() {
    const loginSection = document.querySelector("#authSection section:first-child");
    const registerSection = document.getElementById("registerSection");
    loginSection.style.display = loginSection.style.display === "none" ? "block" : "none";
    registerSection.style.display = registerSection.style.display === "none" ? "block" : "none";
}

// ================= ON LOAD =================
window.addEventListener("DOMContentLoaded", () => {
    if (getToken()) {
        showApp();
        fetchUsers();
    } else {
        showAuth();
    }
});

// ================= REGISTER =================
async function register() {
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const msg = document.getElementById("registerMessage");

    if (!name || !email || !password) {
        msg.textContent = "All fields are required.";
        msg.className = "error";
        return;
    }

    try {
        const res = await fetch("/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            msg.textContent = data.message || "Registration failed.";
            msg.className = "error";
            return;
        }

        msg.textContent = "Registered! Please login.";
        msg.className = "success";
        toggleAuth();

    } catch (err) {
        msg.textContent = "Network error.";
        msg.className = "error";
    }
}

// ================= LOGIN =================
async function login() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const msg = document.getElementById("loginMessage");

    if (!email || !password) {
        msg.textContent = "Please enter email and password.";
        msg.className = "error";
        return;
    }

    try {
        const res = await fetch("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            msg.textContent = data.message || `Login failed (${res.status})`;
            msg.className = "error";
            return;
        }

        localStorage.setItem("token", data.token);
        showApp();
        fetchUsers();

    } catch (err) {
        msg.textContent = "Network error. Is the server running?";
        msg.className = "error";
    }
}

// ================= LOGOUT =================
function logout() {
    localStorage.removeItem("token");
    usersList.innerHTML = "";
    pagination.innerHTML = "";
    showAuth();
}

// ================= FETCH USERS =================
async function fetchUsers(page = 1, search = "") {
    const token = getToken();
    if (!token) { showAuth(); return; }

    loading.style.display = "block";
    usersList.innerHTML = "";
    pagination.innerHTML = "";
    currentPage = page;
    currentSearch = search;

    try {
        const res = await fetch(`/users?page=${page}&limit=5&search=${encodeURIComponent(search)}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401) { logout(); return; }

        const data = await res.json();

        if (!res.ok) {
            usersList.innerHTML = `<p class="error">${data.message}</p>`;
            return;
        }

        const users = data.users || data;

        if (!users.length) {
            usersList.innerHTML = "<p>No users found.</p>";
            return;
        }

        users.forEach(user => {
            const div = document.createElement("div");
            div.classList.add("user-card");
            div.innerHTML = `
                <div class="user-info">
                    <strong>${user.name}</strong>
                    <span>${user.email}</span>
                </div>
                <div class="user-actions">
                    <button class="btn-edit" onclick="editUser('${user._id}', '${user.name}', '${user.email}')">Edit</button>
                    <button class="btn-delete" onclick="deleteUser('${user._id}')">Delete</button>
                </div>
            `;
            usersList.appendChild(div);
        });

        // Pagination
        if (data.totalPages > 1) {
            for (let i = 1; i <= data.totalPages; i++) {
                const btn = document.createElement("button");
                btn.textContent = i;
                btn.className = i === page ? "page-btn active" : "page-btn";
                btn.onclick = () => fetchUsers(i, currentSearch);
                pagination.appendChild(btn);
            }
        }

    } catch (err) {
        usersList.innerHTML = "<p class='error'>Failed to load users. Is the server running?</p>";
    } finally {
        loading.style.display = "none";
    }
}

// ================= ADD USER =================
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMessage.textContent = "";
    successMessage.textContent = "";

    const token = getToken();
    if (!token) { showAuth(); return; }

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!name || !email || !password) {
        errorMessage.textContent = "All fields are required.";
        return;
    }

    try {
        const res = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            errorMessage.textContent = data.message || `Error: ${res.status}`;
            return;
        }

        successMessage.textContent = "User added successfully!";
        setTimeout(() => { successMessage.textContent = ""; }, 3000);
        form.reset();
        fetchUsers(currentPage, currentSearch);

    } catch (err) {
        errorMessage.textContent = "Network error. Try again.";
    }
});

// ================= DELETE USER =================
async function deleteUser(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const token = getToken();

    try {
        const res = await fetch(`${apiUrl}/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) {
            const data = await res.json();
            alert(data.message || "Delete failed.");
            return;
        }

        fetchUsers(currentPage, currentSearch);

    } catch (err) {
        alert("Network error. Could not delete user.");
    }
}

// ================= EDIT USER =================
async function editUser(id, currentName, currentEmail) {
    const token = getToken();
    const newName = prompt("Enter new name:", currentName);
    const newEmail = prompt("Enter new email:", currentEmail);
    if (!newName || !newEmail) return;

    try {
        const res = await fetch(`/users/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name: newName, email: newEmail })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Update failed.");
            return;
        }

        fetchUsers(currentPage, currentSearch);

    } catch (err) {
        alert("Network error. Update failed.");
    }
}

// ================= SEARCH =================
searchBtn.addEventListener("click", () => {
    fetchUsers(1, searchInput.value.trim());
});

searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") fetchUsers(1, searchInput.value.trim());
});