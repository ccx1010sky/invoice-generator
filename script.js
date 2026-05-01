const form = document.querySelector("#invoiceForm");
const preview = document.querySelector("#invoicePreview");
const previewTotal = document.querySelector("#previewTotal");
const statusEl = document.querySelector("#status");
const actionStatusEl = document.querySelector("#actionStatus");
const itemsEl = document.querySelector("#items");
const itemTemplate = document.querySelector("#itemTemplate");
const addItemButton = document.querySelector("#addItemButton");
const pdfButton = document.querySelector("#pdfButton");
const saveButton = document.querySelector("#saveButton");
const sampleButton = document.querySelector("#sampleButton");
const installButton = document.querySelector("#installButton");
const appModeStatus = document.querySelector("#appModeStatus");
const editPageButton = document.querySelector("#editPageButton");
const previewPageButton = document.querySelector("#previewPageButton");
const editPage = document.querySelector("#editPage");
const previewPage = document.querySelector("#previewPage");
const goPreviewButton = document.querySelector("#goPreviewButton");

const fields = [
  "companyName",
  "vatNumber",
  "companyNumber",
  "companyEmail",
  "companyAddress",
  "clientName",
  "clientVat",
  "clientAddress",
  "invoiceNumber",
  "issueDate",
  "dueDate",
  "vatRate",
  "currency",
  "paymentTerms",
  "invoiceTemplate",
  "bankDetails",
  "notes",
];

let installPromptEvent = null;

function updateAppModeStatus() {
  const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  appModeStatus.textContent = standalone
    ? "Installed app mode · private local storage"
    : "Private local storage · installable on supported phones";
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPromptEvent = event;
  installButton.hidden = false;
  setStatus("This web app can be installed on this device.");
});

installButton.addEventListener("click", async () => {
  if (!installPromptEvent) {
    setStatus("Use your browser menu to add this app to the home screen.");
    return;
  }
  installPromptEvent.prompt();
  const choice = await installPromptEvent.userChoice;
  installPromptEvent = null;
  installButton.hidden = true;
  setStatus(choice.outcome === "accepted" ? "App install started." : "Install dismissed.");
});

window.addEventListener("appinstalled", () => {
  installPromptEvent = null;
  installButton.hidden = true;
  updateAppModeStatus();
  setStatus("App installed successfully.");
});

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then(() => updateAppModeStatus())
      .catch(() => {
        appModeStatus.textContent = "Online mode · service worker unavailable";
      });
  });
} else {
  updateAppModeStatus();
}



