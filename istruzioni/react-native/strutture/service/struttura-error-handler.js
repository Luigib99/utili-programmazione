// errorHandler.js

export const handleApiError = (error) => {
  let message = "Si è verificato un errore imprevisto.";
  let status = error.response ? error.response.status : null;
  let backendCode = null;

  if (error.response) {
    //dati dell'errore di backend
    const backendData = error.response.data;
    
    if (backendData && backendData.message) {
        message = backendData.message;
        backendCode = backendData.code;
    } else {
        switch (status) {
          case 400: message = "Dati non validi."; break;
          case 401: message = "Sessione scaduta."; break;
          case 403: message = "Permesso negato."; break;
          case 404: message = "Risorsa non trovata."; break;
          case 500: message = "Errore del server."; break;
        }
    }
  } else if (error.request) {
    message = "Nessuna risposta dal server. Controlla la connessione.";
  }

  return { message, status, backendCode };
};