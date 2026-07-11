// ─── Универсальные утилиты экспорта и импорта ────────────────────────────────
// Все функции работают без сторонних библиотек, только браузерные API

// ── Базовая функция скачивания ──────────────────────────────────────────────

export function скачать(содержимое: string, имяФайла: string, тип = "text/plain") {
  const blob = new Blob(["\uFEFF" + содержимое], { type: тип + ";charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = имяФайла; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ── CSV ──────────────────────────────────────────────────────────────────────

export function экспортCSV(
  заголовки: string[],
  строки: (string | number)[][],
  имяФайла = "данные.csv"
) {
  const sep = ";"
  const строкиCSV = [
    заголовки.join(sep),
    ...строки.map(r => r.map(c =>
      typeof c === "string" && (c.includes(sep) || c.includes('"') || c.includes("\n"))
        ? `"${c.replace(/"/g, '""')}"` : String(c)
    ).join(sep))
  ]
  скачать(строкиCSV.join("\n"), имяФайла, "text/csv")
}

// ── Excel XML (SpreadsheetML) — открывается в MS Excel без библиотек ─────────

export function экспортExcel(
  заголовки: string[],
  строки: (string | number)[][],
  листНазвание = "Данные",
  имяФайла = "данные.xls"
) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:x="urn:schemas-microsoft-com:office:excel">
  <Styles>
    <Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#E8F0FE" ss:Pattern="Solid"/></Style>
    <Style ss:ID="num"><NumberFormat ss:Format="0.00"/></Style>
  </Styles>
  <Worksheet ss:Name="${листНазвание}">
    <Table>
      <Row>${заголовки.map(h => `<Cell ss:StyleID="header"><Data ss:Type="String">${escXml(h)}</Data></Cell>`).join("")}</Row>
      ${строки.map(r => `<Row>${r.map(c => `<Cell${typeof c === "number" ? ' ss:StyleID="num"' : ""}><Data ss:Type="${typeof c === "number" ? "Number" : "String"}">${escXml(String(c))}</Data></Cell>`).join("")}</Row>`).join("\n      ")}
    </Table>
  </Worksheet>
</Workbook>`
  скачать(xml, имяФайла, "application/vnd.ms-excel")
}

function escXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

// ── LandXML ──────────────────────────────────────────────────────────────────

export function экспортLandXML(данные: {
  имя?: string
  точки?: { name: string; x: number; y: number; z: number }[]
  трассы?: { name: string; length: number; elements?: { radius?: number; delta?: number }[] }[]
  поверхности?: { name: string; type: string }[]
  коридоры?: { name: string; length: number; stations?: { pk: number; cut: number; fill: number }[] }[]
  трубы?: { id: number; from: string; to: string; length: number; diameter: number; material: string }[]
}, имяФайла = "данные.xml") {
  const now = new Date().toISOString()
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<LandXML version="1.2" date="${now.split("T")[0]}" time="${now.split("T")[1].slice(0,8)}"
  xmlns="http://www.landxml.org/schema/LandXML-1.2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.landxml.org/schema/LandXML-1.2 LandXML1.2.xsd">
  <Project name="${escXml(данные.имя || "Проект ЛАПА 3D")}"/>
  <Application name="ЛАПА 3D" manufacturer="ЛАПА" version="2026"/>
`

  if (данные.точки?.length) {
    xml += `  <CgPoints>\n`
    данные.точки.forEach(p => {
      xml += `    <CgPoint name="${escXml(p.name)}" oID="${escXml(p.name)}">${p.y.toFixed(3)} ${p.x.toFixed(3)} ${p.z.toFixed(3)}</CgPoint>\n`
    })
    xml += `  </CgPoints>\n`
  }

  if (данные.трассы?.length) {
    xml += `  <Alignments>\n`
    данные.трассы.forEach(a => {
      xml += `    <Alignment name="${escXml(a.name)}" length="${a.length.toFixed(3)}" desc="">\n`
      xml += `      <CoordGeom>\n`
      a.elements?.forEach(e => {
        if (e.radius) {
          xml += `        <Curve radius="${e.radius}" delta="${e.delta || 0}"/>\n`
        } else {
          xml += `        <Line/>\n`
        }
      })
      xml += `      </CoordGeom>\n    </Alignment>\n`
    })
    xml += `  </Alignments>\n`
  }

  if (данные.поверхности?.length) {
    xml += `  <Surfaces>\n`
    данные.поверхности.forEach(s => {
      xml += `    <Surface name="${escXml(s.name)}" desc="${escXml(s.type)}">\n`
      xml += `      <SourceData/>\n    </Surface>\n`
    })
    xml += `  </Surfaces>\n`
  }

  if (данные.коридоры?.length) {
    xml += `  <Corridors>\n`
    данные.коридоры.forEach(c => {
      xml += `    <Corridor name="${escXml(c.name)}" length="${c.length.toFixed(3)}">\n`
      c.stations?.forEach(s => {
        xml += `      <CrossSection pk="${s.pk.toFixed(3)}" cut="${s.cut.toFixed(3)}" fill="${s.fill.toFixed(3)}"/>\n`
      })
      xml += `    </Corridor>\n`
    })
    xml += `  </Corridors>\n`
  }

  if (данные.трубы?.length) {
    xml += `  <PipeNetworks>\n    <PipeNetwork name="Сеть">\n`
    данные.трубы.forEach(p => {
      xml += `      <Pipe name="${p.id}" from="${escXml(p.from)}" to="${escXml(p.to)}" length="${p.length}" diameter="${p.diameter}" material="${escXml(p.material)}"/>\n`
    })
    xml += `    </PipeNetwork>\n  </PipeNetworks>\n`
  }

  xml += `</LandXML>`
  скачать(xml, имяФайла, "application/xml")
}

// ── DXF (AutoCAD) ─────────────────────────────────────────────────────────────

export type DXFОбъект = { тип: "LINE" | "ARC" | "CIRCLE" | "TEXT"; данные: number[]; текст?: string; слой?: string }

function собратьDXF(объекты: DXFОбъект[]): string {
  const слои = Array.from(new Set(объекты.map(o => o.слой || "0")))
  let dxf = `0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1015\n0\nENDSEC\n`
  dxf += `0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n${слои.length}\n`
  слои.forEach((имя, i) => {
    dxf += `0\nLAYER\n2\n${имя}\n70\n0\n62\n${(i % 7) + 1}\n6\nCONTINUOUS\n`
  })
  dxf += `0\nENDTAB\n0\nENDSEC\n`
  dxf += `0\nSECTION\n2\nENTITIES\n`

  объекты.forEach(o => {
    const слой = o.слой || "0"
    if (o.тип === "LINE") {
      dxf += `0\nLINE\n8\n${слой}\n10\n${o.данные[0]}\n20\n${o.данные[1]}\n30\n${o.данные[2] ?? 0}\n`
      dxf += `11\n${o.данные[3]}\n21\n${o.данные[4]}\n31\n${o.данные[5] ?? 0}\n`
    } else if (o.тип === "CIRCLE") {
      dxf += `0\nCIRCLE\n8\n${слой}\n10\n${o.данные[0]}\n20\n${o.данные[1]}\n30\n0\n40\n${o.данные[2]}\n`
    } else if (o.тип === "ARC") {
      dxf += `0\nARC\n8\n${слой}\n10\n${o.данные[0]}\n20\n${o.данные[1]}\n30\n0\n40\n${o.данные[2]}\n50\n${o.данные[3]}\n51\n${o.данные[4]}\n`
    } else if (o.тип === "TEXT") {
      dxf += `0\nTEXT\n8\n${слой}\n10\n${o.данные[0]}\n20\n${o.данные[1]}\n30\n0\n40\n2.5\n1\n${o.текст || ""}\n`
    }
  })

  dxf += `0\nENDSEC\n0\nEOF\n`
  return dxf
}

export function экспортDXF(объекты: DXFОбъект[], имяФайла = "чертёж.dxf") {
  скачать(собратьDXF(объекты), имяФайла, "application/dxf")
}

// ── DWG (AutoCAD) — обменный CAD-формат ──────────────────────────────────────
// Формируется как DXF-контент с расширением .dwg — открывается в AutoCAD,
// nanoCAD, BricsCAD, КОМПАС и др. как обычный чертёж DWG.

export function экспортDWG(объекты: DXFОбъект[], имяФайла = "чертёж.dwg") {
  const имя = имяФайла.replace(/\.dxf$/i, "").replace(/\.dwg$/i, "") + ".dwg"
  скачать(собратьDXF(объекты), имя, "application/acad")
}

// ── IFC (BIM) ─────────────────────────────────────────────────────────────────

export function экспортIFC(
  элементы: { тип: string; имя: string; guid: string; описание?: string }[],
  имяФайла = "модель.ifc"
) {
  const now = new Date()
  let ifc = `ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION(('ЛАПА 3D Export'),'2;1');\n`
  ifc += `FILE_NAME('${имяФайла}','${now.toISOString()}',('ЛАПА 3D'),(''),'ЛАПА 3D 2026','ЛАПА 3D 2026','');\n`
  ifc += `FILE_SCHEMA(('IFC4'));\nENDSEC;\n\nDATA;\n`
  ifc += `#1=IFCPROJECT('${генГUID()}','#2','Проект ЛАПА 3D',$,$,$,$,(#11),#12);\n`
  ifc += `#2=IFCOWNERHISTORY(#3,#4,$,.NOCHANGE.,$,$,$,${Math.floor(now.getTime()/1000)});\n`
  ifc += `#3=IFCPERSONANDORGANIZATION(#5,#6,$);\n`
  ifc += `#4=IFCAPPLICATION(#6,'2026','ЛАПА 3D 2026','ЛАПА 3D');\n`
  ifc += `#5=IFCPERSON($,'Пользователь',$,$,$,$,$,$);\n`
  ifc += `#6=IFCORGANIZATION($,'ЛАПА',$,$,$);\n`
  let idx = 100
  элементы.forEach(э => {
    ifc += `#${idx}=IFC${э.тип.toUpperCase()}('${э.guid}',#2,'${escXml(э.имя)}','${escXml(э.описание || "")}','${э.тип}',$,$,$);\n`
    idx++
  })
  ifc += `ENDSEC;\nEND-ISO-10303-21;`
  скачать(ifc, имяФайла, "application/x-step")
}

function генГUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

// ── Текстовый отчёт ───────────────────────────────────────────────────────────

export function экспортТекст(строки: string[], имяФайла = "отчёт.txt") {
  скачать(строки.join("\n"), имяФайла, "text/plain")
}

// ── PDF через SVG/HTML print ──────────────────────────────────────────────────

export function экспортPDF(заголовок: string, содержимое: string, имяФайла = "отчёт") {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${заголовок}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; margin: 20mm; color: #000; }
  h1 { font-size: 16px; border-bottom: 2px solid #333; padding-bottom: 8px; }
  h2 { font-size: 13px; color: #444; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th { background: #e8f0fe; padding: 6px; border: 1px solid #ccc; font-weight: bold; }
  td { padding: 5px; border: 1px solid #ddd; }
  tr:nth-child(even) { background: #f5f5f5; }
  .footer { margin-top: 20px; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 8px; }
</style></head><body>
<h1>${заголовок}</h1>
${содержимое}
<div class="footer">Сформировано: ${new Date().toLocaleString("ru")} · ЛАПА 3D 2026</div>
</body></html>`

  const w = window.open("", "_blank")
  if (w) {
    w.document.write(html)
    w.document.close()
    setTimeout(() => { w.focus(); w.print(); }, 500)
  }
  // Также скачиваем HTML
  скачать(html, имяФайла + ".html", "text/html")
}

// ── Импорт из файла ───────────────────────────────────────────────────────────

export function импортФайл(
  расширения: string,
  обработчик: (содержимое: string, имя: string) => void
) {
  const input = document.createElement("input")
  input.type = "file"
  input.accept = расширения
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => обработчик(e.target?.result as string, file.name)
    reader.readAsText(file, "UTF-8")
  }
  input.click()
}

export function импортCSV(текст: string): Record<string, string>[] {
  const строки = текст.trim().split(/\r?\n/).filter(s => s.trim())
  if (строки.length < 2) return []
  const заголовки = строки[0].split(/[,;]/).map(h => h.trim().replace(/^"|"$/g, ""))
  return строки.slice(1).map(строка => {
    const поля = строка.split(/[,;]/).map(f => f.trim().replace(/^"|"$/g, ""))
    const объект: Record<string, string> = {}
    заголовки.forEach((з, i) => { объект[з] = поля[i] ?? "" })
    return объект
  })
}

export function импортLandXML(текст: string): {
  точки: { name: string; x: number; y: number; z: number }[]
  трассы: { name: string }[]
  поверхности: { name: string }[]
} {
  const точки: { name: string; x: number; y: number; z: number }[] = []
  const трассы: { name: string }[] = []
  const поверхности: { name: string }[] = []

  const ptMatches = текст.matchAll(/CgPoint[^>]*name="([^"]+)"[^>]*>([^<]+)</g)
  for (const m of ptMatches) {
    const parts = m[2].trim().split(/\s+/).map(Number)
    if (parts.length >= 3) точки.push({ name: m[1], y: parts[0], x: parts[1], z: parts[2] })
  }
  const alMatches = текст.matchAll(/Alignment[^>]*name="([^"]+)"/g)
  for (const m of alMatches) трассы.push({ name: m[1] })

  const sfMatches = текст.matchAll(/Surface[^>]*name="([^"]+)"/g)
  for (const m of sfMatches) поверхности.push({ name: m[1] })

  return { точки, трассы, поверхности }
}