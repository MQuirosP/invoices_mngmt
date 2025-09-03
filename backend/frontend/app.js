const tokenInput = document.getElementById("tokenInput");
const scanBtn = document.getElementById("scanBtn");
const historyBtn = document.getElementById("historyBtn");
const scanSection = document.getElementById("scanSection");
const historySection = document.getElementById("historySection");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const confirmLoginBtn = document.getElementById("confirmLoginBtn");

const fileInput = document.getElementById("fileInput");
const fileChipContainer = document.getElementById("fileChipContainer");

const fileBuffer = new DataTransfer();

const toggleBtn = document.getElementById("toggleAsideBtn");
const mobileAside = document.getElementById("mobileAside");

const clearFileBtn = document.getElementById("clearFileBtn");
if (clearFileBtn) {
  clearFileBtn.classList.add("d-none");
}

// 🧹 Elimina archivo del buffer
fileChipContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-close")) {
    const nameToRemove = e.target.parentElement.textContent.trim();
    removeFileFromBuffer(nameToRemove);
  }
});

dropZone.addEventListener("click", (e) => {
  e.stopPropagation();
  fileInput.click();
});

// 🪄 Drag & Drop
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");

  const files = Array.from(e.dataTransfer.files);
  addFilesToBuffer(files);

  fileInput.files = fileBuffer.files;
  renderFileChips();
});

let pendingDeleteId = null;

const HOST = "https://invoices-mngmt.onrender.com";
// const HOST = "http://localhost:3000";
let token = localStorage.getItem("authToken") || "";

// ==== Helpers de red y errores (centrales) ====
function onUnauthorized() {
  // Limpia sesión y UI si el token expiró o es inválido
  localStorage.removeItem("authToken");
  localStorage.removeItem("userFullname");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  token = "";
  showError("Tu sesión ha expirado. Por favor, iniciá sesión de nuevo.");
  updateUIBasedOnAuth();
}

