const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const roastRoutes = require('./routes/roast');
app.use('/api/roast', roastRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Roast Me Daddy API Running');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
