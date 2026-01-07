# Explicación del archivo `server.js`

Este archivo crea un pequeño servidor web diseñado para recibir notificaciones (webhooks) desde el sistema de reservas **SimplyBook.me**. Cuando SimplyBook.me notifica que se ha creado una nueva reserva, este servidor se encarga de recopilar todos los detalles de esa reserva, procesarlos y prepararlos como si fueran para una factura.

Aquí está el desglose de lo que hace:

### 1. Configuración Inicial

- **Carga de dependencias:**
  - `require('dotenv').config();`: Carga las variables de entorno desde un archivo `.env`. Aquí se guardan datos sensibles como contraseñas o claves de API para no exponerlas en el código.
  - `require('express')`: Importa Express, que es el framework para construir el servidor web en Node.js.
  - `require('axios')`: Importa Axios, un cliente HTTP que se usa para hacer peticiones a la API de SimplyBook.me.
- **Inicialización de Express:**
  - `const app = express();`: Crea una instancia de la aplicación Express.
  - `app.use(express.json());`: Configura el servidor para que pueda entender y procesar cuerpos de petición en formato JSON, que es como SimplyBook.me enviará la información.
- **Definición de constantes:**
  - `PORT`: Define el puerto en el que correrá el servidor (por defecto, el `3000`).
  - `SIMPLYBOOK_API_URL`: La URL base de la API de SimplyBook.me.

### 2. Funciones de Comunicación con SimplyBook.me

El archivo define tres funciones asíncronas para comunicarse con la API de SimplyBook.me:

- **`getAuthToken()`:**

  1. Lee las credenciales (compañía, usuario y contraseña) desde las variables de entorno (`process.env`).
  2. Envía una petición `POST` a la ruta `/login` de la API de SimplyBook.me para solicitar un **token de autenticación temporal**.
  3. Si las credenciales son correctas, devuelve el token. Este token es necesario para hacer las siguientes llamadas a la API.

- **`getBookingDetails(token, bookingId)`:**

  1. Recibe el token de autenticación y un ID de reserva (`bookingId`).
  2. Llama a la API de SimplyBook.me para obtener todos los detalles asociados a esa reserva específica (como el nombre del evento, el precio, y el ID del cliente).

- **`getClientInfo(token, clientId)`:**
  1. Recibe el token y un ID de cliente (`clientId`).
  2. Pide a la API la información detallada del cliente, como sus datos de contacto y campos personalizados (por ejemplo, el NIF/NIE).

### 3. El Webhook: `/webhook`

Esta es la parte central del servidor. Es una ruta (`endpoint`) que se queda esperando a que SimplyBook.me le envíe una petición `POST`.

1.  **Recepción de la notificación:**

    - `app.post('/webhook', ...)`: Define que cuando llegue una petición `POST` a la URL `/webhook`, se ejecute la lógica interna.
    - El servidor recibe un cuerpo de petición (un JSON) que contiene `booking_id`, el identificador de la reserva que activó la notificación.

2.  **Procesamiento de datos (orquestación):**

    - **Paso 1: Obtener datos de la API.**
      - Llama a `getAuthToken()` para autenticarse.
      - Con el token, llama a `getBookingDetails()` para obtener los detalles de la reserva.
      - De esos detalles, extrae el `client_id` y lo usa para llamar a `getClientInfo()`.
    - **Paso 2: Ensamblar los datos del cliente.**
      - Crea un objeto `clientData` con la información relevante del cliente (ID, nombre, email, teléfono, NIF/NIE, dirección, etc.). Asume que el NIF/NIE está en un campo personalizado (`client_field_4`).
    - **Paso 3: Procesar las clases.**
      - El código diferencia entre una reserva de una sola clase y un "bono" de varias clases.
      - Si es un bono (`batch_bookings`), itera sobre cada clase del bono y vuelve a llamar a `getBookingDetails` para obtener los detalles específicos de cada una.
      - Si es una clase única, simplemente la procesa. Al final, tiene una lista (`lessonsToProcess`) con todas las clases que deben facturarse.
    - **Paso 4: Calcular datos para la factura.**
      - Para cada clase en la lista, calcula la base imponible y el IVA a partir del precio total (asume un IVA del 21%).
      - Guarda estos datos calculados en una nueva lista llamada `invoiceLessons`.
    - **Paso 5: Construir el objeto final.**
      - Crea un objeto `finalData` que contiene toda la información estructurada: los datos del cliente, la lista de clases con sus detalles de facturación y los datos de la reserva original.
      - Imprime este objeto final en la consola.