function showPage(pageName) {
  const showingPreview = pageName === "preview";
  editPage.classList.toggle("active", !showingPreview);
  previewPage.classList.toggle("active", showingPreview);
  editPageButton.classList.toggle("active", !showingPreview);
  previewPageButton.classList.toggle("active", showingPreview);
  if (showingPreview) {
    editPageButton.removeAttribute("aria-current");
    previewPageButton.setAttribute("aria-current", "page");
  } else {
    editPageButton.setAttribute("aria-current", "page");
    previewPageButton.removeAttribute("aria-current");
  }
  if (showingPreview) {
    renderPreview();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const sampleItems = [
  { description: "MTD bookkeeping setup and VAT return preparation", qty: 1, price: 650 },
  { description: "Quarterly cloud accounting support", qty: 3, price: 120 },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(`${value}T00:00:00`)
  );
}

function money(value, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(value || 0);
}

function plainMoney(value, currency = "GBP") {
  return `${currency} ${(value || 0).toFixed(2)}`;
}

function getValue(id) {
  return document.querySelector(`#${id}`).value.trim();
}

function invoiceData() {
  const items = [...itemsEl.querySelectorAll(".item-row")].map((row) => {
    const description = row.querySelector(".item-description").value.trim();
    const qty = Number(row.querySelector(".item-qty").value || 0);
    const price = Number(row.querySelector(".item-price").value || 0);
    return {
      description,
      qty,
      price,
      net: qty * price,
    };
  });

  const data = Object.fromEntries(fields.map((id) => [id, getValue(id)]));
  data.vatRate = Number(data.vatRate);
  data.items = items;
  data.subtotal = items.reduce((sum, item) => sum + item.net, 0);
  data.vat = data.subtotal * (data.vatRate / 100);
  data.total = data.subtotal + data.vat;
  return data;
}

function lineBreaks(text) {
  return escapeHtml(text).replace(/\n/g, "<br />");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPreview() {
  const data = invoiceData();
  if (previewTotal) {
    previewTotal.textContent = plainMoney(data.total, data.currency);
  }
  preview.className = `invoice-preview ${data.invoiceTemplate || "professional"}`;
  preview.innerHTML = `
    <header class="invoice-head">
      <div>
        <span class="badge">VAT Invoice</span>
        <h3>${escapeHtml(data.invoiceNumber || "Draft Invoice")}</h3>
        <p>${escapeHtml(data.companyName)}</p>
      </div>
    </header>

    <section class="meta-grid">
      <div class="meta-card"><h4>Issue Date</h4><strong>${formatDate(data.issueDate)}</strong></div>
      <div class="meta-card"><h4>Due Date</h4><strong>${formatDate(data.dueDate)}</strong></div>
      <div class="meta-card"><h4>VAT Rate</h4><strong>${data.vatRate}%</strong></div>
    </section>

    <section class="address-grid">
      <div class="address-box">
        <h4>Supplier</h4>
        <strong>${escapeHtml(data.companyName)}</strong>
        <p>${lineBreaks(data.companyAddress)}</p>
        <p>VAT No: ${escapeHtml(data.vatNumber)}<br />Company No: ${escapeHtml(data.companyNumber)}<br />${escapeHtml(data.companyEmail)}</p>
      </div>
      <div class="address-box">
        <h4>Bill To</h4>
        <strong>${escapeHtml(data.clientName)}</strong>
        <p>${lineBreaks(data.clientAddress)}</p>
        <p>${data.clientVat ? `Client VAT No: ${escapeHtml(data.clientVat)}` : ""}</p>
      </div>
    </section>

    <table class="invoice-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="number">Qty</th>
          <th class="number">Unit</th>
          <th class="number">Net</th>
        </tr>
      </thead>
      <tbody>
        ${data.items
          .map(
            (item) => `
            <tr>
              <td>${escapeHtml(item.description)}</td>
              <td class="number">${item.qty}</td>
              <td class="number">${money(item.price, data.currency)}</td>
              <td class="number">${money(item.net, data.currency)}</td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <section class="totals">
      <div class="total-line"><span>Net amount</span><strong>${money(data.subtotal, data.currency)}</strong></div>
      <div class="total-line"><span>VAT @ ${data.vatRate}%</span><strong>${money(data.vat, data.currency)}</strong></div>
      <div class="total-line grand-total"><span>Total due</span><strong>${money(data.total, data.currency)}</strong></div>
    </section>

    <section class="footnotes">
      <p><strong>Payment:</strong><br />${lineBreaks(data.bankDetails)}</p>
      <p><strong>Terms:</strong> ${escapeHtml(data.paymentTerms)}</p>
      <p>${lineBreaks(data.notes)}</p>
      <p>HMRC VAT invoice fields included: supplier, customer, invoice number, tax point, VAT registration number, net value, VAT rate, VAT amount, and gross total.</p>
    </section>
  `;
}

function addItem(item = { description: "", qty: 1, price: 0 }) {
  const row = itemTemplate.content.firstElementChild.cloneNode(true);
  row.querySelector(".item-description").value = item.description;
  row.querySelector(".item-qty").value = item.qty;
  row.querySelector(".item-price").value = item.price;
  row.querySelector(".remove-item").addEventListener("click", () => {
    if (itemsEl.children.length > 1) {
      row.remove();
      renderPreview();
    }
  });
  row.addEventListener("input", renderPreview);
  itemsEl.append(row);
}

function validateInvoice(data) {
  const missing = [];
  [
    ["Business name", data.companyName],
    ["VAT registration number", data.vatNumber],
    ["Company address", data.companyAddress],
    ["Client name", data.clientName],
    ["Client address", data.clientAddress],
    ["Invoice number", data.invoiceNumber],
    ["Issue date", data.issueDate],
    ["Due date", data.dueDate],
  ].forEach(([label, value]) => {
    if (!value) missing.push(label);
  });

  if (!data.items.length || data.items.some((item) => !item.description || item.qty <= 0 || item.price < 0)) {
    missing.push("valid line items");
  }

  if (missing.length) {
    return `Please add ${missing.join(", ")}.`;
  }

  if (new Date(data.dueDate) < new Date(data.issueDate)) {
    return "Due date must be after the issue date.";
  }

  return "";
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
  actionStatusEl.textContent = message || "Ready";
  actionStatusEl.classList.toggle("error", isError);
}

function flashButton(button, label) {
  const original = button.textContent;
  button.textContent = label;
  button.classList.add("success");
  window.setTimeout(() => {
    button.textContent = original;
    button.classList.remove("success");
  }, 1400);
}

function saveDraft() {
  try {
    const data = invoiceData();
    data.savedAt = new Date().toISOString();
    localStorage.setItem("mtdInvoiceDraft", JSON.stringify(data));
    setStatus("Draft saved locally in this browser.");
    flashButton(saveButton, "Saved");
  } catch (error) {
    setStatus("Draft could not be saved in this browser.", true);
  }
}

function loadDraft() {
  const raw = localStorage.getItem("mtdInvoiceDraft");
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    fields.forEach((id) => {
      if (data[id] !== undefined) document.querySelector(`#${id}`).value = data[id];
    });
    itemsEl.innerHTML = "";
    (data.items || sampleItems).forEach(addItem);
    return true;
  } catch {
    return false;
  }
}

