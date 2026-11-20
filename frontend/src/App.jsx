
import { useEffect, useState } from 'react';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToday() {
  const today = new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export default function App() {
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(getToday());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [patient, setPatient] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  const doctor = doctors.find(
    d => Number(d.doctor_id) === Number(doctorId)
  );

  // Load doctors from the backend.
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const response = await fetch(`${API_URL}/doctors`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load doctors.');
        }

        setDoctors(data);

        if (data.length > 0) {
          setDoctorId(String(data[0].doctor_id));
        } else {
          setMessage('No doctors are currently available.');
          setMessageType('error');
        }
      } catch (error) {
        setMessage(error.message || 'Could not connect to the backend.');
        setMessageType('error');
      } finally {
        setLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, []);

  // Load available and booked slots whenever doctor or date changes.
  useEffect(() => {
    if (!doctorId || !date) {
      setSlots([]);
      return;
    }

    const loadSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot('');

      try {
        const response = await fetch(
          `${API_URL}/appointments/slots?doctorId=${doctorId}&date=${date}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load time slots.');
        }

        setSlots(data);
      } catch (error) {
        setSlots([]);
        setMessage(error.message || 'Could not load available slots.');
        setMessageType('error');
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [doctorId, date]);

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
  };

  const handleBooking = async event => {
    event.preventDefault();

    if (!selectedSlot) {
      showMessage('Please select an available time slot.', 'error');
      return;
    }

    if (
      !patient.name.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email) ||
      !/^[0-9+\-\s]{7,15}$/.test(patient.phone)
    ) {
      showMessage('Please enter valid patient details.', 'error');
      return;
    }

    if (date < getToday()) {
      showMessage('Please select today or a future date.', 'error');
      return;
    }

    const chosenSlot = slots.find(
      slot => slot.startTime === selectedSlot
    );

    if (!chosenSlot || !chosenSlot.available) {
      showMessage('This slot is no longer available. Please select another.', 'error');
      return;
    }

    setBooking(true);

    try {
      const response = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          doctorId: Number(doctorId),
          appointmentDate: date,
          startTime: chosenSlot.startTime,
          endTime: chosenSlot.endTime,
          patientName: patient.name.trim(),
          email: patient.email.trim(),
          phone: patient.phone.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Appointment booking failed.');
      }

      showMessage(
        `${data.message} Booking ID: ${data.appointmentId}`,
        'success'
      );

      setSelectedSlot('');
      setPatient({
        name: '',
        email: '',
        phone: ''
      });

      // Refresh slots from MySQL after successful booking.
      const slotsResponse = await fetch(
        `${API_URL}/appointments/slots?doctorId=${doctorId}&date=${date}`
      );
      const updatedSlots = await slotsResponse.json();

      if (slotsResponse.ok) {
        setSlots(updatedSlots);
      }
    } catch (error) {
      showMessage(error.message || 'Could not book the appointment.', 'error');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#">✚ CareSlot</a>
        <span className="top-note">
          Clinic appointments, made simple
        </span>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">YOUR HEALTH, OUR PRIORITY</span>
            <h1>
              Good care starts<br />
              <em>with a booking.</em>
            </h1>
            <p>
              Find the right specialist and reserve a
              consultation at a time that works for you.
            </p>
            <div className="hero-points">
              ✓ Verified doctors
              ✓ Easy scheduling
              ✓ Quick confirmation
            </div>
          </div>

          <div className="hero-art">
            <div className="art-circle circle-one"></div>
            <div className="art-circle circle-two"></div>
            <div className="doctor-emoji">🩺</div>
            <div className="floating-card">
              ✦ <b>Care that fits your day</b>
            </div>
          </div>
        </section>

        <section className="booking-layout">
          <div className="section-heading">
            <div>
              <span className="eyebrow">BOOK AN APPOINTMENT</span>
              <h2>Let's find your doctor</h2>
            </div>
          </div>

          <div className="booking-grid">
            <div className="panel">
              <div className="panel-title">
                <span className="number">1</span>
                <div>
                  <h3>Choose a specialist</h3>
                  <p>Select your preferred doctor.</p>
                </div>
              </div>

              {loadingDoctors ? (
                <p>Loading doctors...</p>
              ) : doctors.length === 0 ? (
                <p>No doctors found. Please check your database.</p>
              ) : (
                <div className="doctor-list">
                  {doctors.map((d, index) => (
                    <button
                      type="button"
                      key={d.doctor_id}
                      className={`doctor-card ${
                        Number(doctorId) === Number(d.doctor_id) ? 'active' : ''
                      }`}
                      onClick={() => {
                        setDoctorId(String(d.doctor_id));
                        setSelectedSlot('');
                        setMessage('');
                      }}
                    >
                      <span className={`avatar avatar-${index % 3}`}>
                        {['👩‍⚕️', '👨‍⚕️', '👩🏻‍⚕️'][index % 3]}
                      </span>

                      <span className="doctor-info">
                        <b>{d.full_name}</b>
                        <small>{d.specialty}</small>
                        <small className="fee">
                          ₹{d.consultation_fee} consultation
                        </small>
                      </span>

                      <span className="radio-indicator">
                        {Number(doctorId) === Number(d.doctor_id) ? '✓' : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {doctor && (
                <div className="doctor-hours">
                  ◷ Consultation hours: {String(doctor.start_time).slice(0, 5)}
                  {' – '}
                  {String(doctor.end_time).slice(0, 5)}
                </div>
              )}
            </div>

            <div className="panel">
              <div className="panel-title">
                <span className="number">2</span>
                <div>
                  <h3>Pick a date & time</h3>
                  <p>Select an available slot.</p>
                </div>
              </div>

              <label className="field-label">
                Consultation date
              </label>

              <input
                className="date-input"
                type="date"
                min={getToday()}
                value={date}
                onChange={e => {
                  setDate(e.target.value);
                  setSelectedSlot('');
                  setMessage('');
                }}
              />

              <div className="slot-heading">
                <b>Available time slots</b>
                <span>🟢 Available　⚪ Booked</span>
              </div>

              {loadingSlots ? (
                <p>Loading time slots...</p>
              ) : (
                <div className="slots-grid">
                  {slots.map(slot => (
                    <button
                      type="button"
                      key={slot.startTime}
                      disabled={!slot.available}
                      className={`slot ${
                        !slot.available
                          ? 'booked'
                          : selectedSlot === slot.startTime
                            ? 'chosen'
                            : ''
                      }`}
                      onClick={() => {
                        setSelectedSlot(slot.startTime);
                        setMessage('');
                      }}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              )}

              {!loadingSlots && slots.length === 0 && doctor && (
                <p className="slot-hint">
                  No time slots are available for this date.
                </p>
              )}

              <p className="slot-hint">
                Each consultation is {doctor?.slot_minutes || 30} minutes.
              </p>
            </div>
          </div>

          <form className="panel patient-panel" onSubmit={handleBooking}>
            <div className="panel-title">
              <span className="number">3</span>
              <div>
                <h3>Your details</h3>
                <p>Enter your information to confirm booking.</p>
              </div>
            </div>

            <div className="form-grid">
              <label>
                Full name
                <input
                  required
                  value={patient.name}
                  placeholder="Your name"
                  onChange={e => setPatient({
                    ...patient,
                    name: e.target.value
                  })}
                />
              </label>

              <label>
                Email address
                <input
                  required
                  type="email"
                  value={patient.email}
                  placeholder="you@example.com"
                  onChange={e => setPatient({
                    ...patient,
                    email: e.target.value
                  })}
                />
              </label>

              <label>
                Phone number
                <input
                  required
                  type="tel"
                  value={patient.phone}
                  placeholder="Mobile number"
                  onChange={e => setPatient({
                    ...patient,
                    phone: e.target.value
                  })}
                />
              </label>
            </div>

            <div className="submit-row">
              <div className="selection-summary">
                <span>Selected slot</span>
                <b>
                  {selectedSlot
                    ? `${date} · ${selectedSlot}`
                    : 'Choose a time slot above'}
                </b>
              </div>

              <button
                className="submit-button"
                type="submit"
                disabled={booking || loadingDoctors || !doctor}
              >
                {booking ? 'Booking...' : 'Confirm appointment →'}
              </button>
            </div>

            {message && (
              <div
                className={`notice ${messageType === 'success' ? 'success' : 'error'}`}
                role="alert"
              >
                {message}
              </div>
            )}
          </form>
        </section>
      </main>

      <footer>
        © 2026 CareSlot Clinic · Academic FSD Project
      </footer>
    </div>
  );
}