3.  **Respuesta al webhook:**
    - Si todo el proceso fue exitoso, el servidor responde a SimplyBook.me con un código `200 OK` para confirmar que la notificación se ha procesado correctamente.
    - Si ocurre cualquier error durante el proceso (por ejemplo, credenciales incorrectas, un ID no encontrado, etc.), se captura el error, se imprime en la consola y se responde con un código `500 Internal Server Error`.

### 4. Inicio del Servidor

- **`app.listen(PORT, ...)`:**
  - Pone en marcha el servidor para que empiece a escuchar peticiones en el puerto especificado (ej. `http://localhost:3000`).
  - Muestra un mensaje en la consola indicando que el servidor está listo y esperando.

### 5. Funciones del Frontend (`main.js`)

Aunque este archivo es del servidor, es útil entender cómo interactuaba el frontend con él.

- **`fetchInvoice()` (Función Antigua/Deprecada):**

  - **Objetivo:** Esta función estaba diseñada para obtener y mostrar los detalles de **una sola factura**, la última que había sido procesada por el webhook.
  - **Funcionamiento:**
    1. Hacía una petición `GET` al endpoint `/api/last-processed-data` del servidor.
    2. Este endpoint devolvía un objeto JSON con los datos del último cliente y sus lecciones procesadas.
    3. La función `printInvoice()` tomaba estos datos y los inyectaba en divs específicos del HTML (`.name`, `.email`, etc.).
  - **Limitación:** Solo podía mostrar la información de la última reserva recibida, no un historial.

- **`fetchAndDisplayInvoices()` (Función Nueva):**

  - **Objetivo:** Reemplaza a `fetchInvoice` para obtener y mostrar un **listado completo de todas las facturas** almacenadas en la base de datos.
  - **Funcionamiento:**
    1. Hace una petición `GET` al nuevo endpoint `/api/invoices`.
    2. Este endpoint consulta la base de datos Supabase, obtiene **todos** los registros de la tabla `invoices` y los devuelve como un array de objetos JSON, ordenados por fecha.
    3. La función toma el `tbody` de la tabla HTML (con id `facturas-body`).
    4. Itera sobre el array de facturas recibido. Por cada factura, crea una nueva fila (`<tr>`) en la tabla.
    5. Dentro de cada fila, crea las celdas (`<td>`) correspondientes para el nombre del cliente, email, servicio, importe y fecha.
    6. Finalmente, añade cada fila a la tabla, mostrando así un historial completo y dinámico de facturas.
  - **Ventaja:** Proporciona una vista completa de todos los datos, no solo del último elemento.

> ok, I need guidance with it. Do I have to create another app.get or modify the one existing? I have
> duplicated the original app.get but I understand that the url for the call needs to be formatted
> diferently. I guess it will still be asyncronous. I have no idea about the supabase methods. Also,
> we ordered the original one according to booking_time, but since we sort the array in main.js, do we
> need it here?

✦ You're asking all the right questions. Let's tackle them one by one.

1. One app.get or Two?

You only need to modify the one that already exists.

An Express route like app.get('/api/invoices', ...) will handle requests for both /api/invoices
(with no filter) and /api/invoices?startSearch=...&endSearch=... (with the filter). You don't need a
separate one. The logic to handle both cases will go inside this single function.

2. How to Handle Both Cases?

Inside your app.get, you'll check if the filter parameters exist on the request. Express makes this
easy: the query parameters are available in the req.query object.

    1 app.get('/api/invoices', async (req, res) => {
    2   // Extract the dates from the URL's query string
    3   const { startSearch, endSearch } = req.query;
    4
    5   if (startSearch && endSearch) {
    6     // TODO: Run a query with a date filter
    7     console.log('Filtering between', startSearch, 'and', endSearch);
    8   } else {
    9     // This is the original logic: run a query to get ALL invoices

10 }
11
12 // ...
13 });

