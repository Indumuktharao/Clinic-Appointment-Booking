require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const doctorsRouter = require('./routes/doctors');
const appointmentsRouter = require('./routes/appointments');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Clinic Appointment Booking API is running.'));
app.get('/api/health', async (req, res, next) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) { next(error); }
});

app.use('/api/doctors', doctorsRouter);
app.use('/api/appointments', appointmentsRouter);

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Server error. Check the backend terminal and database settings.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  try {
    await db.query('SELECT 1');
    console.log('MySQL connected.');
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
  }
});