function buildHeaders(options = {}) {
  const headers = new Headers(options.headers || {});
  const hasBodyFormData = options.body instanceof FormData;

  // Auth
  const currentToken = localStorage.getItem("authToken") || "";
  if (currentToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${currentToken}`);
  }

  // Content-Type solo si NO es FormData
  if (
    !hasBodyFormData &&
    !headers.has("Content-Type") &&
    options.method !== "GET"
  ) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

async function handleResponse(res) {
  if (res.status === 401 || res.status === 403) {
    onUnauthorized();
    throw new Error("No autorizado (token inválido o expirado)");
  }
  if (!res.ok) {
    // Intentamos leer mensaje del backend
    let serverMsg = "";
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json();
        serverMsg = data?.message || data?.error || JSON.stringify(data);
        // Sugerencia específica si viene un código Prisma P2003
        if (data?.code === "P2003") {
          serverMsg =
            "No se puede eliminar la factura porque tiene garantías relacionadas.";
        }
      } else {
        serverMsg = await res.text();
      }
    } catch {
      // ignorar parsing errors
    }
    const friendly = serverMsg || res.statusText || "Error desconocido";
    throw new Error(`HTTP ${res.status}: ${friendly}`);
  }
}

async function apiFetchJSON(url, options = {}) {
  const res = await fetch(url, { ...options, headers: buildHeaders(options) });
  await handleResponse(res);

  const ct = res.headers.get("content-type") || "";
  if (!ct || res.status === 204) return {};
  if (ct.includes("application/json")) return await res.json();

  // Fallback: texto crudo (poco común para JSON endpoints)
  const raw = await res.text();
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

async function apiFetchBlob(url, options = {}) {
  const res = await fetch(url, { ...options, headers: buildHeaders(options) });
  await handleResponse(res);
  return await res.blob();
}

if (token) {
  loginBtn.classList.add("d-none");
  logoutBtn.classList.remove("d-none");
}

loginBtn.addEventListener("click", () => {
  openModal("loginModal");
});

logoutBtn.addEventListener("click", async () => {
  try {
    await apiFetchJSON(`${HOST}/api/auth/logout`, { method: "POST" });
  } catch (err) {
    showError(
      "No se pudo cerrar sesión en el servidor, pero tu sesión local fue cerrada."
    );
  }

  // Limpiar estado visual
  document.getElementById("userGreeting").classList.add("d-none");
  document.getElementById("historySection").classList.add("hidden");
  document.getElementById("scanSection").classList.add("hidden");
  document.getElementById("welcomeSection").classList.remove("hidden");
  const itemsList = document.getElementById("itemsList");
  if (itemsList) itemsList.innerHTML = "";
  document.getElementById("results").classList.add("hidden");

  // Limpiar sesión local
  localStorage.removeItem("authToken");
  token = "";

  updateUIBasedOnAuth();
  showSuccess("Sesión cerrada.");
});

scanBtn.addEventListener("click", () => {
  localStorage.setItem("activeView", "scan");
  scanBtn.classList.add("active");
  historyBtn.classList.remove("active");
  scanSection.classList.remove("hidden");
  historySection.classList.add("hidden");
  document.getElementById("results").classList.add("hidden");
  // document.getElementById("provider").textContent = "";
  // document.getElementById("issueDate").textContent = "";
  const itemsList = document.getElementById("itemsList");
  if (itemsList) itemsList.innerHTML = "";
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
    const json = await apiFetchJSON(`${HOST}/api/invoices`, { method: "GET" });
    document.getElementById("results").classList.add("hidden");
    const itemsList = document.getElementById("itemsList");
    if (itemsList) itemsList.innerHTML = "";
    document.getElementById("fileInput").value = "";
    document.getElementById("clearFileBtn")?.classList.add("d-none");

    const list = Array.isArray(json?.data) ? json.data : [];
    if (list.length === 0) {
      showError("No se encontraron facturas.");
    }
    renderHistory(list);
  } catch (err) {
    showError("Error al cargar historial: " + err.message);
  }
});

document.getElementById("uploadBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("fileInput");
  const files = fileInput.files;
  const token = localStorage.getItem("authToken") || "";

  if (!files || files.length === 0 || !token) {
    showError("No se ha cargado ningún archivo, por favor intentá de nuevo.");
    return;
  }

  document.getElementById("loading").classList.remove("hidden");
  document.getElementById("results").classList.add("hidden");

  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append("files", file);
  });

  try {
    const json = await apiFetchJSON(`${HOST}/api/invoices/ocrscan`, {
      method: "POST",
      body: formData, // Content-Type lo maneja buildHeaders (no se fuerza para FormData)
    });

    const invoices = Array.isArray(json?.data) ? json.data : [];

    if (invoices.length === 0) {
      showError("No se pudo extraer ninguna factura");
      return;
    }

    renderInvoiceSummaries(invoices);
  } catch (err) {
    showError("Error al procesar la imagen: " + err.message);
  } finally {
    fileInput.value = "";
    fileBuffer.items.clear();
    fileInput.files = fileBuffer.files;
    renderFileChips();

    document.getElementById("clearFileBtn")?.classList.add("d-none");
    document.getElementById("loading").classList.add("hidden");
  }
});

function renderInvoiceSummaries(invoices) {
  const container = document.getElementById("results");
  container.innerHTML = ""; // limpiar contenido anterior

  invoices.forEach((invoice, index) => {
    const summary = document.createElement("div");
    summary.className = "invoice-summary mb-3";

    summary.innerHTML = `
      <h5>Factura #${index + 1}</h5>
      <p><strong>Proveedor:</strong> ${invoice.provider || "—"}</p>
      <p><strong>Fecha de emisión:</strong> ${formatDate(invoice.issueDate)}</p>
      <button class="btn btn-sm btn-primary view-details-btn">Ver detalles</button>
    `;

    container.appendChild(summary);

    // Asociar click al botón para abrir el modal genérico
    summary.querySelector(".view-details-btn").addEventListener("click", () => {
      showInvoiceDetails(invoice);
    });
  });

  container.classList.remove("hidden");
}

function renderHistory(invoices) {
  const container = document.getElementById("historyCards");
  container.innerHTML = "";

  invoices.forEach((inv) => {
    const card = document.createElement("div");
    card.className = "card shadow-sm";

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
            inv.attachments?.[0]?.id
              ? `<i class="fas fa-image text-secondary" role="button" title="Ver imagen"
       onclick="openProtectedImage('${inv.id}', '${inv.attachments[0].id}')"></i>`
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

function openModal(id, options = {}) {
  const modalEl = document.getElementById(id);
  if (!modalEl) return;

  // Cierra todos los modales abiertos
  document.querySelectorAll(".modal.show").forEach((m) => {
    const inst = bootstrap.Modal.getInstance(m);
    if (inst) inst.hide();
  });

  // Actualizar mensaje si se pasa
  if (options.message) {
    const bodyEl = modalEl.querySelector(".modal-body, .modal-message");
    if (bodyEl) bodyEl.textContent = options.message;
  }

  // Abrir modal
  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  // Auto-hide opcional
  if (options.autoHide) {
    setTimeout(() => {
      const inst = bootstrap.Modal.getInstance(modalEl);
      inst && inst.hide();
    }, options.autoHide);
  }
}

// document
//   .querySelector(`[data-invoice-id="${invoice.id}"]`)
//   .addEventListener("click", () => {
//     // Antes: const modalInstance = new bootstrap.Modal(...)
//     openModal(`modal-${invoice.id}`);
//   });

function openProtectedImage(invoiceId, attachmentId) {
  // Cierra el modal de detalles antes de continuar
  const invoiceModal = bootstrap.Modal.getInstance(
    document.getElementById("invoiceModal")
  );
  if (invoiceModal) invoiceModal.hide();

  apiFetchBlob(`${HOST}/api/view-image/${invoiceId}`)
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      document.getElementById("modalImage").src = url;

      const downloadBtn = document.getElementById("downloadImageBtn");
      downloadBtn.onclick = () =>
        downloadProtectedImage(invoiceId, attachmentId);

      openModal("imageModal");
    })
    .catch((err) => {
      console.error("Error al abrir imagen:", err);
      showError("No se pudo abrir la imagen: " + err.message);
    });
}

function downloadProtectedImage(invoiceId, attachmentId) {
  apiFetchBlob(
    `${HOST}/api/invoices/${invoiceId}/attachments/${attachmentId}/download`
  )
    .then((blob) => {
      if (blob.size === 0) throw new Error("Archivo vacío");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `factura-${invoiceId}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch((err) => {
      console.error("Error al descargar imagen:", err);
      showError("No se pudo descargar la imagen: " + err.message);
    });
}

const icon = document.querySelector("#downloadImageBtn i");
icon.classList.remove("download-icon");
void icon.offsetWidth; // fuerza reflow
icon.classList.add("download-icon");

document.getElementById("shareImageBtn").addEventListener("click", () => {
  const img = document.getElementById("modalImage");
  if (!img.src) return;

  fetch(img.src)
    .then((res) => res.blob())
    .then((blob) => {
      const file = new File([blob], "factura.jpg", { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator
          .share({
            title: "Factura",
            text: "Compartiendo imagen de factura",
            files: [file],
          })
          .catch((err) => {
            console.error("Error al compartir:", err);
            showError("No se pudo compartir la imagen.");
          });
      } else {
        showError("Compartir no está disponible en este dispositivo.");
      }
    });
});

function showInvoiceDetails(invoice) {
  const modalDetails = document.getElementById("modalInvoiceDetails");
  const viewImageBtn = document.getElementById("viewImageBtn");

  modalDetails.innerHTML = `
  <p><strong>Proveedor:</strong> ${invoice.provider}</p>
  <p><strong>Fecha de emisión:</strong> ${formatDate(invoice.issueDate)}</p>

  <div class="invoice-items">
    ${invoice.items
      .map(
        (item) => `
      <div class="invoice-card">
        <div class="d-flex justify-content-between">
          <strong>${item.description}</strong>
          <span class="text-muted">${item.quantity} × ₡${item.unitPrice}</span>
        </div>
        <div class="d-flex justify-content-between mt-1">
          <span>Total:</span>
          <span class="fw-semibold text-dark">₡${item.total}</span>
        </div>
        ${
          item.warrantyNotes
            ? `<div class="mt-1"><span class="badge bg-info text-dark">${item.warrantyNotes}</span></div>`
            : ""
        }
      </div>
    `
      )
      .join("")}
  </div>
`;
  if (invoice.attachments?.[0]?.url) {
    viewImageBtn.classList.remove("d-none");
    viewImageBtn.onclick = () =>
      openProtectedImage(invoice.id, invoice.attachments[0].id);
  } else {
    viewImageBtn.classList.add("d-none");
  }

  openModal("invoiceModal");
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("es-CR");
}

function deleteInvoice(id) {
  const token = localStorage.getItem("authToken") || "";
  if (!token) return showError("Token requerido para eliminar");

  pendingDeleteId = id;
  openModal("confirmDeleteModal");
}

document
  .getElementById("confirmDeleteBtn")
  .addEventListener("click", async () => {
    if (!pendingDeleteId) return;

    const token = localStorage.getItem("authToken") || "";
    try {
      await apiFetchJSON(`${HOST}/api/invoices/${pendingDeleteId}`, {
        method: "DELETE",
      });

      showSuccess("Factura eliminada");
      pendingDeleteId = null;
      bootstrap.Modal.getInstance(
        document.getElementById("confirmDeleteModal")
      ).hide();
      historyBtn.click(); // Recarga historial
    } catch (err) {
      // Si el backend devolvió P2003 ya lo mapeamos en handleResponse, pero dejamos fallback:
      const msg = /P2003/.test(err.message)
        ? "No se puede eliminar: la factura tiene garantías relacionadas."
        : err.message;

      showError("Error al eliminar: " + msg);
    }
  });

function renderInvoiceItems(items) {
  return items
    .map(
      (item) => `
      <div class="invoice-card mb-2">
        <div class="d-flex justify-content-between">
          <strong>${item.description}</strong>
          <span class="text-muted">${item.quantity} × ₡${item.unitPrice}</span>
        </div>
        <div class="d-flex justify-content-between mt-1">
          <span>Total:</span>
          <span class="fw-semibold text-dark">₡${item.total}</span>
        </div>
        ${
          item.warrantyNotes
            ? `<div class="mt-1"><span class="badge bg-info text-dark">${item.warrantyNotes}</span></div>`
            : ""
        }
      </div>
    `
    )
    .join("");
}

function createInvoiceModal(invoice) {
  const modalId = `modal-${invoice.id}`;
  if (document.getElementById(modalId)) return; // evitar duplicados

  const modal = document.createElement("div");
  modal.id = modalId;
  modal.className = "modal fade";
  modal.tabIndex = -1;
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header bg-dark text-white">
          <h5 class="modal-title">${invoice.title || invoice.provider}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          ${renderInvoiceItems(invoice.items)}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Activar botón para abrir el modal
  document
    .querySelector(`[data-invoice-id="${invoice.id}"]`)
    .addEventListener("click", () => {
      const modalInstance = new bootstrap.Modal(
        document.getElementById(modalId)
      );
      modalInstance.show();
    });
}

function showError(msg) {
  console.error("[UI ERROR]", msg);
  openModal("errorModal", { message: msg, autoHide: 4000 });
}

document.getElementById("registerBtn").addEventListener("click", () => {
  openModal("registerModal");
});

document
  .getElementById("registerModal")
  .addEventListener("hidden.bs.modal", () => {
    document.getElementById("registerEmail").value = "";
    document.getElementById("registerFullname").value = "";
    document.getElementById("registerPassword").value = "";
    document.getElementById("registerConfirm").value = "";
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
      const json = await apiFetchJSON(`${HOST}/api/auth/register`, {
        method: "POST",
        body: JSON.stringify({ email, fullname, password }),
      });

      if (!json?.success) throw new Error(json?.message || "Registro fallido");

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
      const json = await apiFetchJSON(`${HOST}/api/auth/login`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const user = json?.data;
      if (!json?.success || !user?.token) {
        throw new Error(json?.message || "Login fallido");
      }

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

function showSuccess(msg) {
  console.info("[UI OK]", msg);
  openModal("successModal", { message: msg, autoHide: 3000 });
}

fileInput.addEventListener("change", () => {
  addFilesToBuffer(fileInput.files);
});

function renderFileChips() {
  // limpio solo chips, no borro el mensaje
  fileChipContainer
    .querySelectorAll(".file-chip")
    .forEach((chip) => chip.remove());

  const uploadMessage = document.getElementById("uploadMessage");

  if (fileBuffer.files.length === 0) {
    // mostrar mensaje de nuevo
    uploadMessage.classList.remove("d-none");
    return;
  }

  // ocultar mensaje si hay archivos
  uploadMessage.classList.add("d-none");

  Array.from(fileBuffer.files).forEach((file) => {
    const chip = document.createElement("div");
    chip.className =
      "file-chip fade-in d-inline-flex align-items-center me-2 mb-2";
    chip.dataset.filename = file.name;

    const nameSpan = document.createElement("span");
    nameSpan.className = "text-truncate";
    nameSpan.style.maxWidth = "220px";
    nameSpan.textContent = file.name;

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "btn-close";
    closeBtn.setAttribute("aria-label", "Eliminar");
    closeBtn.dataset.filename = file.name;

    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeFileFromBuffer(file.name);
    });

    chip.append(nameSpan, closeBtn);
    fileChipContainer.appendChild(chip);
  });
}

function addFilesToBuffer(files) {
  Array.from(files).forEach((file) => {
    if (![...fileBuffer.files].some((f) => f.name === file.name)) {
      fileBuffer.items.add(file);
    }
  });
  fileInput.files = fileBuffer.files;
  renderFileChips();
}

function removeFileFromBuffer(fileName) {
  const newBuffer = new DataTransfer();
  Array.from(fileBuffer.files).forEach((f) => {
    if (f.name !== fileName) newBuffer.items.add(f);
  });
  fileBuffer.items.clear();
  Array.from(newBuffer.files).forEach((f) => fileBuffer.items.add(f));
  fileInput.files = fileBuffer.files;
  renderFileChips();
}

function updateUIBasedOnAuth() {
  const isLoggedIn = !!localStorage.getItem("authToken");

  // Aside desktop y mobile
  const desktopAside = document.getElementById("desktopAside");

  if (desktopAside) desktopAside.classList.toggle("d-none", !isLoggedIn);
  if (mobileAside) mobileAside.classList.toggle("d-none", !isLoggedIn);
  if (toggleBtn) toggleBtn.classList.toggle("d-none", !isLoggedIn);

  // Navbar buttons
  const scanBtn = document.getElementById("scanBtn");
  const historyBtn = document.getElementById("historyBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginBtn = document.getElementById("loginBtn");
  const registerBtn = document.getElementById("registerBtn");

  if (scanBtn) scanBtn.classList.toggle("d-none", !isLoggedIn);
  if (historyBtn) historyBtn.classList.toggle("d-none", !isLoggedIn);
  if (logoutBtn) logoutBtn.classList.toggle("d-none", !isLoggedIn);
  if (loginBtn) loginBtn.classList.toggle("d-none", isLoggedIn);
  if (registerBtn) registerBtn.classList.toggle("d-none", isLoggedIn);

  // Secciones
  const welcomeSection = document.getElementById("welcomeSection");
  const scanSection = document.getElementById("scanSection");
  const historySection = document.getElementById("historySection");

  if (welcomeSection) welcomeSection.classList.toggle("hidden", isLoggedIn);
  if (scanSection) scanSection.classList.toggle("hidden", !isLoggedIn);
  if (historySection) historySection.classList.add("hidden");

  // Saludo
  const greeting = document.getElementById("userGreeting");
  const username = localStorage.getItem("userFullname");
  if (isLoggedIn && username) {
    greeting.textContent = `¡Hola!, ${capitalizeFirstLetter(
      username.split(" ")[0]
    )}`;
    greeting.classList.remove("d-none");
  } else if (greeting) greeting.classList.add("d-none");
}

function capitalizeFirstLetter(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

document.addEventListener("DOMContentLoaded", () => {
  updateUIBasedOnAuth();

  const isLoggedIn = !!localStorage.getItem("authToken");
  const activeView = localStorage.getItem("activeView");

  if (isLoggedIn && toggleBtn && mobileAside) {
    toggleBtn.addEventListener("click", () => {
      const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(mobileAside);
      bsOffcanvas.toggle();
      toggleBtn.classList.toggle("open");
    });
  }

  if (!isLoggedIn) return; // Evita mostrar secciones si no hay sesión

  if (activeView === "scan") scanBtn.click();
  else if (activeView === "history") historyBtn.click();
});
