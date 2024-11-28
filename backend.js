const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let points = []; // Array to store GIS points
let mapSettings = {
    center: { lat: 40.7128, lng: -74.0060 }, // Default: New York City
    zoom: 10 // Default zoom level
};

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes

// Get all points
app.get('/points', (req, res) => {
    res.json(points);
});

// Add a new point
app.post('/points', (req, res) => {
    const { id, lat, lng, radius, label } = req.body;
    if (!id || lat == null || lng == null || radius == null || !label) {
        return res.status(400).json({ message: 'All fields are required: id, lat, lng, radius, label' });
    }
    if (points.some(point => point.id === id)) {
        return res.status(400).json({ message: 'Point with this ID already exists' });
    }
    const point = { id, lat, lng, radius, label };
    points.push(point);
    io.emit('updatePoints', points);
    res.status(201).json({ message: 'Point added', point });
});

// Delete a point by ID
app.delete('/points/:id', (req, res) => {
    const { id } = req.params;
    const initialLength = points.length;
    points = points.filter(point => point.id !== id);
    if (points.length === initialLength) {
        return res.status(404).json({ message: 'Point not found' });
    }
    io.emit('updatePoints', points);
    res.status(200).json({ message: 'Point deleted' });
});

// Get current map settings
app.get('/map-settings', (req, res) => {
    res.json(mapSettings);
});

// Update map settings
app.post('/map-settings', (req, res) => {
    const { center, zoom } = req.body;
    if (!center || typeof zoom !== 'number' || center.lat == null || center.lng == null) {
        return res.status(400).json({ message: 'Invalid map settings. Provide center (lat, lng) and zoom.' });
    }
    mapSettings = { center, zoom };
    res.status(200).json({ message: 'Map settings updated.', mapSettings });
});

// WebSocket connection
io.on('connection', (socket) => {
    console.log('A client connected');
    socket.emit('updatePoints', points);
    socket.on('disconnect', () => {
        console.log('A client disconnected');
    });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
