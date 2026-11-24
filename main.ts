// THE WORLD TODAY — Tuesday 24 November 2026.
// A newspaper front page of the day's biggest stories, drawn pixel by pixel
// with a small software rasteriser and a 5x7 bitmap font, then written as a
// PNG to $MAKEFUN_OUTPUT_DIR/entry.png (the grader's /output).
// No network, no clock, no randomness: two runs write the same bytes.
//
// The day (24 Nov 2026), as reported that day:
//  - COP31 climate talks in Antalya end in collapse: no agreement after the
//    EU rejects a final text that never mentions fossil fuels; the first COP
//    to close without a consensus deal since 2009.
//  - Jensen Huang returns as Nvidia chief executive after the board
//    reinstates him; shares surge about 31% in a day, close to $1tn of value.
//  - A fire at a candy factory in Banten, Indonesia kills at least 24
//    people; rescuers search for around 30 workers still missing.
//  - The Russian cargo ship Sparta II catches fire in the Gulf of Finland
//    after a drone strike.
//  - Max Verstappen wins the Las Vegas Grand Prix.
//  - India and Nepal open the Saryu-Kamala Express rail link, Ayodhya to
//    Janakpur Dham, and sign eight pacts.
//  Ticker: Carlos Alcaraz wins his first ATP Finals title; Gukesh begins
//  his World Chess title defence in Geneva; FIFA picks a US-led bid to host
//  the 2031 Women's World Cup; thousands march in Lisbon over living costs;
//  Delta flights recover ahead of Thanksgiving.

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const W = 1024, H = 1024;
const px = new Uint8Array(W * H * 3);

// ---------------------------------------------------------------- palette --
const PAPER: [number, number, number] = [246, 241, 231];
const INK: [number, number, number] = [26, 26, 26];
const NAVY: [number, number, number] = [20, 33, 61];
const RED: [number, number, number] = [185, 28, 28];
const GOLD: [number, number, number] = [212, 160, 23];
const WHITE: [number, number, number] = [255, 255, 255];
const GREY: [number, number, number] = [91, 91, 91];
const LIGHT: [number, number, number] = [232, 226, 214];
const BLUE: [number, number, number] = [42, 110, 178];
const GREEN: [number, number, number] = [46, 125, 72];
const ORANGE: [number, number, number] = [224, 110, 30];
const TEAL: [number, number, number] = [18, 130, 130];

type RGB = [number, number, number];

// ---------------------------------------------------------------- raster --
function setPx(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
}
function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) setPx(i, j, c);
}
function fillCircle(cx: number, cy: number, rad: number, c: RGB): void {
  for (let j = cy - rad; j <= cy + rad; j++)
    for (let i = cx - rad; i <= cx + rad; i++) {
      const dx = i - cx, dy = j - cy;
      if (dx * dx + dy * dy <= rad * rad) setPx(i, j, c);
    }
}
function ring(cx: number, cy: number, rad: number, thick: number, c: RGB): void {
  for (let j = cy - rad - thick; j <= cy + rad + thick; j++)
    for (let i = cx - rad - thick; i <= cx + rad + thick; i++) {
      const d = Math.sqrt((i - cx) * (i - cx) + (j - cy) * (j - cy));
      if (d >= rad - thick && d <= rad + thick) setPx(i, j, c);
    }
}
function line(x0: number, y0: number, x1: number, y1: number, c: RGB, thick = 1): void {
  const dx = x1 - x0, dy = y1 - y0, steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
  for (let s = 0; s <= steps; s++) {
    const x = Math.round(x0 + (dx * s) / steps), y = Math.round(y0 + (dy * s) / steps);
    for (let a = 0; a < thick; a++) for (let b = 0; b < thick; b++) setPx(x + a, y + b, c);
  }
}
function fillTri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
  const minX = Math.min(x0, x1, x2), maxX = Math.max(x0, x1, x2);
  const minY = Math.min(y0, y1, y2), maxY = Math.max(y0, y1, y2);
  const d = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2);
  for (let j = minY; j <= maxY; j++)
    for (let i = minX; i <= maxX; i++) {
      const a = ((y1 - y2) * (i - x2) + (x2 - x1) * (j - y2)) / d;
      const b = ((y2 - y0) * (i - x2) + (x0 - x2) * (j - y2)) / d;
      const g = 1 - a - b;
      if (a >= 0 && b >= 0 && g >= 0) setPx(i, j, c);
    }
}

