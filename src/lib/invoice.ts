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
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 10px; vertical-align: middle;">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${
              item.images && item.images[0]
                ? `<img src="${item.images[0]}" alt="${item.name}" style="width: 42px; height: 42px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; flex-shrink: 0;" />`
                : ""
            }
            <div>
              <div style="font-weight: 700; color: #111827; font-size: 13px; line-height: 1.3;">${item.name}</div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">SKU / ID: #${item.id.slice(0, 8).toUpperCase()}</div>
            </div>
          </div>
        </td>
        <td style="padding: 12px 10px; text-align: center; font-size: 13px; font-weight: 600; color: #111827; vertical-align: middle;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 10px; text-align: right; font-size: 13px; color: #374151; vertical-align: middle;">
          ${currency}${Number(item.price || 0).toLocaleString("en-IN")}
        </td>
        <td style="padding: 12px 10px; text-align: right; font-size: 13px; font-weight: 700; color: #111827; vertical-align: middle;">
          ${currency}${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString("en-IN")}
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff; padding: 40px; color: #111827; max-width: 800px; margin: 0 auto; box-sizing: border-box;">
      
      <!-- Top Title -->
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 52px; font-weight: 900; margin: 0; letter-spacing: -1.5px; color: #0f172a; line-height: 1;">Invoice.</h1>
      </div>

      <!-- 4-Column Header Details -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 28px; font-size: 11px; line-height: 1.5;">
        <div>
          <div style="font-weight: 800; text-transform: uppercase; color: #000000; margin-bottom: 8px; letter-spacing: 0.6px; font-size: 11px;">INVOICE FROM</div>
          <div style="font-weight: 700; color: #0f172a; font-size: 12px;">${storeName}</div>
          <div style="color: #475569; margin-top: 2px;">${storeAddress}</div>
          <div style="color: #475569; margin-top: 2px;">${storePhone}</div>
          <div style="color: #475569;">${storeEmail}</div>
        </div>

        <div>
          <div style="font-weight: 800; text-transform: uppercase; color: #000000; margin-bottom: 8px; letter-spacing: 0.6px; font-size: 11px;">INVOICE TO</div>
          <div style="font-weight: 700; color: #0f172a; font-size: 12px;">${order.customerName || "Customer"}</div>
          <div style="color: #475569; margin-top: 2px;">${order.address || ""}, ${order.city || ""} - ${order.pincode || ""}, ${order.country || "India"}</div>
          <div style="color: #475569; margin-top: 2px;">Ph: ${order.customerPhone || "N/A"}</div>
          <div style="color: #475569;">${order.customerEmail || ""}</div>
        </div>

        <div>
          <div style="font-weight: 800; text-transform: uppercase; color: #000000; margin-bottom: 8px; letter-spacing: 0.6px; font-size: 11px;">PAYMENT METHOD</div>
          <div style="font-weight: 700; color: #0f172a; font-size: 12px;">${order.paymentMethod || "UPI Payment"}</div>
          <div style="color: #475569; margin-top: 2px;">Status: <span style="font-weight: 800; color: #16a34a; text-transform: uppercase;">${order.paymentStatus || "PAID"}</span></div>
          ${
            order.transactionId || order.razorpayPaymentId
              ? `<div style="color: #475569; font-size: 10px; font-family: monospace; margin-top: 4px; word-break: break-all;">Ref: ${
                  order.razorpayPaymentId || order.transactionId
                }</div>`
              : ""
          }
        </div>

        <div>
          <div style="font-weight: 800; text-transform: uppercase; color: #000000; margin-bottom: 8px; letter-spacing: 0.6px; font-size: 11px;">NUMBER / DATE</div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; font-family: monospace;">${invoiceNo}</div>
          <div style="color: #475569; margin-top: 4px;">DATE: ${formattedDate}</div>
          <div style="color: #475569; margin-top: 2px;">ORDER: #${order.id.slice(0, 8).toUpperCase()}</div>
        </div>
      </div>

      <!-- Main Section Divider -->
      <div style="border-top: 2.5px solid #0f172a; margin-bottom: 24px;"></div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="border-bottom: 1.5px solid #0f172a; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #000000; letter-spacing: 0.8px;">
            <th style="padding: 10px 8px; text-align: left;">DESCRIPTION</th>
            <th style="padding: 10px 8px; text-align: center; width: 70px;">QTY</th>
            <th style="padding: 10px 8px; text-align: right; width: 110px;">PRICE</th>
            <th style="padding: 10px 8px; text-align: right; width: 110px;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Bottom Divider -->
      <div style="border-top: 1.5px solid #0f172a; margin-between: 20px;"></div>

      <!-- Subtotal Summary -->
      <div style="display: flex; justify-content: flex-end; margin-top: 16px; margin-bottom: 32px;">
        <div style="width: 260px; font-size: 12px; line-height: 2;">
          <div style="display: flex; justify-content: space-between; color: #475569;">
            <span style="font-weight: 700; uppercase; letter-spacing: 0.5px;">SUBTOTAL</span>
            <span style="font-weight: 700; color: #0f172a;">${currency}${(order.subtotal || 0).toLocaleString("en-IN")}</span>
          </div>
          ${
            order.couponDiscount
              ? `
          <div style="display: flex; justify-content: space-between; color: #16a34a;">
            <span style="font-weight: 700; letter-spacing: 0.5px;">DISCOUNT (${order.couponCode || "COUPON"})</span>
            <span style="font-weight: 700;">-${currency}${order.couponDiscount.toLocaleString("en-IN")}</span>
          </div>`
              : ""
          }
          <div style="display: flex; justify-content: space-between; color: #475569;">
            <span style="font-weight: 700; uppercase; letter-spacing: 0.5px;">DELIVERY</span>
            <span style="font-weight: 700; color: #0f172a;">${currency}${(order.deliveryCharge || 0).toLocaleString("en-IN")}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; color: #0f172a; border-top: 2px solid #0f172a; margin-top: 8px; padding-top: 8px;">
            <span>TOTAL</span>
            <span>${currency}${(order.total || 0).toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      <!-- Section Divider -->
      <div style="border-top: 2.5px solid #0f172a; margin-bottom: 24px;"></div>

      <!-- Terms & Conditions -->
      <div style="margin-bottom: 32px;">
        <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #000000; margin-bottom: 8px; letter-spacing: 0.8px;">TERMS & CONDITIONS</div>
        <div style="font-size: 11px; color: #64748b; line-height: 1.6;">
          Thank you for ordering from br_Treasure_Trove. All products undergo rigorous quality inspection before dispatch. If you have any inquiries or require support regarding this purchase, please contact support quoting your order reference number.
        </div>
      </div>

      <!-- Bottom Line -->
      <div style="border-top: 1px solid #cbd5e1; margin-bottom: 16px;"></div>

      <!-- Footer Info -->
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b; font-weight: 500;">
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
  container.style.width = "800px";
  container.innerHTML = generateInvoiceHtml(order);
  document.body.appendChild(container);

  const filename = `Invoice-INV-${order.id.slice(0, 8).toUpperCase()}.pdf`;

  const opt = {
    margin: [8, 8, 8, 8],
    filename: filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
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
          @page { size: A4; margin: 0; }
          html, body { margin: 0; padding: 0; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { padding: 15mm; }
          @media print {
            @page { margin: 0; }
            body { padding: 15mm; background: #ffffff; }
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
