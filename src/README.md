# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Create a student profile and log in
- Sign up for activities as the authenticated student
- Unregister from activities as the authenticated student

## Getting Started

1. Install the dependencies:

   ```
   pip install fastapi uvicorn
   ```

2. Run the application:

   ```
   python app.py
   ```

3. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/auth/register`                                                  | Create a student profile                                             |
| POST   | `/auth/login`                                                     | Log in and receive a bearer token                                   |
| GET    | `/auth/me`                                                        | Get the authenticated student's profile                             |
| POST   | `/activities/{activity_name}/signup`                              | Sign up the authenticated student                                  |
| DELETE | `/activities/{activity_name}/unregister`                         | Unregister the authenticated student                               |

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Student ID
   - Department
   - Role
   - PBKDF2 password hash (never the plaintext password)

All data is stored in memory, including profiles and sessions, which means it will be reset when the server restarts.
