const tokenInput = document.getElementById("tokenInput");
const scanBtn = document.getElementById("scanBtn");
const historyBtn = document.getElementById("historyBtn");
const scanSection = document.getElementById("scanSection");
const historySection = document.getElementById("historySection");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const confirmLoginBtn = document.getElementById("confirmLoginBtn");

const fileInput = document.getElementById("fileInput");
const clearFileBtn = document.getElementById("clearFileBtn");

let pendingDeleteId = null;

const HOST = "https://invoices-mngmt.onrender.com";
let token = localStorage.getItem("authToken") || "";

if (token) {
  loginBtn.classList.add("d-none");
  logoutBtn.classList.remove("d-none");
}

loginBtn.addEventListener("click", () => {
  new bootstrap.Modal(document.getElementById("loginModal")).show();
});

logoutBtn.addEventListener("click", async () => {
  try {
    await fetch(`${HOST}/api/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.warn("Error al cerrar sesión:", err.message);
  }

  // Limpiar estado visual
  document.getElementById("userGreeting").classList.add("d-none");
  document.getElementById("historySection").classList.add("hidden");
  document.getElementById("scanSection").classList.add("hidden");
  document.getElementById("welcomeSection").classList.remove("hidden");
  document.getElementById("provider").textContent = "";
  document.getElementById("issueDate").textContent = "";
  document.getElementById("itemsTable").innerHTML = "";
  document.getElementById("results").classList.add("hidden");

  // Limpiar sesión
  localStorage.removeItem("authToken");
  token = "";

  // Actualizar UI
  updateUIBasedOnAuth();
});

scanBtn.addEventListener("click", () => {
  localStorage.setItem("activeView", "scan");
  scanBtn.classList.add("active");
  historyBtn.classList.remove("active");
  scanSection.classList.remove("hidden");
  historySection.classList.add("hidden");
  document.getElementById("results").classList.add("hidden");
document.getElementById("provider").textContent = "";
document.getElementById("issueDate").textContent = "";
document.getElementById("itemsTable").innerHTML = "";
document.getElementById("fileInput").value = "";
document.getElementById("clearFileBtn")?.classList.add("d-none");
});

historyBtn.addEventListener("click", async () => {
  localStorage.setItem("activeView", "history");
  scanBtn.classList.remove("active");
  historyBtn.classList.add("active");
  scanSection.classList.add("hidden");
  historySection.classList.remove("hidden");

  const token = localStorage.getItem("authToken") || "";
  if (!token) return showError("Proporciona el token");

  try {
    const res = await fetch(`${HOST}/api/invoices`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    document.getElementById("results").classList.add("hidden");
    document.getElementById("provider").textContent = "";
    document.getElementById("issueDate").textContent = "";
    document.getElementById("itemsTable").innerHTML = "";

    const json = await res.json();
    renderHistory(json.data || []);
  } catch (err) {
    showError("Error al cargar historial: " + err.message);
  }
});

document.getElementById("uploadBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  const token = localStorage.getItem("authToken") || "";

  if (!file || !token) {
    showError("Selecciona una imagen y proporciona el token");
    return;
  }

  document.getElementById("loading").classList.remove("hidden");
  document.getElementById("results").classList.add("hidden");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${HOST}/api/invoices/ocrscan`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const json = await res.json();
    const invoice = json.data;

    if (!invoice || !invoice.items) {
      showError("No se pudo extraer la factura");
      return;
    }

    renderResults(invoice);
  } catch (err) {
    showError("Error al procesar la imagen: " + err.message);
  } finally {
    fileInput.value = ""; // Limpia el campo
    document.getElementById("clearFileBtn")?.classList.add("d-none");
    document.getElementById("loading").classList.add("hidden");
  }
});

function renderHistory(invoices) {
  const container = document.getElementById("historyCards");
  container.innerHTML = "";

  invoices.forEach((inv) => {
    const card = document.createElement("div");
    card.className = "card mb-3 shadow-sm";

    card.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">${inv.provider}</h5>
        <p class="card-text mb-1"><strong>Fecha:</strong> ${formatDate(
          inv.issueDate
        )}</p>
        <p class="card-text mb-2"><strong>Ítems:</strong> ${
          inv.items?.length || 0
        }</p>
        <div class="d-flex gap-3">
          <i class="fas fa-file-lines text-primary" role="button" title="Ver desglose"
             onclick='showInvoiceDetails(${JSON.stringify(inv)})'></i>

          ${
            inv.attachments?.[0]?.url
              ? `<i class="fas fa-image text-secondary" role="button" title="Ver imagen"
                 onclick="window.open('${inv.attachments[0].url}', '_blank')"></i>`
              : ""
          }

          <i class="fas fa-trash-alt text-danger" role="button" title="Eliminar"
             onclick="deleteInvoice('${inv.id}')"></i>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function showInvoiceDetails(invoice) {
  const modalDetails = document.getElementById("modalInvoiceDetails");
  const viewImageBtn = document.getElementById("viewImageBtn");

  modalDetails.innerHTML = `
    <p><strong>Proveedor:</strong> ${invoice.provider}</p>
    <p><strong>Fecha de emisión:</strong> ${formatDate(invoice.issueDate)}</p>
    <table class="table table-sm table-bordered">
      <thead>
        <tr>
          <th>Descripción</th>
          <th>Cantidad</th>
          <th>Precio</th>
          <th>Total</th>
          <th>Garantía</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items
          .map(
            (item) => `
          <tr>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>${item.unitPrice}</td>
            <td>${item.total}</td>
            <td>${item.warrantyNotes}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  if (invoice.attachments?.[0]?.url) {
    viewImageBtn.classList.remove("d-none");
    viewImageBtn.onclick = () =>
      window.open(invoice.attachments[0].url, "_blank");
  } else {
    viewImageBtn.classList.add("d-none");
  }

  new bootstrap.Modal(document.getElementById("invoiceModal")).show();
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("es-CR");
}

function deleteInvoice(id) {
  const token = localStorage.getItem("authToken") || "";
  if (!token) return showError("Token requerido para eliminar");

  pendingDeleteId = id;
  new bootstrap.Modal(document.getElementById("confirmDeleteModal")).show();
}

document
  .getElementById("confirmDeleteBtn")
  .addEventListener("click", async () => {
    if (!pendingDeleteId) return;

    const token = localStorage.getItem("authToken") || "";
    try {
      const res = await fetch(`${HOST}/api/invoices/${pendingDeleteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("No se pudo eliminar");

      showSuccess("Factura eliminada");
      pendingDeleteId = null;
      bootstrap.Modal.getInstance(
        document.getElementById("confirmDeleteModal")
      ).hide();
      historyBtn.click(); // Recarga historial
    } catch (err) {
      showError("Error al eliminar: " + err.message);
    }
  });

function renderResults(data) {
  document.getElementById("provider").textContent = data.provider || "—";
  document.getElementById("issueDate").textContent = formatDate(data.issueDate);

  const tbody = document.getElementById("itemsTable");
  tbody.innerHTML = "";

  (data.items || []).forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.description}</td>
      <td>${item.quantity}</td>
      <td>${item.unitPrice}</td>
      <td>${item.total}</td>
      <td>${item.warrantyNotes}</td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById("results").classList.remove("hidden");
}

function showError(msg) {
  const modalEl = document.getElementById("errorModal");
  document.getElementById("errorMessage").textContent = msg;
  new bootstrap.Modal(modalEl).show();

  setTimeout(() => {
    bootstrap.Modal.getInstance(modalEl).hide();
  }, 4000);
}

document.getElementById("registerBtn").addEventListener("click", () => {
  new bootstrap.Modal(document.getElementById("registerModal")).show();
});

document
  .getElementById("confirmRegisterBtn")
  .addEventListener("click", async () => {
    const email = document.getElementById("registerEmail").value.trim();
    const fullname = document
      .getElementById("registerFullname")
      .value.trim()
      .toLowerCase();
    const password = document.getElementById("registerPassword").value;
    const confirm = document.getElementById("registerConfirm").value;

    if (!email || !fullname || !password || !confirm)
      return showError("Completa todos los campos");
    if (password !== confirm) return showError("Las contraseñas no coinciden");

    try {
      const res = await fetch(`${HOST}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullname, password }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Registro fallido");

      bootstrap.Modal.getInstance(
        document.getElementById("registerModal")
      ).hide();
      showSuccess("Registro exitoso. Ahora podés iniciar sesión.");
    } catch (err) {
      showError("Error al registrar: " + err.message);
    }
  });

document
  .getElementById("confirmLoginBtn")
  .addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) return showError("Completa los campos");

    try {
      const res = await fetch(`${HOST}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      const user = json.data;

      if (!json.success || !user?.token)
        throw new Error(json.message || "Login fallido");

      // Guardar token y datos del usuario
      token = user.token;
      localStorage.setItem("authToken", token);
      localStorage.setItem("userFullname", user.fullname);
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("userRole", user.role);

      // Mostrar saludo
      const greeting = document.getElementById("userGreeting");
      greeting.textContent = `¡Hola!, ${user.fullname}`;
      greeting.classList.remove("d-none");

      loginBtn.classList.add("d-none");
      logoutBtn.classList.remove("d-none");
      bootstrap.Modal.getInstance(document.getElementById("loginModal")).hide();

      showSuccess(json.message || "Inicio de sesión exitoso");
      updateUIBasedOnAuth();
    } catch (err) {
      showError("Error al iniciar sesión: " + err.message);
    }
  });

function updateUIBasedOnAuth() {
  const isLoggedIn = !!localStorage.getItem("authToken");

  document.getElementById("scanBtn").classList.toggle("d-none", !isLoggedIn);
  document.getElementById("historyBtn").classList.toggle("d-none", !isLoggedIn);
  document.getElementById("loginBtn").classList.toggle("d-none", isLoggedIn);
  document.getElementById("logoutBtn").classList.toggle("d-none", !isLoggedIn);
  document.getElementById("registerBtn").classList.toggle("d-none", isLoggedIn);
  document
    .getElementById("welcomeSection")
    .classList.toggle("hidden", isLoggedIn);
  document
    .getElementById("scanSection")
    .classList.toggle("hidden", !isLoggedIn);
  document.getElementById("historySection").classList.add("hidden"); // Siempre ocultar al inicio
  document
    .getElementById("uploadControls")
    .classList.toggle("hidden", !isLoggedIn);
  document.getElementById("provider").textContent = "";
  document.getElementById("issueDate").textContent = "";
  document.getElementById("itemsTable").innerHTML = "";

  const name = localStorage.getItem("userFullname");
  const greeting = document.getElementById("userGreeting");
  if (isLoggedIn && name) {
    greeting.textContent = `Hola, ${name}`;
    greeting.classList.remove("d-none");
  } else {
    greeting.classList.add("d-none");
  }
}

function showSuccess(msg) {
  const modalEl = document.getElementById("successModal");
  const body = document.getElementById("successMessage");

  body.textContent = msg;
  new bootstrap.Modal(modalEl).show();

  setTimeout(() => {
    bootstrap.Modal.getInstance(modalEl).hide();
  }, 3000);
}

fileInput.addEventListener("change", () => {
  clearFileBtn.classList.toggle("d-none", !fileInput.files.length);
});

clearFileBtn.addEventListener("click", () => {
  fileInput.value = "";
  clearFileBtn.classList.add("d-none");
});

updateUIBasedOnAuth();
const activeView = localStorage.getItem("activeView");
if (activeView === "history") {
  historyBtn.click();
} else if (activeView === "scan") {
  scanBtn.click();
}
