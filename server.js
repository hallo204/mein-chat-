const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const geoip = require('geoip-lite');

// WICHTIG: Damit Render die echte IP-Adresse des Nutzers korrekt weitergibt
app.set('trust proxy', true);

app.use((req, res, next) => {
    // Holt die IP-Adresse des Besuchers über den Render-Proxy
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // Falls mehrere IPs durchgereicht werden (z.B. bei Render), nimm die erste echte
    if (ip && ip.includes(',')) {
        ip = ip.split(',')[0].trim();
    }

    // Wenn der Zugriff von lokal kommt, immer erlauben
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1')) {
        return next();
    }
    
    const geo = geoip.lookup(ip);

    // Erlaube Deutschland (DE) – und falls die IP nicht zugeordnet werden kann, lassen wir sie zur Sicherheit durch
    if (!geo || geo.country === 'DE') {
        next(); 
    } else {
        res.status(403).send('<h1>403 Access Denied</h1><p>Dieser anonyme Chat ist nur aus Deutschland erreichbar.</p>');
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });
});

// Nutzt den Port, den Render vorgibt, oder lokal 3000
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});