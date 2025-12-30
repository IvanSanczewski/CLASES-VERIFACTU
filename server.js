// 1. Cargar variables de entorno y dependencias
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Configuración para usar Express y su parser de JSON para leer el cuerpo de la petición del webhook
const app = express();
app.use(express.json());
app.use(express.static(__dirname));


// Inicialización de SUPABASE
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


// Definición de constantes
const PORT = process.env.PORT || 3000;
const SIMPLYBOOK_API_URL = 'https://user-api.simplybook.me';


// Placeholder para las funciones que replicarán la lógica de Make.com
// Estas funciones las implementaremos en los siguientes pasos.
const getAuthToken = async () => {
  console.log('Obteniendo token de autenticación...');

  const { SIMPLYBOOK_COMPANY, SIMPLYBOOK_API_USER, SIMPLYBOOK_API_PASSWORD } = process.env;

  if (!SIMPLYBOOK_COMPANY || !SIMPLYBOOK_API_USER || !SIMPLYBOOK_API_PASSWORD) {
    throw new Error('Faltan credenciales de SimplyBook.me en el fichero .env');
  }

  try {
    const response = await axios.post(
      `${SIMPLYBOOK_API_URL}/login`,
      {
        jsonrpc: '2.0',
        method: 'getUserToken',
        params: [SIMPLYBOOK_COMPANY, SIMPLYBOOK_API_USER, SIMPLYBOOK_API_PASSWORD],
        id: 1,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const token = response.data.result;
    if (token) {
      console.log('Token de autenticación obtenido con éxito.');
      return token;
    } else {
      // Si la respuesta no contiene un token, es un error de autenticación
      throw new Error('No se pudo obtener el token. Revisa las credenciales en .env. Respuesta: ' + JSON.stringify(response.data));
    }
  } catch (error) {
    console.error('Error durante la autenticación en SimplyBook.me:', error.message);
    throw new Error('Fallo en la autenticación con SimplyBook.me.');
  }
};

const getBookingDetails = async (token, bookingId) => {
  console.log(`Obteniendo detalles para la reserva ID: ${bookingId}`);
  const { SIMPLYBOOK_COMPANY } = process.env;

  try {
    const response = await axios.post(
      `${SIMPLYBOOK_API_URL}/admin`,
      {
        jsonrpc: '2.0',
        method: 'getBookingDetails',
        params: [bookingId],
        id: 1,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Token': token,
          'X-Company-Login': SIMPLYBOOK_COMPANY,
        },
      }
    );

    const bookingData = response.data.result;
    if (bookingData) {
      console.log('Detalles de la reserva obtenidos con éxito.');
      return bookingData;
    } else {
      throw new Error('La respuesta de getBookingDetails no contenía datos. Respuesta: ' + JSON.stringify(response.data));
    }
  } catch (error) {
    console.error(`Error obteniendo detalles de la reserva ${bookingId}:`, error.message);
    throw new Error(`Fallo al obtener los detalles de la reserva ${bookingId}.`);
  }
};

const getClientInfo = async (token, clientId) => {
  console.log(`Obteniendo información para el cliente ID: ${clientId}`);
  const { SIMPLYBOOK_COMPANY } = process.env;

  try {
    const response = await axios.post(
      `${SIMPLYBOOK_API_URL}/admin`,
      {
        jsonrpc: '2.0',
        method: 'getClientInfoZapier',
        params: { id: clientId }, // El parámetro es un objeto con el id
        id: 1,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Token': token,
          'X-Company-Login': SIMPLYBOOK_COMPANY,
        },
      }
    );

    const clientData = response.data.result;
    if (clientData) {
      console.log('Información del cliente obtenida con éxito.');
      return clientData;
    } else {
      throw new Error('La respuesta de getClientInfo no contenía datos. Respuesta: ' + JSON.stringify(response.data));
    }
  } catch (error) {
    console.error(`Error obteniendo información del cliente ${clientId}:`, error.message);
    throw new Error(`Fallo al obtener la información del cliente ${clientId}.`);
  }
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
    // 1. OBTENER DATOS CRUDOS DE LA API
    console.log('--- INICIO DEL PROCESO DE DATOS ---');
    const authToken = await getAuthToken();
    const bookingDetails = await getBookingDetails(authToken, bookingId);
    // El client_id viene en la respuesta de getBookingDetails
    const clientId = bookingDetails.client_id;
    
    if (!clientId) {
      throw new Error('No se encontró un client_id en los detalles de la reserva.');
    }

    const clientInfo = await getClientInfo(authToken, clientId);

    // 2. ENSAMBLAR DATOS DEL CLIENTE
    console.log('Ensamblando datos del cliente...');
    const taxId = clientInfo.client_field_4; // Asumimos que el NIE/NIF está en el campo 4
    
    if (!taxId) {
        console.warn(`ADVERTENCIA: No se encontró NIF/NIE (client_field_4) para el cliente ${clientId}.`);
    }
    
    const clientData = {
      id: clientId,
      name: bookingDetails.client_name,
      email: bookingDetails.client_email,
      phone: bookingDetails.client_phone,
      taxId: taxId || 'N/A', // NIF/NIE
      address: `${bookingDetails.client_address1} - ${bookingDetails.client_address2}`
      // postalCode: bookingDetails.client_address2,
    };
    console.log('Datos del cliente ensamblados:', clientData);

    // 3. PROCESAR CADA CLASE (individual o varias)
    console.log('Procesando clases...');
    const lessonsToProcess = [];
    // Comprobamos el número de clases reservadas

    if (bookingDetails.batch_bookings && bookingDetails.batch_bookings.length > 0) {
      console.log(`El cliente ha reservado ${bookingDetails.batch_bookings.length} clases. Obteniendo detalles de cada una...`);
      for (const batchItem of bookingDetails.batch_bookings) {
        const lessonDetail = await getBookingDetails(authToken, batchItem.id);
        lessonsToProcess.push(lessonDetail);
      }
    } else {
      console.log('Es una clase individual.');
      lessonsToProcess.push(bookingDetails);
    }

    // 4. CALCULAR DATOS DE FACTURA PARA CADA CLASE
    const invoiceLessons = [];
    const TAX_RATE = 1.21; // 21% de IVA

    console.log('Calculando datos de factura para cada clase...');
    for (const lesson of lessonsToProcess) {
      const totalPrice = parseFloat(lesson.event_price);
      if (isNaN(totalPrice)) {
          console.warn(`ADVERTENCIA: El precio para la clase ${lesson.event_name} no es un número válido.`);
          continue;
      }
      
      const taxBase = totalPrice / TAX_RATE;
      const taxAmount = totalPrice - taxBase;

      invoiceLessons.push({
        lessonId: lesson.id,
        lessonName: lesson.event_name,
        dateTime: lesson.start_date_time,
        totalPrice: totalPrice.toFixed(2),
        taxBase: taxBase.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        // Guardamos el objeto completo de la lección para referencia
        rawLessonData: lesson
      });
    }
    console.log('Clases procesadas para la factura:', invoiceLessons);

    // 5. CONSTRUIR EL OBJETO DE DATOS FINAL Y GUARDAR EN SUPABASE
    console.log('Guardando datos en Supabase...');
    const recordsToInsert = invoiceLessons.map(lesson => ({
      client_name: clientData.name,
      client_email: clientData.email,
      service_name: lesson.lessonName,
      amount: lesson.totalPrice,
      tax_base: lesson.taxBase,
      tax_amount: lesson.taxAmount,
      booking_time: lesson.dateTime,
      raw_data: lesson.rawLessonData
    }));

    const { data: insertData, error: insertError } = await supabase
      .from('invoices')
      .insert(recordsToInsert);

    if (insertError) {
      console.error('Error guardando en Supabase:', insertError);
      // Aunque falle nuestra base de datos, es importante responder 200 a SimplyBook para que no siga reintentando el webhook. Error registrado en nuestros logs.
    } else {
      console.log('Datos guardados en Supabase con éxito!');
    }
    
    // Guardamos los datos en la variable local para mantener la funcionalidad del endpoint /api/last-processed-data
    lastProcessedData = {
        client: clientData,
        lessons: invoiceLessons
    };

    console.log('--- PROCESO COMPLETADO ---');

    // Respondemos a SimplyBook.me que todo ha ido bien
    res.status(200).json({ status: 'success', message: 'Datos recibidos y procesados' });

  } catch (error) {
    console.error('Error procesando el webhook:', error);
    res.status(500).json({ status: 'error', message: 'Ocurrió un error en el servidor' });
  }

});



app.get('/api/last-processed-data', (req, res) =>{
  if (lastProcessedData){
    res.status(200).json(lastProcessedData);
  } else {
    res.status(400).json({ message: 'Aún no hay datos procesados disponibles.' });
  }
})


app.get('/api/invoices', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('booking_time', { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`Esperando peticiones de webhook en http://localhost:${PORT}/webhook`);
});