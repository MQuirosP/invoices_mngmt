const tokenInput = document.getElementById("tokenInput");
const scanBtn = document.getElementById("scanBtn");
const historyBtn = document.getElementById("historyBtn");
const scanSection = document.getElementById("scanSection");
const historySection = document.getElementById("historySection");

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

  const token = tokenInput.value.trim();
  if (!token) return alert("Proporciona el token");

  try {
    const res = await fetch("http://localhost:3000/api/invoices", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const json = await res.json();
    renderHistory(json.data || []);
  } catch (err) {
    alert("Error al cargar historial: " + err.message);
  }
});

document.getElementById("uploadBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  const token = tokenInput.value.trim();

  if (!file || !token) {
    alert("Selecciona una imagen y proporciona el token");
    return;
  }

  document.getElementById("loading").classList.remove("hidden");
  document.getElementById("results").classList.add("hidden");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("http://localhost:3000/api/invoices/ocrscan", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const json = await res.json();
    const invoice = json.data;

    if (!invoice || !invoice.items) {
      alert("No se pudo extraer la factura");
      return;
    }

    renderResults(invoice);
  } catch (err) {
    alert("Error al procesar la imagen: " + err.message);
  } finally {
    document.getElementById("loading").classList.add("hidden");
  }
});

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

function renderHistory(invoices) {
  const tbody = document.getElementById("historyTable");
  tbody.innerHTML = "";

  invoices.forEach(inv => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${inv.provider}</td>
      <td>${formatDate(inv.issueDate)}</td>
      <td>${inv.items?.length || 0}</td>
      <td>${inv.attachments?.[0]?.url
        ? `<a href="${inv.attachments[0].url}" target="_blank">Ver</a>`
        : "—"}</td>
      <td><button onclick="deleteInvoice('${inv.id}')">Eliminar</button></td>
    `;
    tbody.appendChild(row);
  });
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("es-CR");
}

async function deleteInvoice(id) {
  const token = tokenInput.value.trim();
  if (!token) return alert("Token requerido para eliminar");

  if (!confirm("¿Seguro que querés eliminar esta factura?")) return;

  try {
    const res = await fetch(`http://localhost:3000/api/invoices/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("No se pudo eliminar");

    alert("Factura eliminada");
    historyBtn.click(); // Recarga historial
  } catch (err) {
    alert("Error al eliminar: " + err.message);
  }
}