function loadSample() {
  document.querySelector("#companyName").value = "Northstar Digital Ltd";
  document.querySelector("#vatNumber").value = "GB123456789";
  document.querySelector("#companyNumber").value = "12345678";
  document.querySelector("#companyEmail").value = "accounts@northstar.example";
  document.querySelector("#companyAddress").value = "22 Market Street\nLeeds\nLS1 4AB\nUnited Kingdom";
  document.querySelector("#clientName").value = "Acme Studio Ltd";
  document.querySelector("#clientVat").value = "GB987654321";
  document.querySelector("#clientAddress").value = "11 Creative Yard\nManchester\nM1 2CD\nUnited Kingdom";
  document.querySelector("#invoiceNumber").value = "INV-2026-001";
  document.querySelector("#issueDate").value = todayIso();
  document.querySelector("#dueDate").value = addDaysIso(14);
  document.querySelector("#vatRate").value = "20";
  document.querySelector("#currency").value = "GBP";
  document.querySelector("#paymentTerms").value = "Payment due within 14 days";
  document.querySelector("#invoiceTemplate").value = "professional";
  document.querySelector("#bankDetails").value =
    "Account name: Northstar Digital Ltd\nSort code: 20-00-00\nAccount number: 12345678";
  document.querySelector("#notes").value =
    "VAT invoice. Tax point is the invoice issue date. This digital record is prepared for Making Tax Digital record keeping.";
  itemsEl.innerHTML = "";
  sampleItems.forEach(addItem);
  renderPreview();
  setStatus("Sample invoice loaded.");
  flashButton(sampleButton, "Loaded");
}

function escapePdfText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E\n]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapText(text, maxChars) {
  const output = [];
  String(text || "")
    .split("\n")
    .forEach((line) => {
      const words = line.split(/\s+/).filter(Boolean);
      let current = "";
      words.forEach((word) => {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length > maxChars && current) {
          output.push(current);
          current = word;
        } else {
          current = candidate;
        }
      });
      output.push(current);
    });
  return output.filter((line) => line.length);
}

function pdfText(x, y, text, size = 10, font = "F1") {
  return `BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET\n`;
}

function pdfLine(x1, y1, x2, y2) {
  return `${x1} ${y1} m ${x2} ${y2} l S\n`;
}

function pdfRect(x, y, width, height, fill = false) {
  return `${x} ${y} ${width} ${height} re ${fill ? "f" : "S"}\n`;
}

