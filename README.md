# MiniLedger — Money Lending Tracker

MiniLedger is a simple React Native application that helps users track money lent to friends. Users can log in using their phone number and a mock OTP, add loan entries, track repayment status, and identify overdue loans from a summary dashboard.

## Features

- **Phone authentication:** Login using a phone number and mock OTP.
- **Add loan entries:** Record a friend's name, loan amount, and due date.
- **Track repayments:** Mark loans as repaid.
- **Dashboard summary:** View total lent, total repaid, and overdue amount.
- **Overdue highlighting:** Quickly identify loans past their due dates.
- **PostgreSQL persistence:** Store loan and user data in a relational database.
- **Clean dashboard UI:** A Midnight Blue color palette with clear loan statuses.

## Tech Stack

### Backend
- Node.js
- TypeScript
- Express.js
- PostgreSQL
- JWT authentication
- Mock OTP verification

### Frontend
- React Native
- Expo
- TypeScript
- Fetch API for backend communication

## Project Structure

```text
MiniLedger/
├── backend/
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── App.tsx
│   └── package.json
├── .gitignore
└── README.md
```

*The folder and file names above are illustrative. Adjust the tree to match the actual repository.*

## Prerequisites

Install the following before running the project:

- Node.js and npm
- PostgreSQL
- Git
- Expo Go or an Android emulator
- A code editor such as Visual Studio Code

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/tamann-wq/MiniLedger.git
cd MiniLedger
```

### 2. Configure PostgreSQL

Create a PostgreSQL database for MiniLedger using pgAdmin or the PostgreSQL command line.

```sql
CREATE DATABASE miniledger;
```

Configure the backend environment variables with your local database connection details. Use the actual variable names expected by your backend.

Example `.env` configuration:

```env
PORT=YOUR_BACKEND_PORT
DATABASE_URL=YOUR_POSTGRESQL_CONNECTION_STRING
JWT_SECRET=YOUR_LOCAL_JWT_SECRET
```

Do not commit your real `.env` file or credentials to GitHub.

**Database schema:** Follow the schema or migration setup included in the backend project. If the repository does not include schema creation or migrations, document the required setup before running the app.

### 3. Start the backend

Open a terminal:

```bash
cd backend
npm install
```

Run the development command configured in `backend/package.json`. For example, if the project defines a `dev` script:

```bash
npm run dev
```

Check the backend terminal for startup messages and the mock OTP. Use the actual API URL and port configured by your backend.

### 4. Start the React Native app

Open another terminal:

```bash
cd frontend
npm install
npx expo start
```

Open the app in Expo Go or your configured development emulator.

Configure the frontend API base URL to point to the running backend. When using an Android emulator, `localhost` usually refers to the emulator itself; use the appropriate host address for your setup.

## How to Use MiniLedger

1. Enter your phone number on the login screen.
2. Obtain the mock OTP from the backend terminal and enter it in the app.
3. Log in and view the dashboard summary.
4. Select **Add Loan** and enter the friend's name, amount, and due date.
5. View the new loan in the entries list.
6. Check overdue entries, which are highlighted in the UI.
7. Select **Mark as Repaid** when a loan has been repaid.
8. Confirm that the loan status and dashboard summary update.

## API Overview

The backend provides functionality for:

| Functionality | Description |
|---|---|
| Phone authentication | Request and verify a mock OTP |
| Loan entries | Retrieve and add loan entries |
| Repayment | Mark a loan as repaid |
| Summary | Retrieve total lent, total repaid, and overdue amount |

Consult the backend route files for the exact endpoint paths, HTTP methods, request bodies, and response formats.

## Testing

Verify the following workflows:

- Login with a phone number and mock OTP.
- Add a loan with a valid amount and due date.
- Confirm the loan appears in the list.
- Verify overdue highlighting for past-due loans.
- Mark a loan as repaid and verify the status update.
- Confirm the dashboard summary updates correctly.
- Verify that loan data persists after restarting or refreshing the app.

Run automated tests using the test scripts defined in the backend and frontend `package.json` files, if configured.

## Security Notes

- Mock OTP authentication is intended for demonstration and development, not production use.
- Keep environment variables and credentials out of version control.
- A production release should use a secure authentication and OTP delivery service.

## Future Improvements

- Receipt photo upload for loan records.
- More comprehensive automated tests.
- Improved input validation and error handling.
- Production-grade authentication and deployment.

## Author

**Tamanna Mishra**

GitHub: https://github.com/tamann-wq

---

Built as a practical project to demonstrate React Native development, REST API integration, authentication, and PostgreSQL data persistence.
