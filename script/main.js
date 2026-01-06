// HANDLES PAGE FUNCTIONALITIES

// Sends a request to the '/api/invoices' endpoint in server.js to retrieve all the invoices
async function fetchInvoices(startDateSearch, endDateSearch){
  // Base url for API calls
  let url = '/api/invoices';

  // Checks if the the filter has been used
  // Fired when no filter is used, at launch
  if (!startDateSearch && !endDateSearch) {
    console.log('NO PARAMS');
    try {
      const response = await fetch(url);
      
      // Check for a posible 400 or 500 error
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      // Return the response parsed into a JSON
      return await response.json();
      
    } catch (error) {
      console.error('Error al capturar las facturas en el servidor.', error);
      throw error;    
    }
  // Asumimos que el usuario utiliza las dos fechas del filtro  
  } else {
    console.log('YES PARAMS');
 
    const searchParams = new URLSearchParams({
      startSearch: startDateSearch, 
      endSearch: endDateSearch
    });

    const query = searchParams.toString(); 
    console.log(query);
    console.log(`${url}?${query}`);

    try {
      const response = await fetch(`${url}?${query}`);
      console.log('FULL URL QUERY:', response);
      if (!response.ok) {
        throw new Error('HTTP error! Status:', response.status);
      }

      return await response.json();

    } catch (error) {
      console.error(error);
      throw error;
    }

  }
};

// Print the invoices
function displayInvoices(invoices){
  // Grab the id where the invoices will be displayed
  const invoicesTable = document.getElementById('facturas-body');
  // Clear up the table to avoid duplicates
  invoicesTable.innerHTML = '';

  // Check if the table is empty
  if (invoices.length === 0) {
    // Create a new row to display a message
    const row = invoicesTable.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 6;
    cell.textContent = 'Todavía no hay facturas para mostrar';
    cell.style.textAlign = 'center';
    return;
  }
  
  invoices.forEach(invoice => {
    const row = invoicesTable.insertRow();

    const cellBookingTime = row.insertCell();
    // Date formatting
    cellBookingTime.textContent = new Date(invoice.created_at).toLocaleString();
    
    const cellClientName = row.insertCell();
    cellClientName.textContent = invoice.client_name;
    
    const cellClientEmail = row.insertCell();
    cellClientEmail.textContent = invoice.client_email;
    
    const cellServiceName = row.insertCell();
    cellServiceName.textContent = invoice.service_name;
    
    const cellAmount = row.insertCell();
    cellAmount.textContent = `${parseFloat(invoice.amount).toFixed(2)} EUR`;
    
    const cellLessonTime = row.insertCell();
    // Date formatting
    cellLessonTime.textContent = new Date(invoice.booking_time).toLocaleString();
  })
};

// Al cargar la página, se dispara una función asíncrona
document.addEventListener('DOMContentLoaded', async() => {
  try {
    // Wait for the returned data from fetchInvoices
    const invoices = await fetchInvoices();
    // Sort the array starting from the newest booking
    invoices.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    console.log('INVOICES:', invoices);
    displayInvoices(invoices);
    
  } catch (error) {
    // Create a new cell to display a possible error
    const invoicesTable = document.getElementById('facturas-body');
    const row = invoicesTable.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 6;
    cell.textContent = 'Error al cargar las facturas';
    cell.style.textAlign = 'center';
    cell.style.color = 'crimson';
  }
});

// Cuando el usuario hace click en Buscar el evento se dispara
document.querySelector('.filters').addEventListener('submit', async (event)=>{ // Added async
  event.preventDefault()

  // Leémos los valores de las fechas para la búsqueda introducidas por el usuario
  const startSearch = document.querySelector('input[name="start"]').value;
  const endSearch = document.querySelector('input[name="end"]').value;
  
  try {
    const invoices = await fetchInvoices(startSearch, endSearch);
    invoices.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Sort invoices
    console.log('FILTERED INVOICES:', invoices);
    displayInvoices(invoices);
    
  } catch (error) {
    console.error('Error fetching and displaying filtered invoices:', error);
    // Display error message to user
    const invoicesTable = document.getElementById('facturas-body');
    invoicesTable.innerHTML = ''; // Clear previous results
    const row = invoicesTable.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 6;
    cell.textContent = 'Error al cargar las facturas filtradas.';
    cell.style.textAlign = 'center';
    cell.style.color = 'crimson';
  }
})




