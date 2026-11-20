CREATE DATABASE IF NOT EXISTS clinic_booking;
USE clinic_booking;

CREATE TABLE IF NOT EXISTS Doctors (
    doctor_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    start_time TIME NOT NULL DEFAULT '09:00:00',
    end_time TIME NOT NULL DEFAULT '17:00:00',
    slot_minutes INT NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS Patients (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_patient_email (email)
);

CREATE TABLE IF NOT EXISTS Appointments (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('BOOKED','CANCELLED') NOT NULL DEFAULT 'BOOKED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appointment_doctor FOREIGN KEY (doctor_id) REFERENCES Doctors(doctor_id),
    CONSTRAINT fk_appointment_patient FOREIGN KEY (patient_id) REFERENCES Patients(patient_id),
    INDEX idx_doctor_date (doctor_id, appointment_date, status)
);

INSERT INTO Doctors (full_name, specialty, consultation_fee, start_time, end_time, slot_minutes)
SELECT 'Dr. Ananya Rao', 'General Physician', 500.00, '09:00:00', '13:00:00', 30
WHERE NOT EXISTS (SELECT 1 FROM Doctors WHERE full_name = 'Dr. Ananya Rao');

INSERT INTO Doctors (full_name, specialty, consultation_fee, start_time, end_time, slot_minutes)
SELECT 'Dr. Kiran Kumar', 'Cardiologist', 800.00, '10:00:00', '14:00:00', 30
WHERE NOT EXISTS (SELECT 1 FROM Doctors WHERE full_name = 'Dr. Kiran Kumar');

INSERT INTO Doctors (full_name, specialty, consultation_fee, start_time, end_time, slot_minutes)
SELECT 'Dr. Meera Sharma', 'Dermatologist', 650.00, '14:00:00', '18:00:00', 30
WHERE NOT EXISTS (SELECT 1 FROM Doctors WHERE full_name = 'Dr. Meera Sharma');

-- Example report query: daily doctor-wise schedule using JOIN + subquery.
-- Replace the date with the day you want to inspect.
SET @report_date = '2026-11-20';
SELECT
    d.doctor_id,
    d.full_name AS doctor_name,
    d.specialty,
    COUNT(a.appointment_id) AS booked_slots,
    (
        SELECT COUNT(*)
        FROM Appointments a2
        WHERE a2.doctor_id = d.doctor_id
          AND a2.appointment_date = @report_date
          AND a2.status = 'BOOKED'
    ) AS total_bookings_subquery,
    GROUP_CONCAT(
        CONCAT(TIME_FORMAT(a.start_time, '%H:%i'), ' - ',
               TIME_FORMAT(a.end_time, '%H:%i'), ' | ', p.full_name)
        ORDER BY a.start_time SEPARATOR '\n'
    ) AS daily_schedule
FROM Doctors d
LEFT JOIN Appointments a
    ON a.doctor_id = d.doctor_id
   AND a.appointment_date = @report_date
   AND a.status = 'BOOKED'
LEFT JOIN Patients p ON p.patient_id = a.patient_id
WHERE d.is_active = TRUE
GROUP BY d.doctor_id, d.full_name, d.specialty
ORDER BY d.full_name;
