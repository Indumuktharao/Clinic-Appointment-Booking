# Clinic Appointment Booking System

A beginner-friendly full-stack FSD project built with **React + modern JavaScript**, **Node.js + Express**, and **MySQL**.

## Features
- Browse doctors and their specialties.
- Choose a doctor and date; available consultation slots update dynamically.
- Book appointments with patient name, email and phone.
- Frontend validation and interactive success/error alerts.
- Express modular routes: `/api/doctors` and `/api/appointments`.
- Middleware prevents overlapping appointments for the same doctor.
- MySQL tables: `Doctors`, `Patients`, `Appointments`.
- Daily doctor-wise schedule report using `JOIN`, `GROUP BY` and a subquery.
- Demo seed data for three doctors.

## 1. Requirements
Install:
- Node.js (LTS): https://nodejs.org/
- MySQL Community Server + MySQL Workbench: https://dev.mysql.com/downloads/
- VS Code

Check Node/npm:
```bash
node -v
npm -v
```

## 2. Create the database
1. Open MySQL Workbench and connect to your local MySQL server.
2. Open `database/schema.sql`.
3. Execute the whole file (lightning icon).
4. It creates the `clinic_booking` database, tables and sample doctors.

## 3. Configure the backend
1. Open a terminal in VS Code.
2. Go to the backend folder:
```bash
cd backend
```
3. Install packages:
```bash
npm install
```
4. Copy `.env.example` to `.env`.
5. Edit `.env` and enter your own MySQL password. Do not share this file or upload it to GitHub.

Example:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=clinic_booking
```
6. Start the API:
```bash
npm run dev
```
You should see `Server running on http://localhost:5000` and `MySQL connected`.

## 4. Start the React frontend
Open a **second** VS Code terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the local URL printed by Vite (usually http://localhost:5173).

## 5. How to demonstrate to your teacher
1. Show the doctor cards and choose a doctor.
2. Change the date. Available slots are shown as selectable buttons.
3. Select a slot and enter patient details.
4. Submit the form. Show the confirmation alert.
5. Try booking the exact same doctor/date/time again. The backend rejects the overlapping booking.
6. Open this URL to show doctors JSON: http://localhost:5000/api/doctors
7. Open this URL to show the daily doctor-wise report (replace the date if needed):
   http://localhost:5000/api/appointments/daily-summary?date=2026-11-20
8. In MySQL Workbench, run:
```sql
USE clinic_booking;
SELECT * FROM Doctors;
SELECT * FROM Patients;
SELECT * FROM Appointments;
```

## API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/doctors` | List doctors |
| GET | `/api/doctors/:id` | Doctor details |
| GET | `/api/appointments/slots?doctorId=1&date=2026-11-20` | Available slots |
| POST | `/api/appointments` | Create appointment |
| GET | `/api/appointments/daily-summary?date=2026-11-20` | Doctor-wise daily schedule |

## GitHub version control (project requirement)
From the project root:
```bash
git init
git add .
git commit -m "Initial clinic appointment booking project"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/clinic-appointment-booking.git
git push -u origin main
```
Suggested issue tracker items:
- [ ] Validate appointment date is not in the past.
- [ ] Add doctor availability management.
- [ ] Add appointment cancellation.
- [ ] Add login for clinic staff.

For branch protection: GitHub repository → **Settings → Rules → Rulesets** (or Branches → Add branch protection rule on older UI) → target `main` → require pull request before merging. For a classroom demo, you can show the rule configuration; it is not required to run the app.

## Troubleshooting
- **Access denied for user 'root'**: check `DB_USER` and `DB_PASSWORD` in `backend/.env`.
- **Unknown database**: run `database/schema.sql` in MySQL Workbench.
- **Port already in use**: change `PORT=5001` in `.env` and update `frontend/.env` to `VITE_API_URL=http://localhost:5001/api`.
- **No doctors shown**: ensure the SQL seed section ran successfully and backend terminal says MySQL connected.
- **CORS/network error**: keep both backend and frontend running in separate terminals.

> This is an academic demonstration project. It is not intended for storing real patient medical information or production clinic use.
