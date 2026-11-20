const express = require('express');
const db = require('../config/db');
const checkOverlap = require('../middleware/checkOverlap');
const router = express.Router();

function toMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

router.get('/slots', async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) return res.status(400).json({ message: 'doctorId and date are required.' });

    const [doctors] = await db.execute(
      'SELECT start_time, end_time, slot_minutes FROM Doctors WHERE doctor_id = ? AND is_active = TRUE',
      [doctorId]
    );
    if (!doctors.length) return res.status(404).json({ message: 'Doctor not found.' });

    const doctor = doctors[0];
    const [bookings] = await db.execute(
      `SELECT start_time, end_time FROM Appointments
       WHERE doctor_id = ? AND appointment_date = ? AND status = 'BOOKED'`,
      [doctorId, date]
    );

    const start = toMinutes(doctor.start_time);
    const end = toMinutes(doctor.end_time);
    const duration = Number(doctor.slot_minutes);
    const booked = bookings.map(item => ({
      start: toMinutes(item.start_time),
      end: toMinutes(item.end_time)
    }));

    const slots = [];
    for (let time = start; time + duration <= end; time += duration) {
      const slotEnd = time + duration;
      const isBooked = booked.some(item => time < item.end && slotEnd > item.start);
      const format = value => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
      slots.push({ startTime: format(time), endTime: format(slotEnd), available: !isBooked });
    }
    res.json(slots);
  } catch (error) { next(error); }
});

router.post('/', checkOverlap, async (req, res, next) => {
  const { doctorId, appointmentDate, startTime, endTime, patientName, email, phone } = req.body;
  if (!patientName || !email || !phone) {
    return res.status(400).json({ message: 'Patient name, email and phone are required.' });
  }
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    return res.status(400).json({ message: 'End time must be after start time.' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [doctorRows] = await connection.execute(
      'SELECT doctor_id FROM Doctors WHERE doctor_id = ? AND is_active = TRUE',
      [doctorId]
    );
    if (!doctorRows.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    const [existingPatients] = await connection.execute(
      'SELECT patient_id FROM Patients WHERE email = ?',
      [email]
    );

    let patientId;
    if (existingPatients.length) {
      patientId = existingPatients[0].patient_id;
      await connection.execute(
        'UPDATE Patients SET full_name = ?, phone = ? WHERE patient_id = ?',
        [patientName, phone, patientId]
      );
    } else {
      const [patientResult] = await connection.execute(
        'INSERT INTO Patients (full_name, email, phone) VALUES (?, ?, ?)',
        [patientName, email, phone]
      );
      patientId = patientResult.insertId;
    }

    const [result] = await connection.execute(
      `INSERT INTO Appointments (doctor_id, patient_id, appointment_date, start_time, end_time)
       VALUES (?, ?, ?, ?, ?)`,
      [doctorId, patientId, appointmentDate, startTime, endTime]
    );

    await connection.commit();
    res.status(201).json({
      message: 'Appointment booked successfully!',
      appointmentId: result.insertId
    });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
});

router.get('/daily-summary', async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Please provide ?date=YYYY-MM-DD.' });

    const [summary] = await db.execute(
      `SELECT d.doctor_id, d.full_name AS doctor_name, d.specialty,
              COUNT(a.appointment_id) AS booked_slots,
              (SELECT COUNT(*) FROM Appointments a2
               WHERE a2.doctor_id = d.doctor_id
                 AND a2.appointment_date = ?
                 AND a2.status = 'BOOKED') AS total_bookings,
              GROUP_CONCAT(
                CONCAT(TIME_FORMAT(a.start_time, '%H:%i'), ' - ',
                       TIME_FORMAT(a.end_time, '%H:%i'), ' | ', p.full_name)
                ORDER BY a.start_time SEPARATOR '; '
              ) AS daily_schedule
       FROM Doctors d
       LEFT JOIN Appointments a
         ON a.doctor_id = d.doctor_id
        AND a.appointment_date = ?
        AND a.status = 'BOOKED'
       LEFT JOIN Patients p ON p.patient_id = a.patient_id
       WHERE d.is_active = TRUE
       GROUP BY d.doctor_id, d.full_name, d.specialty
       ORDER BY d.full_name`,
      [date, date]
    );
    res.json(summary);
  } catch (error) { next(error); }
});

module.exports = router;
