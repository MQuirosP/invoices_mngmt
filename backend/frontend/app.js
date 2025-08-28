const tokenInput = document.getElementById("tokenInput");
const scanBtn = document.getElementById("scanBtn");
const historyBtn = document.getElementById("historyBtn");
const scanSection = document.getElementById("scanSection");
const historySection = document.getElementById("historySection");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const confirmLoginBtn = document.getElementById("confirmLoginBtn");

const HOST = 'https://invoices-mngmt.onrender.com';
let token = localStorage.getItem("authToken") || "";

if (token) {
  loginBtn.classList.add("d-none");
  logoutBtn.classList.remove("d-none");
}

loginBtn.addEventListener("click", () => {
  new bootstrap.Modal(document.getElementById("loginModal")).show();
});

confirmLoginBtn.addEventListener("click", async () => {
  const inputToken = tokenInput.value.trim();
  if (!inputToken) return showError("Token vacío");

  try {
    const res = await fetch(`${HOST}/api/auth/login`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${inputToken}`
      }
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.message || "Login fallido");

    token = inputToken;
    localStorage.setItem("authToken", token);
    loginBtn.classList.add("d-none");
    logoutBtn.classList.remove("d-none");
    bootstrap.Modal.getInstance(document.getElementById("loginModal")).hide();
  } catch (err) {
    showError("Error al iniciar sesión: " + err.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await fetch(`${HOST}/api/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (err) {
    console.warn("Error al cerrar sesión:", err.message);
  }

  localStorage.removeItem("authToken");
  token = "";
  loginBtn.classList.remove("d-none");
  logoutBtn.classList.add("d-none");
});

scanBtn.addEventListener("click", () => {
  scanBtn.classList.add("active");
  historyBtn.classList.remove("active");
  scanSection.classList.remove("hidden");
  historySection.classList.add("hidden");
});

historyBtn.addEventListener("click", async () => {
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
        Authorization: `Bearer ${token}`
      }
    });

    const json = await res.json();
    renderHistory(json.data || []);
  } catch (err) {
    showError("Error al cargar historial: " + err.message);
  }
});

document.getElementById("uploadBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  const token = tokenInput.value.trim();

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
        Authorization: `Bearer ${token}`
      },
      body: formData
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
    document.getElementById("loading").classList.add("hidden");
  }
});

function renderHistory(invoices) {
  const tbody = document.getElementById("historyTable");
  tbody.innerHTML = "";

  invoices.forEach(inv => {
    const attachmentUrl = inv.attachments?.[0]?.url || null;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${inv.provider}</td>
      <td>${formatDate(inv.issueDate)}</td>
      <td>${inv.items?.length || 0}</td>
      <td>
        ${attachmentUrl
          ? `<button class="btn btn-sm btn-primary" onclick="showInvoice('${attachmentUrl}')">Ver</button>`
          : "—"}
      </td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteInvoice('${inv.id}')">Eliminar</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function showInvoice(url) {
  const img = document.getElementById("invoiceImage");
  img.src = url;

  const modal = new bootstrap.Modal(document.getElementById("invoiceModal"));
  modal.show();
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("es-CR");
}

async function deleteInvoice(id) {
  const token = tokenInput.value.trim();
  if (!token) return showError("Token requerido para eliminar");

  if (!confirm("¿Seguro que querés eliminar esta factura?")) return;

  try {
    const res = await fetch(`${HOST}/api/invoices/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("No se pudo eliminar");

    showError("Factura eliminada");
    historyBtn.click(); // Recarga historial
  } catch (err) {
    showError("Error al eliminar: " + err.message);
  }
}

function renderResults(data) {
  document.getElementById("provider").textContent = data.provider || "—";
  document.getElementById("issueDate").textContent = formatDate(data.issueDate);

  const tbody = document.getElementById("itemsTable");
  tbody.innerHTML = "";

  (data.items || []).forEach(item => {
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
  document.getElementById("errorMessage").textContent = msg;
  new bootstrap.Modal(document.getElementById("errorModal")).show();
}