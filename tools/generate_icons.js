/* Genera los iconos PNG de EyeFit (192, 512, 180) sin dependencias externas.
   Diseño: fondo #0A0A0A con "E" en verde lima #C8FF00 (estilo robusto). */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUT_DIR = path.join(__dirname, "icons");

/* ---------- Utilidades PNG ---------- */
function crc32(buf){
  let c, table = crc32.table;
  if(!table){
    table = crc32.table = new Int32Array(256);
    for(let n = 0; n < 256; n++){
      c = n;
      for(let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c;
    }
  }
  c = 0xFFFFFFFF;
  for(let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data){
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba){
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  // Scanlines con filter byte 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for(let y = 0; y < height; y++){
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

/* ---------- Dibujo: texto "E" simple y grueso ---------- */
function isInsideE(px, py, ox, oy, cell){
  // Coordenadas relativas al origen en celdas de 7x7
  const x = Math.floor((px - ox) / cell);
  const y = Math.floor((py - oy) / cell);
  if(x < 0 || x >= 7 || y < 0 || y >= 7) return false;
  // Trazo grueso: barra central (fila 3), brazo superior (fila 1) e inferior (fila 5), pata (col 0)
  // Anatomía de la E: pata izquierda (col 0-1), techo (filas 1), medio (fila 3), suelo (fila 5)
  const inLeftBar = (x <= 1);
  const inTopBar = (y <= 1 && x >= 2 && x <= 6);
  const inMidBar = (y === 3 && x >= 2 && x <= 6);
  const inBotBar = (y >= 5 && x >= 2 && x <= 6);
  return inLeftBar || inTopBar || inMidBar || inBotBar;
}

function makeIcon(size){
  const px = Buffer.alloc(size * size * 4);
  const bg = [0x0A, 0x0A, 0x0A, 0xFF];
  const fg = [0xC8, 0xFF, 0x00, 0xFF];
  // La "E" ocupa ~70% del icono, centrada
  const margin = Math.round(size * 0.15);
  const grid = size - margin * 2;
  const cell = grid / 7;
  const ox = margin;
  const oy = margin;
  for(let y = 0; y < size; y++){
    for(let x = 0; x < size; x++){
      const i = (y * size + x) * 4;
      if(isInsideE(x, y, ox, oy, cell)){
        px[i] = fg[0]; px[i+1] = fg[1]; px[i+2] = fg[2]; px[i+3] = fg[3];
      } else {
        px[i] = bg[0]; px[i+1] = bg[1]; px[i+2] = bg[2]; px[i+3] = bg[3];
      }
    }
  }
  return encodePng(size, size, px);
}

/* ---------- Generar ---------- */
if(!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "icon-180.png", size: 180 },
];

for(const t of targets){
  const png = makeIcon(t.size);
  fs.writeFileSync(path.join(OUT_DIR, t.file), png);
  console.log(`✅ ${t.file} (${t.size}x${t.size}, ${png.length} bytes)`);
}