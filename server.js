const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const geoip = require('geoip-lite');

// Vertraue dem Pinggy-Tunnel, um die echte IP des Nutzers zu sehen
app.set('trust proxy', true);

// Sicherheitsprüfung: Nur Deutschland erlauben
app.use((req, res, next) => {
    // Holt die IP-Adresse des Besuchers
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Sucht das Land zur IP
    const geo = geoip.lookup(ip);

    // Wenn der Zugriff von lokal (dein eigener PC) kommt, immer erlauben
    if (ip === '127.0.0.1' || ip === '::1' || ip.includes('::ffff:127.0.0.1')) {
        return next();
    }

    // Prüfen, ob das Land Deutschland (DE) ist
    if (geo && geo.country === 'DE') {
        next(); // Einlass gewährt
    } else {
        // Alle anderen Länder sehen diese Fehlermeldung
        res.status(403).send('<h1>403 Access Denied</h1><p>Dieser anonyme Chat ist nur aus Deutschland erreichbar.</p>');
    }
});

// Wenn die Prüfung erfolgreich war, zeige den Chat
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Live-Verbindung für Nachrichten
io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });
});

http.listen(3000, () => {
    console.log('Server läuft auf Port 3000 (Nur für DE geöffnet)');
});