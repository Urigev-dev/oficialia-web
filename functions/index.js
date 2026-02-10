/**
 * functions/index.js
 * Versión: Cloud Functions V2
 */
const { onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();

// USAMOS us-central1 PORQUE ES COMPATIBLE CON V2
setGlobalOptions({ 
    region: "us-central1", 
    maxInstances: 10 
});

exports.limpiarAdjuntosAlBorrar = onDocumentDeleted("requisiciones/{reqId}", async (event) => {
    // En V2, 'event.data' contiene el snapshot del documento ELIMINADO
    const snap = event.data;

    if (!snap) {
        return; // No hay datos, salimos.
    }

    const data = snap.data();
    const adjuntos = data.adjuntos;

    // Si no hay adjuntos, terminamos.
    if (!adjuntos || !Array.isArray(adjuntos) || adjuntos.length === 0) {
        console.log(`El requerimiento ${event.params.reqId} no tenía adjuntos.`);
        return;
    }

    const bucket = admin.storage().bucket();
    const promises = [];

    console.log(`Iniciando limpieza para req ${event.params.reqId}. Encontrados: ${adjuntos.length} archivos.`);

    for (const archivo of adjuntos) {
        if (archivo.fullPath) {
            const fileRef = bucket.file(archivo.fullPath);
            
            // Promesa de eliminación con manejo de errores individual
            const p = fileRef.delete().then(() => {
                console.log(`Eliminado exitosamente: ${archivo.fullPath}`);
            }).catch((error) => {
                // Ignoramos error 404 (si el archivo ya no existía)
                if (error.code === 404) {
                    console.log(`El archivo ya no existía: ${archivo.fullPath}`);
                } else {
                    console.error(`Error eliminando archivo ${archivo.fullPath}:`, error);
                }
            });
            
            promises.push(p);
        }
    }

    // Esperar a que todas las eliminaciones terminen
    await Promise.all(promises);
    console.log("Limpieza de Storage finalizada.");
});