// ------------------------------------------------------------------- font --
// 5x7 bitmap font, rows top to bottom, '#' = pixel on.
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "$": ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "*": ["00000", "10101", "01110", "10101", "00000", "00000", "00000"],
  "|": ["00100", "00100", "00100", "00100", "00100", "00100", "00100"],
};

function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}
function drawChar(x: number, y: number, ch: string, scale: number, c: RGB): void {
  const g = FONT[ch] ?? FONT["?"];
  for (let r = 0; r < 7; r++)
    for (let col = 0; col < 5; col++)
      if (g[r][col] === "1") fillRect(x + col * scale, y + r * scale, scale, scale, c);
}
function drawText(x: number, y: number, s: string, scale: number, c: RGB): void {
  // The font is uppercase only: normalise so no glyph ever falls back to "?".
  s = s.toUpperCase();
  for (let i = 0; i < s.length; i++) drawChar(x + i * 6 * scale, y, s[i], scale, c);
}
function drawTextCentred(cx: number, y: number, s: string, scale: number, c: RGB): void {
  drawText(cx - Math.floor(textWidth(s, scale) / 2), y, s, scale, c);
}
function wrapText(s: string, scale: number, maxW: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (textWidth(trial, scale) <= maxW) {
      cur = trial;
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
function drawPara(x: number, y: number, s: string, scale: number, maxW: number, c: RGB, leading: number): number {
  const lines = wrapText(s, scale, maxW);
  lines.forEach((ln, i) => drawText(x, y + i * leading, ln, scale, c));
  return y + lines.length * leading;
}

// -------------------------------------------------------------------- png --
// Minimal deterministic PNG writer: RGB, 8-bit, filter 0 on every row.
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function encodePng(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------ icons --
// Small flat illustrations, drawn in the story panels.
function iconGlobe(cx: number, cy: number, r: number): void {
  fillCircle(cx, cy, r, BLUE);
  fillCircle(cx - r / 3, cy - r / 4, Math.floor(r / 3), GREEN);
  fillCircle(cx + r / 3, cy + r / 3, Math.floor(r / 4), GREEN);
  fillCircle(cx + r / 4, cy - r / 2, Math.floor(r / 5), GREEN);
  ring(cx, cy, r, 3, NAVY);
  line(cx - r, cy, cx + r, cy, WHITE, 2);
  line(cx, cy - r, cx, cy + r, WHITE, 2);
}
function iconSmokeStacks(x: number, y: number, s: number): void {
  // Two factory stacks with grey smoke puffs.
  fillRect(x, y + 30 * s, 14 * s, 26 * s, INK);
  fillRect(x + 20 * s, y + 22 * s, 14 * s, 34 * s, INK);
  fillCircle(x + 7 * s, y + 22 * s, 6 * s, GREY);
  fillCircle(x + 13 * s, y + 12 * s, 7 * s, GREY);
  fillCircle(x + 27 * s, y + 14 * s, 6 * s, GREY);
  fillCircle(x + 33 * s, y + 4 * s, 7 * s, GREY);
  fillRect(x - 4 * s, y + 56 * s, 46 * s, 4 * s, INK);
}
function iconChip(x: number, y: number, s: number): void {
  fillRect(x, y, 52 * s, 52 * s, NAVY);
  fillRect(x + 10 * s, y + 10 * s, 32 * s, 32 * s, TEAL);
  drawText(x + 17 * s, y + 19 * s, "AI", 3 * s, WHITE);
  for (let i = 0; i < 4; i++) {
    fillRect(x + 8 * s + i * 12 * s, y - 6 * s, 4 * s, 6 * s, GOLD);
    fillRect(x + 8 * s + i * 12 * s, y + 52 * s, 4 * s, 6 * s, GOLD);
    fillRect(x - 6 * s, y + 8 * s + i * 12 * s, 6 * s, 4 * s, GOLD);
    fillRect(x + 52 * s, y + 8 * s + i * 12 * s, 6 * s, 4 * s, GOLD);
  }
}
function iconFlame(x: number, y: number, s: number): void {
  fillTri(x + 26 * s, y, x + 4 * s, y + 34 * s, x + 48 * s, y + 34 * s, ORANGE);
  fillTri(x + 26 * s, y + 12 * s, x + 12 * s, y + 38 * s, x + 40 * s, y + 38 * s, RED);
  fillCircle(x + 26 * s, y + 30 * s, 8 * s, GOLD);
  fillRect(x, y + 52 * s, 52 * s, 4 * s, INK);
}
function iconShip(x: number, y: number, s: number): void {
  fillRect(x + 22 * s, y, 4 * s, 26 * s, INK);
  fillTri(x + 26 * s, y + 2 * s, x + 26 * s, y + 14 * s, x + 40 * s, y + 14 * s, RED);
  fillRect(x + 10 * s, y + 26 * s, 32 * s, 12 * s, NAVY);
  fillTri(x + 2 * s, y + 38 * s, x + 50 * s, y + 38 * s, x + 42 * s, y + 54 * s, NAVY);
  fillTri(x + 2 * s, y + 38 * s, x + 10 * s, y + 54 * s, x + 42 * s, y + 54 * s, NAVY);
  fillCircle(x + 14 * s, y + 20 * s, 4 * s, GREY);
  fillCircle(x + 20 * s, y + 12 * s, 5 * s, GREY);
  fillRect(x, y + 58 * s, 52 * s, 3 * s, BLUE);
}
function iconRaceCar(x: number, y: number, s: number): void {
  fillRect(x + 2 * s, y + 14 * s, 48 * s, 16 * s, RED);
  fillRect(x + 14 * s, y + 2 * s, 22 * s, 14 * s, RED);
  fillRect(x + 40 * s, y + 4 * s, 10 * s, 4 * s, INK);
  fillRect(x + 46 * s, y, 3 * s, 12 * s, INK);
  fillCircle(x + 12 * s, y + 32 * s, 8 * s, INK);
  fillCircle(x + 12 * s, y + 32 * s, 3 * s, GREY);
  fillCircle(x + 40 * s, y + 32 * s, 8 * s, INK);
  fillCircle(x + 40 * s, y + 32 * s, 3 * s, GREY);
  fillRect(x, y + 42 * s, 52 * s, 3 * s, INK);
}
function iconTrain(x: number, y: number, s: number): void {
  fillRect(x + 4 * s, y, 44 * s, 34 * s, TEAL);
  fillRect(x + 4 * s, y, 44 * s, 8 * s, NAVY);
  for (let i = 0; i < 3; i++) fillRect(x + 9 * s + i * 14 * s, y + 13 * s, 9 * s, 10 * s, WHITE);
  fillCircle(x + 14 * s, y + 38 * s, 5 * s, INK);
  fillCircle(x + 38 * s, y + 38 * s, 5 * s, INK);
  fillRect(x, y + 46 * s, 52 * s, 3 * s, INK);
  fillRect(x, y + 52 * s, 52 * s, 3 * s, INK);
}

// ----------------------------------------------------------------- layout --
function card(x: number, y: number, w: number, h: number): void {
  fillRect(x, y, w, h, INK);
  fillRect(x + 2, y + 2, w - 4, h - 4, WHITE);
}
function kicker(x: number, y: number, s: string): void {
  drawText(x, y, s, 2, RED);
}

function draw(): void {
  fillRect(0, 0, W, H, PAPER);

  // Masthead.
  fillRect(0, 0, W, 118, NAVY);
  drawText(32, 26, "THE WORLD TODAY", 5, WHITE);
  drawText(32, 72, "TUESDAY 24 NOVEMBER 2026", 3, GOLD);
  iconGlobe(948, 59, 36);
  fillRect(0, 118, W, 6, RED);

  // Lead story: COP31 collapse.
  card(32, 140, 960, 312);
  kicker(56, 160, "CLIMATE - ANTALYA, TURKIYE");
  drawText(56, 192, "COP31 CLIMATE TALKS", 4, INK);
  drawText(56, 228, "COLLAPSE", 4, RED);
  drawPara(
    56, 272,
    "The COP31 climate summit ends with no agreement after running two days past its deadline. Delegates leave Antalya split over fossil fuels - the first COP to close without a consensus deal since 2009.",
    2, 540, INK, 20,
  );
  iconGlobe(710, 258, 64);
  iconSmokeStacks(812, 246, 1);
  fillRect(636, 366, 208, 46, WHITE);
  fillRect(636, 366, 208, 3, RED);
  fillRect(636, 409, 208, 3, RED);
  fillRect(636, 366, 3, 46, RED);
  fillRect(841, 366, 3, 46, RED);
  drawTextCentred(740, 378, "NO DEAL", 4, RED);

  // Middle row: Nvidia and Indonesia.
  card(32, 472, 468, 220);
  kicker(52, 488, "TECH - SANTA CLARA");
  iconChip(420, 486, 1);
  drawPara(52, 516, "HUANG IS BACK AT NVIDIA", 3, 340, INK, 26);
  drawPara(
    52, 576,
    "Jensen Huang returns as chief executive after the board reinstates him. Nvidia shares surge about 31% in a day, adding close to $1 trillion in value.",
    2, 428, INK, 19,
  );

  card(524, 472, 468, 220);
  kicker(544, 488, "DISASTER - BANTEN, INDONESIA");
  iconFlame(922, 486, 1);
  drawPara(544, 516, "FACTORY FIRE KILLS 24", 3, 428, INK, 26);
  drawPara(
    544, 576,
    "A fire at a candy factory kills at least 24 people. Rescuers search for around 30 workers still missing.",
    2, 428, INK, 19,
  );

  // Bottom row: three short stories.
  const bx = [32, 352, 672];
  const bottom: { kick: string; head: string; body: string; icon: (x: number, y: number, s: number) => void }[] = [
    {
      kick: "WAR AT SEA",
      head: "RUSSIAN SHIP ABLAZE",
      body: "The cargo ship Sparta II catches fire in the Gulf of Finland after a drone strike.",
      icon: iconShip,
    },
    {
      kick: "SPORT - LAS VEGAS",
      head: "VERSTAPPEN WINS VEGAS GP",
      body: "Max Verstappen takes victory at the Las Vegas Grand Prix.",
      icon: iconRaceCar,
    },
    {
      kick: "DIPLOMACY",
      head: "INDIA-NEPAL RAIL LINK OPENS",
      body: "Modi and Nepal PM Balendra Shah flag off the Saryu-Kamala Express and sign eight pacts.",
      icon: iconTrain,
    },
  ];
  bottom.forEach((st, i) => {
    const x = bx[i];
    card(x, 712, 304, 180);
    kicker(x + 16, 726, st.kick);
    st.icon(x + 304 - 68, 724, 1);
    drawPara(x + 16, 758, st.head, 2, 210, INK, 16);
    drawPara(x + 16, 796, st.body, 2, 272, INK, 18);
  });

  // Ticker.
  fillRect(0, 908, W, 70, NAVY);
  drawTextCentred(512, 918, "ALCARAZ WINS FIRST ATP FINALS TITLE | GUKESH DEFENDS WORLD CHESS CROWN IN GENEVA", 2, WHITE);
  drawTextCentred(512, 940, "FIFA PICKS US-LED BID FOR 2031 WOMEN'S WORLD CUP | LISBON MARCHES OVER LIVING COSTS", 2, WHITE);
  drawTextCentred(512, 962, "DELTA FLIGHTS RECOVER FOR THANKSGIVING", 2, GOLD);

  // Footer.
  drawTextCentred(512, 990, "STORIES AS REPORTED ON TUESDAY 24 NOVEMBER 2026", 2, GREY);
}

draw();
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.png"), encodePng());
