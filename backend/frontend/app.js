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

const clearFileBtn = document.getElementById("clearFileBtn");
if (clearFileBtn) {
  clearFileBtn.classList.add("d-none");
}

// 🧹 Elimina archivo del buffer
fileChipContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-close")) {
    const nameToRemove = e.target.parentElement.textContent.trim();
    const newBuffer = new DataTransfer();

    [...fileBuffer.files].forEach((file) => {
      if (file.name !== nameToRemove) {
        newBuffer.items.add(file);
      }
    });

    fileBuffer.items.clear();
    [...newBuffer.files].forEach((f) => fileBuffer.items.add(f));
    fileInput.files = fileBuffer.files;
    renderFileChips();
  }
});

// 📂 Input manual
fileInput.addEventListener("change", () => {
  [...fileInput.files].forEach((file) => {
    if (![...fileBuffer.files].some((f) => f.name === file.name)) {
      fileBuffer.items.add(file);
    }
  });

  fileInput.files = fileBuffer.files;
  renderFileChips();
});

// 🖱️ Botón para abrir input
// selectFileBtn.addEventListener("click", (e) => {
//   e.stopPropagation();
//   fileInput.click();
// });

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
  files.forEach((file) => {
    if (![...fileBuffer.files].some((f) => f.name === file.name)) {
      fileBuffer.items.add(file);
    }
  });

  fileInput.files = fileBuffer.files;
  renderFileChips();
});

let pendingDeleteId = null;

// const HOST = "https://invoices-mngmt.onrender.com";
const HOST = "http://localhost:3000";
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
  const itemsList = document.getElementById("itemsList");
  if (itemsList) itemsList.innerHTML = "";
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
    const res = await fetch(`${HOST}/api/invoices`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    document.getElementById("results").classList.add("hidden");
    document.getElementById("provider").textContent = "";
    document.getElementById("issueDate").textContent = "";
    const itemsList = document.getElementById("itemsList");
    if (itemsList) itemsList.innerHTML = "";
    document.getElementById("fileInput").value = "";
    document.getElementById("clearFileBtn")?.classList.add("d-none");

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
    showError("No se ha cargado ningún archivo, por favor intentá de nuevo.");
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
    fileInput.value = "";
    fileBuffer.items.clear();
    fileInput.files = fileBuffer.files;
    renderFileChips();

    document.getElementById("clearFileBtn")?.classList.add("d-none");
    document.getElementById("loading").classList.add("hidden");
  }
});

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

function openProtectedImage(invoiceId, attachmentId) {
  // Cierra el modal de detalles antes de continuar
  const invoiceModal = bootstrap.Modal.getInstance(
    document.getElementById("invoiceModal")
  );
  if (invoiceModal) invoiceModal.hide();

  fetch(`${HOST}/api/view-image/${invoiceId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error("No se pudo cargar la imagen");
      return res.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      document.getElementById("modalImage").src = url;

      const downloadBtn = document.getElementById("downloadImageBtn");
      downloadBtn.onclick = () =>
        downloadProtectedImage(invoiceId, attachmentId);

      const modal = new bootstrap.Modal(document.getElementById("imageModal"));
      modal.show();
    })
    .catch((err) => {
      console.error("Error al abrir imagen:", err);
      showError("No se pudo abrir la imagen.");
    });
}

function downloadProtectedImage(invoiceId, attachmentId) {
  fetch(
    `${HOST}/api/invoices/${invoiceId}/attachments/${attachmentId}/download`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
    .then((res) => {
      if (!res.ok) throw new Error("No se pudo descargar la imagen");
      return res.blob();
    })
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
      showError("No se pudo descargar la imagen.");
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

  const itemsList = document.getElementById("itemsList");
  itemsList.innerHTML = "";

  (data.items || []).forEach((item) => {
    const card = document.createElement("div");
    card.className = "invoice-card fade-in";

    card.innerHTML = `
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
    `;

    itemsList.appendChild(card);
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
  const itemsList = document.getElementById("itemsList");
  if (itemsList) itemsList.innerHTML = "";

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
  Array.from(fileInput.files).forEach((file) => {
    // Evitar duplicados por nombre
    if (![...fileBuffer.files].some((f) => f.name === file.name)) {
      fileBuffer.items.add(file);
    }
  });

  fileInput.files = fileBuffer.files;
  renderFileChips();
});


function renderFileChips() {
  fileChipContainer.innerHTML = "";

  if (fileBuffer.files.length === 0) {
    const placeholder = document.createElement("div");
    placeholder.className = "upload-placeholder text-center w-100 fade-in";
    placeholder.innerHTML = `
      <div class="d-flex flex-column align-items-center justify-content-center w-100 py-3 px-4">
        <i class="fas fa-cloud-upload-alt fa-2x text-primary mb-2"></i>
        <strong class="text-primary">Arrastrá tus archivos aquí</strong>
        <span class="text-muted small">o hacé clic para seleccionarlos</span>
      </div>
    `;
    placeholder.addEventListener("click", (e) => {
      e.stopPropagation();
      fileInput.click();
    });
    fileChipContainer.appendChild(placeholder);
    return;
  }

  Array.from(fileBuffer.files).forEach((file) => {
    const chip = document.createElement("span");
    chip.className = "file-chip fade-in";
    chip.style.padding = "0.5rem 0.75rem";

    chip.innerHTML = `
      <span>${file.name}</span>
      <button type="button" class="btn-close ms-2" aria-label="Eliminar"></button>
    `;

    chip.querySelector("button").addEventListener("click", (e) => {
      e.stopPropagation();
      const newBuffer = new DataTransfer();

      Array.from(fileBuffer.files).forEach((f) => {
        if (f.name !== file.name) {
          newBuffer.items.add(f);
        }
      });

      fileBuffer.items.clear();
      Array.from(newBuffer.files).forEach((f) => fileBuffer.items.add(f));
      renderFileChips();
    });

    fileChipContainer.appendChild(chip);
  });
}

function updateUIBasedOnAuth() {
  const isLoggedIn = !!localStorage.getItem("authToken");

  // Secciones
  document
    .getElementById("welcomeSection")
    .classList.toggle("hidden", isLoggedIn);
  document
    .getElementById("scanSection")
    .classList.toggle("hidden", !isLoggedIn);
  document.getElementById("historySection").classList.add("hidden");

  // Navbar buttons
  document.getElementById("scanBtn").classList.toggle("d-none", !isLoggedIn);
  document.getElementById("historyBtn").classList.toggle("d-none", !isLoggedIn);
  document.getElementById("logoutBtn").classList.toggle("d-none", !isLoggedIn);
  document.getElementById("loginBtn").classList.toggle("d-none", isLoggedIn);
  document.getElementById("registerBtn").classList.toggle("d-none", isLoggedIn);

  // Saludo opcional
  const greeting = document.getElementById("userGreeting");
  const username = localStorage.getItem("userFullname"); // si lo guardás en login
  if (isLoggedIn && username) {
    const firstName = username?.split(" ")[0];
    greeting.textContent = `¡Hola!, ${capitalizeFirstLetter(firstName)}`;
    greeting.classList.remove("d-none");
  } else {
    greeting.classList.add("d-none");
  }
}

function capitalizeFirstLetter(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

document.addEventListener("DOMContentLoaded", () => {
  updateUIBasedOnAuth();

  const isLoggedIn = !!localStorage.getItem("authToken");
  const activeView = localStorage.getItem("activeView");

  if (!isLoggedIn) return; // Evita mostrar secciones si no hay sesión

  if (activeView === "scan") scanBtn.click();
  else if (activeView === "history") historyBtn.click();
});
