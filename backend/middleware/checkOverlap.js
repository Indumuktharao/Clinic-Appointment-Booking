const db = require('../config/db');

// Middleware checks whether the requested interval overlaps an existing booking.
// Two intervals overlap when newStart < existingEnd AND newEnd > existingStart.
async function checkOverlap(req, res, next) {
  try {
    const { doctorId, appointmentDate, startTime, endTime } = req.body;

    if (!doctorId || !appointmentDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'Doctor, date, start time and end time are required.' });
    }

    const [rows] = await db.execute(
      `SELECT appointment_id
       FROM Appointments
       WHERE doctor_id = ?
         AND appointment_date = ?
         AND status = 'BOOKED'
         AND start_time < ?
         AND end_time > ?
       LIMIT 1`,
      [doctorId, appointmentDate, endTime, startTime]
    );

    if (rows.length > 0) {
      return res.status(409).json({ message: 'This slot is already booked. Please choose another time.' });
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = checkOverlap;
