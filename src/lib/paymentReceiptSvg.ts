import type { PaymentReceipt } from "@/redux/api/studentApi";

const TEMPLATE_URL = "/receipt/Payment Receipt.svg";
const FONT = "Inter, 'Helvetica Neue', Arial, sans-serif";
const TABLE_TOP = 271.661;
const ROW_HEIGHT = 16;
const VALUE_RIGHT_X = 270;
const TEMPLATE_ROWS = 5;
const FREE_EXTRA_ROWS = 3;

const EXTRA_HEADS = [
  ["application", "Application Fee"],
  ["admission", "Admission Fee"],
  ["security", "Security Deposit"],
  ["stationery", "Stationery Fee"],
] as const;

type ReceiptFees = PaymentReceipt["fees"] & { penalty?: number; lateFee?: number };
type ReceiptData = Omit<PaymentReceipt, "fees"> & { fees: ReceiptFees };

let templateRequest: Promise<string> | null = null;

function getTemplate() {
  if (!templateRequest) {
    templateRequest = fetch(TEMPLATE_URL).then((response) => {
      if (!response.ok) throw new Error("Unable to load the payment receipt template.");
      return response.text();
    });
  }
  return templateRequest;
}

const escapeXml = (value: unknown) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character] ?? character);

const amount = (value: unknown) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function indiaDateParts(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "", dateTime: "" };

  const dateText = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const timeText = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return { date: dateText, dateTime: `${dateText}, ${timeText}` };
}

function text(
  x: number,
  y: number,
  value: unknown,
  options: { size?: number; weight?: number; anchor?: "start" | "middle" | "end" } = {},
) {
  const { size = 8, weight = 500, anchor = "start" } = options;
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="black">${escapeXml(value)}</text>`;
}

function additionalRow(y: number) {
  return `<rect x="21" y="${y}" width="151" height="${ROW_HEIGHT}" stroke="black" stroke-width="0.781096"/>` +
    `<rect x="172" y="${y}" width="104" height="${ROW_HEIGHT}" stroke="black" stroke-width="0.781096"/>`;
}

function paymentDetails(heads: string[]) {
  let description = heads.join(", ");
  let size = Math.min(8, 170 / (description.length * 0.56));
  if (size < 6) {
    description = `${heads.length} fee heads`;
    size = 8;
  }
  return text(97, 433.04, description, { size: Number(size.toFixed(2)) });
}

/** Builds the receipt in the browser from API payment data and the approved public SVG. */
export async function generatePaymentReceiptSvg(receipt: ReceiptData) {
  const template = await getTemplate();
  const fees = receipt.fees ?? ({} as ReceiptFees);
  const paid = indiaDateParts(receipt.paidAt);
  const knownTotal = Object.entries(fees)
    .filter(([key]) => key !== "penalty" && key !== "lateFee")
    .reduce((sum, [, value]) => sum + (Number(value) || 0), 0);
  const suppliedPenalty = Number(fees.penalty ?? fees.lateFee);
  const penalty = Number.isFinite(suppliedPenalty)
    ? suppliedPenalty
    : Math.max(0, Number(receipt.total || 0) - knownTotal);
  const className = String(receipt.student.className || "").replace(/\s*[-–]\s*Section\s*\S+\s*$/i, "");
  const session = /^(\d{4})\s*[-/]\s*(\d{2,4})$/.exec(receipt.academicSession || "");
  const values: string[] = [
    text(52, 114.1, receipt.receiptNumber),
    text(222, 114.1, paid.date),
    text(92, 138.6, receipt.student.fullName),
    text(92, 154.5, receipt.student.parentName || "-"),
    text(55, 170.6, className),
    text(180, 170.6, receipt.student.section),
    text(270, 186.5, `Adm. No.: ${receipt.student.admissionNumber || ""}`, { size: 7, anchor: "end" }),
    text(96, 239.1, receipt.feesForPeriod),
  ];

  if (session) {
    values.push(text(116, 186.5, session[1].slice(2), { anchor: "middle" }));
    values.push(text(125, 186.5, session[2].slice(-2)));
  } else {
    values.push(text(128, 186.5, receipt.academicSession));
  }

  [fees.annual, fees.tuition, fees.transport, fees.miscellaneous, penalty].forEach((value, index) => {
    values.push(text(VALUE_RIGHT_X, TABLE_TOP + index * ROW_HEIGHT + 11, amount(value), { anchor: "end" }));
  });

  const extras = EXTRA_HEADS.filter(([key]) => Number(fees[key]) > 0);
  extras.forEach(([key, label], index) => {
    const y = TABLE_TOP + (TEMPLATE_ROWS + index) * ROW_HEIGHT;
    values.push(additionalRow(y));
    values.push(text(27.5, y + 11, label, { weight: 600 }));
    values.push(text(VALUE_RIGHT_X, y + 11, amount(fees[key]), { anchor: "end" }));
  });

  const offset = Math.max(0, (extras.length - FREE_EXTRA_ROWS) * ROW_HEIGHT + (extras.length > FREE_EXTRA_ROWS ? 4 : 0));
  const heads = [
    ["annual", "Annual Fee"],
    ["tuition", "Tuition Fee"],
    ["transport", "Transport Fee"],
    ["miscellaneous", "Miscellaneous Fee"],
    ...EXTRA_HEADS,
  ] as const;
  const paidHeads: string[] = heads.filter(([key]) => Number(fees[key]) > 0).map(([, label]) => label);
  if (penalty > 0) paidHeads.push("Late Fee");
  const displayMode = String(receipt.paymentMode || "").toLowerCase().replace(/^./, (character) => character.toUpperCase());
  const totalBlock = [
    text(VALUE_RIGHT_X, 416.8, `₹${amount(receipt.total)}`, { size: 10, weight: 700, anchor: "end" }),
    paymentDetails(paidHeads),
    text(65, 445.06, `₹${amount(receipt.total)}`),
    text(115, 457.08, displayMode),
    text(52, 469.1, paid.dateTime),
  ].join("\n");
  values.push(offset ? `<g transform="translate(0 ${offset})">${totalBlock}</g>` : totalBlock);

  let output = template;
  if (offset) {
    for (const pathStart of ["M28.6911 410.844", "M28.9751 433.037"]) {
      const expression = new RegExp(`(<path d="${pathStart.replace(".", "\\.")}[^>]*/>)`);
      output = output.replace(expression, `<g transform="translate(0 ${offset})">$1</g>`);
    }
  }
  const insertAt = output.lastIndexOf("</g>", output.indexOf("<defs>"));
  if (insertAt < 0) throw new Error("Payment receipt template has an unsupported layout.");
  return `${output.slice(0, insertAt)}<g id="receipt-values">${values.join("\n")}</g>\n${output.slice(insertAt)}`;
}