3. Supabase Filtering Methods

You are correct, the function remains asynchronous because you're still talking to a database.

You don't build the filter into the URL. Instead, you build the query using Supabase's methods. The
two you need are:

- .gte('column_name', value): "greater than or equal to"
- .lte('column_name', value): "less than or equal to"

You can chain these methods to build your query. Here's the concept:

    1 // Inside the if (startSearch && endSearch) block
    2
    3 // 1. Start with your base query
    4 let query = supabase.from('invoices').select('*');
    5
    6 // 2. Add the date filters
    7 query = query.gte('booking_time', startSearch); // Filter for dates AFTER startSearch
    8 query = query.lte('booking_time', endSearch);   // Filter for dates BEFORE endSearch
    9

10 // 3. Now, execute the fully built query
11 const { data, error } = await query;

How would you integrate this logic into your existing app.get to handle both the filtered and
non-filtered cases?

4. To Sort on the Server or Client?

This is an excellent question about performance and best practices.

Answer: It's generally better to sort on the database server (.order() in Supabase).

Why? The database is highly optimized for operations like sorting. By doing it on the server, you ensure the data arrives on the client already in the correct order. While sorting on the client works fine for small amounts of data, it can become slow if you have thousands of invoices.

Since your server already sorts the data correctly, you can safely remove the invoices.sort(...)
line from main.js. It's redundant.

1.  The Supabase Query
    The const { data, error } = await supabase... block is how you interact with the database. Every Supabase client query returns an object that contains two possible keys:
    data (if the query was successful) or error (if it failed). We await the result since it's an asynchronous operation.

2.  Date Filters: `.gte()` and `.lte()`
    This is the core of the filtering logic. We chain these methods onto our select query.

    - .gte('booking_time', startSearch): gte stands for Greater Than or Equal to. This tells Supabase to only find records where the value in the booking_time column is on or after the startSearch date you provided.
    - .lte('booking_time', endSearch): lte stands for Less Than or Equal to. This further filters the results, ensuring the booking_time is also on or before the endSearch date.

3.  Error Check: `if (error)`
    After the query is complete, we immediately check if the error object returned by Supabase has anything in it. If it does, it means the database query itself failed. We then throw error;, which immediately stops the execution of the try block and jumps to the catch block.

4.  Success Response: `res.status(200).json(data)`
    If the error object is empty, it means the query was successful and data contains our filtered list of invoices. This line sends that data back to the browser with a "200 OK" status, where main.js will receive it.

5.  The `catch` block
    If any error is thrown within the try block (either from our throw error line or from another unexpected failure), the catch block is executed. It does two things:

    - res.status(500).json(...): It sends a generic "500 Internal Server Error" response to the browser. This prevents sensitive error details from being exposed to the end-user and tells main.js that the request failed.

### Last qstn in previous conversation

> I see, but I even was planning to delete that raw_data col

✦ Okay, that's a critical piece of information. Thank you for telling me.

If you delete the raw_data column, my previous solution of peeking inside it for the booking_hash will no longer work.

In that case, your initial assumption was correct: we will need to add a new column to your table.

This is a good database practice. Instead of storing a large, raw JSON object, you store only the specific, important
fields you need.

Here is the new plan:

1.  Your Task: You will need to go into your Supabase project dashboard, select the invoices table, and add a new
    column. I recommend naming it booking_hash and setting its type to text. I cannot do this step for you.

2.  My Task: Once you have added that column, I will modify server.js to:
    - Save the booking_hash from SimplyBook into your new booking_hash column.
    - Check for duplicates by querying this new, dedicated column, which is much more efficient than searching inside
      a JSON field.

This approach aligns with your goal of cleaning up the table and is a more robust, long-term solution.

Let me know when you have added the booking_hash column, and I will proceed with the necessary code changes.
