Paso 1: Modificar server.js (Backend)

Tu server.js actualmente recibe el webhook de SimplyBook.me y procesa los datos, pero solo los
imprime en la consola. Necesitamos hacer dos cosas:

1.  Almacenar la `finalData`: Guarda la finalData procesada en una variable global o en alguna estructura de datos temporal después de que se haya procesado un webhook.
2.  Crear una nueva ruta (`endpoint`) a la que tu frontend pueda hacer una petición para obtener esa finalData.

Indicaciones para `server.js`:

1.  Declara una variable global fuera de cualquier función para almacenar la última finalData procesada.
2.  Asigna la `finalData` a esa variable después de que se haya calculado en el webhook.
3.  Crea una nueva ruta `GET` que simplemente devuelva el contenido de esa variable.

    1 // En server.js, cerca del inicio o de las constantes
    2 let lastProcessedData = null; // Variable para almacenar los últimos datos procesados
    3
    4 // ... (tu código existente) ...
    5
    6 // Dentro de la ruta /webhook, después de que se calcula finalData y antes de res.status(200)
    7 // Por ejemplo, justo antes de: console.log('Datos finales para la factura:',
    JSON.stringify(finalData, null, 2));
    8 lastProcessedData = finalData; // ¡Almacenamos los datos!
    9

10 // ... (resto de la ruta /webhook) ...
11
12 // **NUEVO CÓDIGO:** Crea una nueva ruta para que el frontend pueda obtener los datos
13 app.get('/api/last-processed-data', (req, res) => {
14 if (lastProcessedData) {
15 res.status(200).json(lastProcessedData);
16 } else {
17 res.status(404).json({ message: 'No hay datos procesados disponibles aún.' });
18 }
19 });
20
21 // ... (inicio del servidor) ...

---

Paso 2: Organizar main.js (Frontend)

Tu main.js (que se ejecuta en el navegador) será responsable de:

1.  Hacer una petición HTTP a la nueva ruta (/api/last-processed-data) de tu server.js.
2.  Recibir los datos en formato JSON.
3.  Actualizar el HTML de tu página para mostrar esa información.

Indicaciones para `main.js`:

1.  Espera a que el DOM esté cargado antes de intentar manipular elementos HTML.
2.  Usa la API `fetch` para hacer una petición GET a tu backend.
3.  Procesa la respuesta y actualiza el contenido de un elemento HTML específico (por ejemplo, un
    div con un id que hayas definido en tu index.html).

1 // En main.js
2
3 document.addEventListener('DOMContentLoaded', () => {
4 // Función para obtener y mostrar los datos del servidor
5 async function fetchAndDisplayData() {
6 try {
7 // Hacer la petición GET a la nueva ruta de tu backend
8 const response = await fetch('/api/last-processed-data');
9

10 if (!response.ok) {
11 throw new Error(`Error HTTP: ${response.status}`);
12 }
13
14 const data = await response.json(); // Parsea la respuesta JSON
15
16 console.log('Datos recibidos del servidor:', data);
17
18 // Ahora, muestra estos datos en tu HTML
19 const dataDisplayElement = document.getElementById('data-display'); // Asume que tienes un

<div id="data-display"> en tu index.html
20
21 if (dataDisplayElement) {
22 // Puedes formatear los datos como quieras. Aquí un ejemplo simple:
23 dataDisplayElement.innerHTML = `   24           <h2>Última Reserva Procesada:</h2>
   25           <p><strong>Cliente:</strong> ${data.client.name}</p>
   26           <p><strong>Email:</strong> ${data.client.email}</p>
   27           <p><strong>NIF/NIE:</strong> ${data.client.taxId}</p>
   28           <h3>Clases:</h3>
   29           <ul>
   30             ${data.lessons.map(lesson =>`
31 <li>
32 ${lesson.lessonName} (${new Date(lesson.dateTime).toLocaleString()})<br>
33 Precio: ${lesson.totalPrice}€ (Base: ${lesson.taxBase}€, IVA: ${lesson.taxAmount
}€)
34 </li>
35 `).join('')}
   36           </ul>
   37         `;
38 } else {
39 console.error("Elemento con ID 'data-display' no encontrado en el DOM.");
40 }
41
42 } catch (error) {
43 console.error('Error al obtener o mostrar los datos:', error);
44 const dataDisplayElement = document.getElementById('data-display');
45 if (dataDisplayElement) {
46 dataDisplayElement.innerHTML = `<p style="color: red;">Error al cargar los datos:
      ${error.message}</p>`;
47 }
48 }
49 }
50
51 // Llama a la función cuando la página cargue
52 fetchAndDisplayData();
53
54 // Opcional: Podrías querer recargar los datos cada cierto tiempo
55 // setInterval(fetchAndDisplayData, 5000); // Recargar cada 5 segundos
56 });

---

Paso 3: index.html (para mostrar los datos)

Asegúrate de que tu index.html tenga un elemento donde main.js pueda inyectar los datos.

    1 <!-- En tu index.html -->
    2 <!DOCTYPE html>
    3 <html lang="es">
    4 <head>
    5     <meta charset="UTF-8">
    6     <meta name="viewport" content="width=device-width, initial-scale=1.0">
    7     <title>Datos de Reservas SimplyBook.me</title>
    8     <link rel="stylesheet" href="styles.css">
    9 </head>

10 <body>
11 <h1>Mis Reservas Procesadas</h1>
12
13 <div id="data-display">
14 <!-- Aquí es donde main.js inyectará los datos -->
15 Cargando datos...
16 </div>
17
18 <script src="script/main.js"></script>
19 </body>
20 </html>

---

Resumen del Flujo:

1.  SimplyBook.me envía un webhook POST a /webhook en tu server.js.
2.  Tu server.js procesa esa información y guarda la finalData en la variable lastProcessedData.
3.  Tu navegador carga index.html, que a su vez carga script/main.js.
4.  main.js ejecuta la función fetchAndDisplayData().
5.  fetchAndDisplayData() hace una petición GET a /api/last-processed-data en tu server.js.
6.  Tu server.js le devuelve la lastProcessedData almacenada a main.js.
7.  main.js toma esos datos y los inserta en el <div id="data-display"> de tu index.html.

¡Con estos pasos básicos, deberías poder ver la información procesada de tu backend en el frontend!
