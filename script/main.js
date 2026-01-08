// HANDLES PAGE FUNCTIONALITIES

// Fetch data from supabase using filters only when the User adds them
// If no date is added, a preset will be applied

async function fetchInvoices(startDate, endDate) {
  const url = '/api/invoices';
  const params = new URLSearchParams();

  // Si solo se provee fecha de inicio, se busca hasta el día de hoy.
  if (startDate && !endDate) {
    endDate = new Date().toISOString().slice(0, 10);
  }

  // Si solo se provee fecha de fin, se busca desde el inicio del año actual.
  if (!startDate && endDate) {
    const year = new Date(endDate).getFullYear();
    startDate = `${year}-01-01`;
  }

  if (startDate) {
    params.append('startSearch', startDate);
  }

  if (endDate) {
    params.append('endSearch', endDate);
  }

  const query = params.toString() ? `${url}?${params.toString()}` : url;
  console.log('25 - QUERY URL:', query);

  try {
    const response = await fetch(query);
    if(!response.ok){
      throw new Error (`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    console.error('Error fetching invoices: ', error);
    throw error;
  }
}

// Print the invoices
function displayInvoices(invoices){
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
    // invoices.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    console.log('INVOICES:', invoices);
    displayInvoices(invoices);
    
  } catch (error) {
    // Create a new cell to display a possible error
    // const invoicesTable = document.getElementById('facturas-body');
    const row = invoicesTable.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 6;
    cell.textContent = 'Error al cargar las facturas';
    cell.style.textAlign = 'center';
    cell.style.color = 'crimson';
  }
});

// Cuando el usuario hace click en Buscar el evento se dispara
document.querySelector('.filters').addEventListener('submit', async (event)=>{ 
  event.preventDefault()
  
  // Leémos los valores de las fechas para la búsqueda introducidas por el usuario
  const startSearch = document.querySelector('input[name="start"]').value;
  const endSearch = document.querySelector('input[name="end"]').value;
  console.log('154 - START SEARCH: ', startSearch);
  console.log('155 - END SEARCH: ', endSearch);
  
  try {
    const invoices = await fetchInvoices(startSearch, endSearch);
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
});