import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  siAirtel,
  siAxisbank,
  siFampay,
  siGooglepay,
  siHdfcbank,
  siIcicibank,
  siJio,
  siPaytm,
  siPhonepe,
  siSamsungpay,
  siTata,
  siWhatsapp,
} from "simple-icons";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, "../public/upi-logos");

const simpleIconMap = {
  "google-pay": siGooglepay,
  phonepe: siPhonepe,
  paytm: siPaytm,
  "whatsapp-pay": siWhatsapp,
  "airtel-thanks": siAirtel,
  jiopay: siJio,
  fampay: siFampay,
  "samsung-pay": siSamsungpay,
  "tata-neu": siTata,
  "axis-pay": siAxisbank,
  payzapp: siHdfcbank,
  imobile: siIcicibank,
};

function buildSimpleIconSvg(icon) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-label="${icon.title}">
  <rect width="24" height="24" rx="5" fill="#ffffff"/>
  <path fill="#${icon.hex}" d="${icon.path}"/>
</svg>`;
}

mkdirSync(outputDir, { recursive: true });

Object.entries(simpleIconMap).forEach(([platformId, icon]) => {
  writeFileSync(join(outputDir, `${platformId}.svg`), buildSimpleIconSvg(icon), "utf8");
});

console.log(`Generated ${Object.keys(simpleIconMap).length} simple-icon UPI logos.`);
