/**
 * Draws a shareable birth-chart card (1080×1350, portrait for WhatsApp and
 * Instagram) on a canvas, in North or South Indian style. Drawn directly,
 * rather than copied from the page's SVG, so colours don't depend on CSS
 * variables and both styles export the same way. Browser-only.
 */

export interface ImagePlanet {
  planet: string;
  house: number;
  signIndex: number;
  markers?: string;
}

const ABBR: Record<string, string> = { Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju", Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke" };
const SANSKRIT = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya", "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"];
const INK = "#0e1733";
const SURFACE = "#142043";
const GOLD = "#e8a915";
const GOLD_BRIGHT = "#f2c14e";
const CREAM = "#eef0f5";
const MUTED = "#a3aecb";
const ROSE = "#ef7b76";

// North Indian houses on a 400-unit square, with their label anchors (house 1 at the top).
const ANCHORS: [number, number][] = [
  [200, 58], [130, 46], [54, 100], [58, 200], [54, 300], [130, 356], [200, 344], [270, 356], [346, 300], [344, 200], [346, 100], [270, 46],
];
const GRID: (number | null)[][] = [
  [11, 0, 1, 2],
  [10, null, null, 3],
  [9, null, null, 4],
  [8, 7, 6, 5],
];

export function drawChartCard(opts: { style: "north" | "south"; ascendantSignIndex: number; planets: ImagePlanet[]; title: string; subtitle: string; footer: string }): HTMLCanvasElement {
  const W = 1080;
  const H = 1350;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(W * 0.3, H * 0.25, 50, W / 2, H / 2, H);
  g.addColorStop(0, "#1b2a5c");
  g.addColorStop(1, INK);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";
  ctx.fillStyle = GOLD_BRIGHT;
  ctx.font = "600 30px system-ui, sans-serif";
  ctx.fillText("ASTRONUM", W / 2, 90);
  ctx.fillStyle = CREAM;
  ctx.font = "700 60px system-ui, sans-serif";
  ctx.fillText(opts.title, W / 2, 175, W - 120);
  ctx.fillStyle = MUTED;
  ctx.font = "400 32px system-ui, sans-serif";
  ctx.fillText(opts.subtitle, W / 2, 230, W - 120);

  const size = 880;
  const x0 = (W - size) / 2;
  const y0 = 290;
  const s = size / 400;
  ctx.save();
  ctx.translate(x0, y0);
  ctx.fillStyle = SURFACE;
  roundRect(ctx, 0, 0, size, size, 24);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  roundRect(ctx, 0, 0, size, size, 24);
  ctx.stroke();

  if (opts.style === "north") {
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    line(ctx, 0, 0, size, size);
    line(ctx, size, 0, 0, size);
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size, size / 2);
    ctx.lineTo(size / 2, size);
    ctx.lineTo(0, size / 2);
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 1;
    ANCHORS.forEach(([ax, ay], i) => {
      const house = i + 1;
      const sign = ((opts.ascendantSignIndex + i) % 12) + 1;
      ctx.fillStyle = MUTED;
      ctx.font = "400 24px system-ui, sans-serif";
      ctx.fillText(String(sign), ax * s, (ay - 16) * s);
      const occ = opts.planets.filter((p) => p.house === house);
      occ.forEach((p, k) => drawPlanet(ctx, p, ax * s, (ay + 2) * s + k * 36));
      if (house === 1) {
        ctx.fillStyle = GOLD_BRIGHT;
        ctx.font = "600 22px system-ui, sans-serif";
        ctx.fillText("ASC", ax * s, (ay + 2) * s + occ.length * 36 + 6);
      }
    });
  } else {
    const cell = size / 4;
    GRID.forEach((row, r) =>
      row.forEach((sign, col) => {
        if (sign === null) return;
        const cx = col * cell;
        const cy = r * cell;
        ctx.strokeStyle = sign === opts.ascendantSignIndex ? GOLD : "#2a3a6b";
        ctx.lineWidth = sign === opts.ascendantSignIndex ? 4 : 2;
        ctx.strokeRect(cx + 6, cy + 6, cell - 12, cell - 12);
        ctx.fillStyle = MUTED;
        ctx.font = "400 20px system-ui, sans-serif";
        ctx.fillText(SANSKRIT[sign], cx + cell / 2, cy + 36);
        const occ = opts.planets.filter((p) => p.signIndex === sign);
        const items = [...(sign === opts.ascendantSignIndex ? [{ planet: "Asc", house: 1, signIndex: sign }] : []), ...occ];
        items.forEach((p, k) => {
          const px = cx + cell / 2 + ((k % 2) - (items.length > 1 ? 0.5 : 0)) * 70;
          const py = cy + 80 + Math.floor(k / 2) * 38;
          if (p.planet === "Asc") {
            ctx.fillStyle = GOLD_BRIGHT;
            ctx.font = "600 24px system-ui, sans-serif";
            ctx.fillText("Asc", px, py);
          } else drawPlanet(ctx, p as ImagePlanet, px, py);
        });
      })
    );
    ctx.fillStyle = GOLD;
    ctx.globalAlpha = 0.35;
    ctx.font = "400 90px serif";
    ctx.fillText("ॐ", size / 2, size / 2 + 30);
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  ctx.fillStyle = MUTED;
  ctx.font = "400 26px system-ui, sans-serif";
  ctx.fillText(opts.footer, W / 2, H - 60, W - 120);
  return c;
}

function drawPlanet(ctx: CanvasRenderingContext2D, p: ImagePlanet, x: number, y: number) {
  const marks = p.markers ?? "";
  ctx.font = "700 32px system-ui, sans-serif";
  ctx.fillStyle = marks.includes("↓") ? ROSE : marks.includes("↑") ? GOLD_BRIGHT : CREAM;
  const label = ABBR[p.planet] ?? p.planet.slice(0, 2);
  ctx.fillText(label, x, y);
  if (marks) {
    const w = ctx.measureText(label).width;
    ctx.font = "600 18px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = /[↓CR]/.test(marks) ? ROSE : GOLD_BRIGHT;
    ctx.fillText(marks, x + w / 2 + 2, y - 14);
    ctx.textAlign = "center";
  }
}

function line(ctx: CanvasRenderingContext2D, a: number, b: number, c: number, d: number) {
  ctx.beginPath();
  ctx.moveTo(a, b);
  ctx.lineTo(c, d);
  ctx.stroke();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function canvasToBlob(c: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create the image"))), "image/png"));
}
