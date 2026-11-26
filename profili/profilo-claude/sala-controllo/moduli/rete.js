// RETE
// Indirizzo su cui ascolta la sala e host/origini che il server accetta
const PORTA = 4518;
const HOST = '127.0.0.1';
const ORIGINE = `http://${HOST}:${PORTA}`;
const HOST_AMMESSI = [`${HOST}:${PORTA}`, `localhost:${PORTA}`];
const ORIGINI_AMMESSE = HOST_AMMESSI.map((h) => `http://${h}`);

module.exports = { PORTA, HOST, ORIGINE, HOST_AMMESSI, ORIGINI_AMMESSE };
