const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const apiRoutes = require('./routes/api'); 

const app = express();
const PORT = process.env.PORT || 8080;

const ALLOWED_ORIGINS = [
    'https://dockgen-ai.onrender.com', 
    'http://localhost:3000',
    'https://glowing-meme-4j7vj6vqq4rx3qvrx-8080.app.github.dev', 
];

const corsOptions = {
    origin: ALLOWED_ORIGINS, 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', 
    credentials: true, 
    optionsSuccessStatus: 204 
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('Backend server is alive and running!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
