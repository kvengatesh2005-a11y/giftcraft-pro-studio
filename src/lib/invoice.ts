import { Order } from "./types";

export function generateInvoiceHtml(order: Order): string {
  const storeName = "br_Treasure_Trove";
  const storeAddress = "No.20, 2nd Street, Vengadesapuram, Acharapakkam, Chengalpattu - 603301";
  const storeEmail = "brcreatives4@gmail.com";
  const storePhone = "+91 91765 01954";
  const storeWebsite = "br_Treasure_Trove";

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-IN");

  const invoiceNo = `INV-${order.id.slice(0, 8).toUpperCase()}`;
  const currency = order.currency || "₹";

  const itemsHtml = (order.items || [])
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
        <td style="padding: 6px 8px; vertical-align: middle;">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${
              item.images && item.images[0]
                ? `<img src="${item.images[0]}" alt="${item.name}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 5px; border: 1px solid #cbd5e1; flex-shrink: 0;" />`
                : ""
            }
            <div>
              <div style="font-weight: 700; color: #0f172a; font-size: 12px; line-height: 1.2;">${item.name}</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 1px;">SKU: #${item.id.slice(0, 8).toUpperCase()}</div>
            </div>
          </div>
        </td>
        <td style="padding: 6px 8px; text-align: center; font-size: 12px; font-weight: 600; color: #0f172a; vertical-align: middle;">
          ${item.quantity}
        </td>
        <td style="padding: 6px 8px; text-align: right; font-size: 12px; color: #334155; vertical-align: middle;">
          ${currency}${Number(item.price || 0).toLocaleString("en-IN")}
        </td>
        <td style="padding: 6px 8px; text-align: right; font-size: 12px; font-weight: 700; color: #0f172a; vertical-align: middle;">
          ${currency}${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString("en-IN")}
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff; padding: 24px 28px; color: #0f172a; max-width: 780px; margin: 0 auto; box-sizing: border-box; page-break-inside: avoid;">
      
      <!-- Top Title -->
      <div style="margin-bottom: 16px;">
        <h1 style="font-size: 38px; font-weight: 900; margin: 0; letter-spacing: -1.2px; color: #0f172a; line-height: 1;">Invoice.</h1>
      </div>

      <!-- 4-Column Header Details -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 16px; font-size: 10.5px; line-height: 1.4;">
        <div>
          <div style="font-weight: 800; text-transform: uppercase; color: #000000; margin-bottom: 4px; letter-spacing: 0.5px; font-size: 10.5px;">INVOICE FROM</div>
          <div style="font-weight: 700; color: #0f172a; font-size: 11px;">${storeName}</div>
          <div style="color: #475569; margin-top: 1px;">${storeAddress}</div>
          <div style="color: #475569; margin-top: 1px;">${storePhone}</div>
          <div style="color: #475569;">${storeEmail}</div>
        </div>

        <div>
          <div style="font-weight: 800; text-transform: uppercase; color: #000000; margin-bottom: 4px; letter-spacing: 0.5px; font-size: 10.5px;">INVOICE TO</div>
          <div style="font-weight: 700; color: #0f172a; font-size: 11px;">${order.customerName || "Customer"}</div>
          <div style="color: #475569; margin-top: 1px;">${order.address || ""}, ${order.city || ""} - ${order.pincode || ""}, ${order.country || "India"}</div>
          <div style="color: #475569; margin-top: 1px;">Ph: ${order.customerPhone || "N/A"}</div>
          <div style="color: #475569;">${order.customerEmail || ""}</div>
        </div>

        <div>
          <div style="font-weight: 800; text-transform: uppercase; color: #000000; margin-bottom: 4px; letter-spacing: 0.5px; font-size: 10.5px;">PAYMENT METHOD</div>
          <div style="font-weight: 700; color: #0f172a; font-size: 11px;">${order.paymentMethod || "UPI Payment"}</div>
          <div style="color: #475569; margin-top: 1px;">Status: <span style="font-weight: 800; color: #16a34a; text-transform: uppercase;">${order.paymentStatus || "PAID"}</span></div>
          ${
            order.transactionId || order.razorpayPaymentId
              ? `<div style="color: #475569; font-size: 9.5px; font-family: monospace; margin-top: 2px; word-break: break-all;">Ref: ${
                  order.razorpayPaymentId || order.transactionId
                }</div>`
              : ""
          }
        </div>

        <div>
          <div style="font-weight: 800; text-transform: uppercase; color: #000000; margin-bottom: 4px; letter-spacing: 0.5px; font-size: 10.5px;">NUMBER / DATE</div>
          <div style="font-size: 12px; font-weight: 800; color: #0f172a; font-family: monospace;">${invoiceNo}</div>
          <div style="color: #475569; margin-top: 2px;">DATE: ${formattedDate}</div>
          <div style="color: #475569; margin-top: 1px;">ORDER: #${order.id.slice(0, 8).toUpperCase()}</div>
        </div>
      </div>

      <!-- Main Section Divider -->
      <div style="border-top: 2px solid #0f172a; margin-bottom: 14px;"></div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;">
        <thead>
          <tr style="border-bottom: 1.5px solid #0f172a; font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #000000; letter-spacing: 0.6px;">
            <th style="padding: 6px 8px; text-align: left;">DESCRIPTION</th>
            <th style="padding: 6px 8px; text-align: center; width: 60px;">QTY</th>
            <th style="padding: 6px 8px; text-align: right; width: 100px;">PRICE</th>
            <th style="padding: 6px 8px; text-align: right; width: 100px;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Bottom Divider -->
      <div style="border-top: 1.5px solid #0f172a;"></div>

      <!-- Subtotal Summary -->
      <div style="display: flex; justify-content: flex-end; margin-top: 10px; margin-bottom: 18px; page-break-inside: avoid;">
        <div style="width: 240px; font-size: 11.5px; line-height: 1.8;">
          <div style="display: flex; justify-content: space-between; color: #475569;">
            <span style="font-weight: 700; letter-spacing: 0.4px;">SUBTOTAL</span>
            <span style="font-weight: 700; color: #0f172a;">${currency}${(order.subtotal || 0).toLocaleString("en-IN")}</span>
          </div>
          ${
            order.couponDiscount
              ? `
          <div style="display: flex; justify-content: space-between; color: #16a34a;">
            <span style="font-weight: 700; letter-spacing: 0.4px;">DISCOUNT (${order.couponCode || "COUPON"})</span>
            <span style="font-weight: 700;">-${currency}${order.couponDiscount.toLocaleString("en-IN")}</span>
          </div>`
              : ""
          }
          <div style="display: flex; justify-content: space-between; color: #475569;">
            <span style="font-weight: 700; letter-spacing: 0.4px;">DELIVERY</span>
            <span style="font-weight: 700; color: #0f172a;">${currency}${(order.deliveryCharge || 0).toLocaleString("en-IN")}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; color: #0f172a; border-top: 2px solid #0f172a; margin-top: 6px; padding-top: 6px;">
            <span>TOTAL</span>
            <span>${currency}${(order.total || 0).toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      <!-- Section Divider -->
      <div style="border-top: 2px solid #0f172a; margin-bottom: 14px;"></div>

      <!-- Terms & Conditions -->
      <div style="margin-bottom: 18px; page-break-inside: avoid;">
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #000000; margin-bottom: 4px; letter-spacing: 0.6px;">TERMS & CONDITIONS</div>
        <div style="font-size: 10px; color: #64748b; line-height: 1.5;">
          Thank you for ordering from br_Treasure_Trove. All products undergo rigorous quality inspection before dispatch. If you have any inquiries or require support regarding this purchase, please contact support quoting your order reference number.
        </div>
      </div>

      <!-- Bottom Line -->
      <div style="border-top: 1px solid #cbd5e1; margin-bottom: 10px;"></div>

      <!-- Footer Info -->
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b; font-weight: 500; page-break-inside: avoid;">
        <span>${storeWebsite}</span>
        <span>${storeEmail}</span>
        <span>${storePhone}</span>
        <span>${storeName}</span>
      </div>

    </div>
  `;
}

export async function downloadInvoicePDF(order: Order): Promise<void> {
  if (typeof window === "undefined") return;

  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = "780px";
  container.innerHTML = generateInvoiceHtml(order);
  document.body.appendChild(container);

  const filename = `Invoice-INV-${order.id.slice(0, 8).toUpperCase()}.pdf`;

  const opt = {
    margin: [4, 4, 4, 4],
    filename: filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] },
  };

  try {
    const html2pdfModule = await import("html2pdf.js");
    const html2pdf = html2pdfModule.default || html2pdfModule;
    // @ts-ignore
    await html2pdf().set(opt).from(container).save();
  } catch (err) {
    console.warn("html2pdf error, falling back to print window:", err);
    openPrintableInvoice(order);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

export function openPrintableInvoice(order: Order): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice - INV-${order.id.slice(0, 8).toUpperCase()}</title>
        <meta charset="utf-8" />
        <style>
          @page { size: A4 portrait; margin: 8mm; }
          html, body { margin: 0; padding: 0; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; page-break-inside: avoid; }
          @media print {
            @page { size: A4 portrait; margin: 8mm; }
            body { background: #ffffff; }
          }
        </style>
      </head>
      <body>
        ${generateInvoiceHtml(order)}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
