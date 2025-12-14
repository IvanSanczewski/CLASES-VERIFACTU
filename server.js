// 1. Cargar variables de entorno y dependencias
require('dotenv').config();
const express = require('express');
const axios = require('axios');

// Configuración inicial
const app = express();
// Usamos el parser de JSON de Express para leer el cuerpo de la petición del webhook
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SIMPLYBOOK_API_URL = 'https://user-api.simplybook.me';

// Placeholder para las funciones que replicarán la lógica de Make.com
// Estas funciones las implementaremos en los siguientes pasos.
const getAuthToken = async () => {
  // TODO: Implementar la lógica de autenticación (Módulos 4, 6, 7 del blueprint)
  console.log('Obteniendo token de autenticación...');
  // Por ahora, devolvemos un token falso
  return 'fake_token';
};

const getBookingDetails = async (token, bookingId) => {
  // TODO: Implementar la obtención de detalles de la reserva (Módulo 2)
  console.log(`Obteniendo detalles para la reserva ID: ${bookingId}`);
  // Devolvemos datos de ejemplo
  return { client_id: 'mock_client_id' };
};

const getClientInfo = async (token, clientId) => {
  // TODO: Implementar la obtención de info del cliente (Módulos 33, 34)
  console.log(`Obteniendo información para el cliente ID: ${clientId}`);
  // Devolvemos datos de ejemplo
  return { nie: 'X1234567Z' };
};


// --- El Webhook ---
// Esta es la URL que recibirá los datos de SimplyBook.me
app.post('/webhook', async (req, res) => {
  console.log('¡Webhook recibido!');
  console.log('Cuerpo de la petición:', req.body);

  // Extraemos el ID de la reserva del cuerpo del webhook
  const bookingId = req.body.booking_id;

  if (!bookingId) {
    console.log('No se encontró booking_id en la petición.');
    return res.status(400).send('Falta booking_id en el cuerpo de la petición.');
  }

  try {
    // Replicamos el flujo de Make.com
    const authToken = await getAuthToken();
    const bookingDetails = await getBookingDetails(authToken, bookingId);
    const clientInfo = await getClientInfo(authToken, bookingDetails.client_id);

    // TODO: Procesar los datos, calcular IVA, etc. y ensamblar el resultado final.
    
    console.log('Proceso completado. Datos finales ensamblados (simulado):');
    const finalData = {
        bookingId: bookingId,
        clientData: clientInfo,
        // ... más datos
    };
    console.log(finalData);

    // Respondemos a SimplyBook.me que todo ha ido bien
    res.status(200).json({ status: 'success', message: 'Datos recibidos y procesados' });

  } catch (error) {
    console.error('Error procesando el webhook:', error);
    res.status(500).json({ status: 'error', message: 'Ocurrió un error en el servidor' });
  }
});


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log('Esperando peticiones de webhook en http://localhost:${PORT}/webhook');
});
