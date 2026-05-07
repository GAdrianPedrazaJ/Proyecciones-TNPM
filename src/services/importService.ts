import * as XLSX from 'xlsx';
import { supabase } from './supabase';

export const importService = {
  processExcel: async (file: File, onProgress?: (p: number) => void) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

          const result = await importService.uploadDataInBatches(jsonData, onProgress);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  },

  uploadDataInBatches: async (rows: any[], onProgress?: (p: number) => void) => {
    console.log(`Iniciando carga masiva optimizada: ${rows.length} filas.`);

    // 1. Extraer nombres únicos para Sedes y Productos
    if (onProgress) onProgress(5);
    const uniqueSedes = [...new Set(rows.map(r => r.Sede?.toString().trim()).filter(Boolean))];
    const uniqueProductos = [...new Set(rows.map(r => r.Flor?.toString().trim()).filter(Boolean))];

    // Bulk Upsert de Sedes
    const { data: sedesDB, error: sErr } = await supabase.from('sedes')
      .upsert(uniqueSedes.map(n => ({ nombre: n })), { onConflict: 'nombre' })
      .select('id_sede, nombre');
    if (sErr) throw sErr;

    // Bulk Upsert de Productos
    const { data: prodsDB, error: pErr } = await supabase.from('productos')
      .upsert(uniqueProductos.map(n => ({ nombre: n })), { onConflict: 'nombre' })
      .select('id_producto, nombre');
    if (pErr) throw pErr;

    const sedesMap = new Map(sedesDB?.map(s => [s.nombre, s.id_sede]));
    const prodsMap = new Map(prodsDB?.map(p => [p.nombre, p.id_producto]));

    // 2. Extraer Colores únicos (Relacionados a Producto)
    if (onProgress) onProgress(20);
    const uniqueColoresMap = new Map<string, { id_producto: string, nombre: string }>();
    rows.forEach(r => {
      const pId = prodsMap.get(r.Flor?.toString().trim());
      const cNom = r.Color?.toString().trim() || 'N/A';
      if (pId) uniqueColoresMap.set(`${pId}|${cNom}`, { id_producto: pId, nombre: cNom });
    });

    const { data: coloresDB, error: cErr } = await supabase.from('colores')
      .upsert(Array.from(uniqueColoresMap.values()), { onConflict: 'id_producto,nombre' as any })
      .select('id_color, id_producto, nombre');
    if (cErr) throw cErr;
    const coloresMap = new Map(coloresDB?.map(c => [`${c.id_producto}|${c.nombre}`, c.id_color]));

    // 3. Extraer Variedades únicas
    if (onProgress) onProgress(40);
    const uniqueVariedadesMap = new Map<string, { id_color: string, nombre: string }>();
    rows.forEach(r => {
      const pId = prodsMap.get(r.Flor?.toString().trim());
      const cId = coloresMap.get(`${pId}|${r.Color?.toString().trim() || 'N/A'}`);
      const vNom = r.Variedad?.toString().trim();
      if (cId && vNom) uniqueVariedadesMap.set(`${cId}|${vNom}`, { id_color: cId, nombre: vNom });
    });

    const { data: variedadesDB, error: vErr } = await supabase.from('variedades')
      .upsert(Array.from(uniqueVariedadesMap.values()), { onConflict: 'id_color,nombre' as any })
      .select('id_variedad, id_color, nombre');
    if (vErr) throw vErr;
    const varsMap = new Map(variedadesDB?.map(v => [`${v.id_color}|${v.nombre}`, v.id_variedad]));

    // 4. Extraer Bloques únicos
    if (onProgress) onProgress(60);
    const uniqueBloquesMap = new Map<string, { id_sede: string, nombre: string }>();
    rows.forEach(r => {
      const sId = sedesMap.get(r.Sede?.toString().trim());
      const bNom = r.Bloque?.toString().trim();
      if (sId && bNom) uniqueBloquesMap.set(`${sId}|${bNom}`, { id_sede: sId, nombre: bNom });
    });

    const { data: bloquesDB, error: bErr } = await supabase.from('bloques')
      .upsert(Array.from(uniqueBloquesMap.values()), { onConflict: 'id_sede,nombre' as any })
      .select('id_bloque, id_sede, nombre');
    if (bErr) throw bErr;
    const bloquesMap = new Map(bloquesDB?.map(b => [`${b.id_sede}|${b.nombre}`, b.id_bloque]));

    // 5. Asignaciones Finales (Bloque <-> Variedad)
    if (onProgress) onProgress(80);
    const asignacionesSet = new Set<string>();
    const asignacionesFinales: { id_bloque: string, id_variedad: string, activo: boolean }[] = [];

    rows.forEach(r => {
      const sId = sedesMap.get(r.Sede?.toString().trim());
      const bId = bloquesMap.get(`${sId}|${r.Bloque?.toString().trim()}`);
      const pId = prodsMap.get(r.Flor?.toString().trim());
      const cId = coloresMap.get(`${pId}|${r.Color?.toString().trim() || 'N/A'}`);
      const vId = varsMap.get(`${cId}|${r.Variedad?.toString().trim()}`);

      if (bId && vId) {
        const key = `${bId}|${vId}`;
        if (!asignacionesSet.has(key)) {
          asignacionesSet.add(key);
          asignacionesFinales.push({ id_bloque: bId, id_variedad: vId, activo: true });
        }
      }
    });

    // Insertar asignaciones en trozos para evitar límites de payload
    const chunkSize = 500;
    for (let i = 0; i < asignacionesFinales.length; i += chunkSize) {
      const chunk = asignacionesFinales.slice(i, i + chunkSize);
      const { error: assignError } = await supabase.from('bloques_variedades')
        .upsert(chunk, { onConflict: 'id_bloque,id_variedad' });

      if (assignError) console.error("Error en batch de asignación:", assignError);

      if (onProgress) {
        const progress = 80 + Math.round((i / asignacionesFinales.length) * 20);
        onProgress(progress);
      }
    }

    if (onProgress) onProgress(100);

    return {
      success: true,
      message: `Importación masiva completada exitosamente. ${rows.length} filas procesadas.`
    };
  }
};
