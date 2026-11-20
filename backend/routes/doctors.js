const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [doctors] = await db.execute(
      'SELECT doctor_id, full_name, specialty, consultation_fee, start_time, end_time, slot_minutes FROM Doctors WHERE is_active = TRUE ORDER BY full_name'
    );
    res.json(doctors);
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [doctors] = await db.execute(
      'SELECT doctor_id, full_name, specialty, consultation_fee, start_time, end_time, slot_minutes FROM Doctors WHERE doctor_id = ? AND is_active = TRUE',
      [req.params.id]
    );
    if (!doctors.length) return res.status(404).json({ message: 'Doctor not found.' });
    res.json(doctors[0]);
  } catch (error) { next(error); }
});

module.exports = router;