function makePdf(data) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  let content = "0.08 w\n";

  content += "0.06 0.13 0.15 rg\n";
  content += pdfText(42, 790, "VAT INVOICE", 24, "F2");
  content += pdfText(42, 767, data.companyName, 11);
  content += "0.06 0.46 0.43 RG\n";
  content += pdfLine(42, 748, 553, 748);

  content += "0 0 0 rg\n";
  content += pdfText(390, 792, `Invoice: ${data.invoiceNumber}`, 11, "F2");
  content += pdfText(390, 776, `Issue date: ${formatDate(data.issueDate)}`, 9);
  content += pdfText(390, 762, `Tax point: ${formatDate(data.issueDate)}`, 9);
  content += pdfText(390, 748, `Due date: ${formatDate(data.dueDate)}`, 9);

  content += pdfText(42, 716, "Supplier", 11, "F2");
  let y = 700;
  [data.companyName, ...data.companyAddress.split("\n"), `VAT No: ${data.vatNumber}`, `Company No: ${data.companyNumber}`, data.companyEmail]
    .filter(Boolean)
    .forEach((line) => {
      content += pdfText(42, y, line, 9);
      y -= 13;
    });

  content += pdfText(318, 716, "Bill To", 11, "F2");
  y = 700;
  [data.clientName, ...data.clientAddress.split("\n"), data.clientVat ? `Client VAT No: ${data.clientVat}` : ""]
    .filter(Boolean)
    .forEach((line) => {
      content += pdfText(318, y, line, 9);
      y -= 13;
    });

  const tableTop = 580;
  content += "0.93 0.96 0.96 rg\n";
  content += pdfRect(42, tableTop, 511, 24, true);
  content += "0 0 0 rg\n";
  content += pdfText(50, tableTop + 8, "Description", 9, "F2");
  content += pdfText(360, tableTop + 8, "Qty", 9, "F2");
  content += pdfText(410, tableTop + 8, "Unit", 9, "F2");
  content += pdfText(496, tableTop + 8, "Net", 9, "F2");
  content += pdfLine(42, tableTop, 553, tableTop);

  y = tableTop - 22;
  data.items.forEach((item) => {
    const lines = wrapText(item.description, 48);
    content += pdfText(50, y, lines[0] || "", 9);
    content += pdfText(363, y, String(item.qty), 9);
    content += pdfText(405, y, plainMoney(item.price, data.currency), 9);
    content += pdfText(482, y, plainMoney(item.net, data.currency), 9);
    y -= 13;
    lines.slice(1).forEach((line) => {
      content += pdfText(50, y, line, 9);
      y -= 13;
    });
    content += pdfLine(42, y + 5, 553, y + 5);
    y -= 10;
  });

  y = Math.min(y - 8, 390);
  const totalsX = 350;
  content += pdfText(totalsX, y, "Net amount", 10);
  content += pdfText(468, y, plainMoney(data.subtotal, data.currency), 10, "F2");
  y -= 18;
  content += pdfText(totalsX, y, `VAT @ ${data.vatRate}%`, 10);
  content += pdfText(468, y, plainMoney(data.vat, data.currency), 10, "F2");
  y -= 22;
  content += "0.06 0.46 0.43 rg\n";
  content += pdfText(totalsX, y, "Total due", 14, "F2");
  content += pdfText(456, y, plainMoney(data.total, data.currency), 14, "F2");
  content += "0 0 0 rg\n";

  y -= 44;
  content += pdfText(42, y, "Payment", 10, "F2");
  y -= 14;
  wrapText(data.bankDetails, 84).forEach((line) => {
    content += pdfText(42, y, line, 8);
    y -= 11;
  });
  y -= 8;
  content += pdfText(42, y, "Terms and VAT wording", 10, "F2");
  y -= 14;
  wrapText(`${data.paymentTerms}. ${data.notes}`, 95).forEach((line) => {
    content += pdfText(42, y, line, 8);
    y -= 11;
  });
  y -= 8;
  wrapText(
    "HMRC VAT invoice fields included: supplier, customer, invoice number, tax point, VAT registration number, net value, VAT rate, VAT amount, and gross total.",
    95
  ).forEach((line) => {
    content += pdfText(42, y, line, 8);
    y -= 11;
  });

  const streamLength = content.length;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${streamLength} >>\nstream\n${content}endstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

function exportPdf() {
  const data = invoiceData();
  const error = validateInvoice(data);
  if (error) {
    setStatus(error, true);
    return;
  }

  try {
    pdfButton.disabled = true;
    pdfButton.textContent = "Preparing...";
    const pdf = makePdf(data);
    const blob = new Blob([pdf], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${data.invoiceNumber || "invoice"}.pdf`;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.append(link);
    link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    setStatus(`PDF exported: ${link.download}`);
    window.setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 1000);
    pdfButton.textContent = "Exported";
    pdfButton.classList.add("success");
    window.setTimeout(() => {
      pdfButton.textContent = "Export PDF";
      pdfButton.classList.remove("success");
    }, 1400);
  } catch (error) {
    setStatus("PDF export failed. Please check the invoice fields and try again.", true);
  } finally {
    window.setTimeout(() => {
      pdfButton.disabled = false;
      if (pdfButton.textContent === "Preparing...") {
        pdfButton.textContent = "Export PDF";
      }
    }, 250);
  }
}

form.addEventListener("input", renderPreview);
form.addEventListener("change", renderPreview);
addItemButton.addEventListener("click", () => {
  addItem({ description: "New service", qty: 1, price: 0 });
  renderPreview();
});
pdfButton.addEventListener("click", exportPdf);
saveButton.addEventListener("click", saveDraft);
sampleButton.addEventListener("click", loadSample);
editPageButton.addEventListener("click", () => showPage("edit"));
previewPageButton.addEventListener("click", () => showPage("preview"));
goPreviewButton.addEventListener("click", () => showPage("preview"));
document.querySelector("#issueDate").value = todayIso();
document.querySelector("#dueDate").value = addDaysIso(14);

if (!loadDraft()) {
  sampleItems.forEach(addItem);
}

renderPreview();
