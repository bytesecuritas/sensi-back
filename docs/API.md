## API Documentation

Below is a concise table of key API endpoints.

| Method | URL | Description | Auth | Body (summary) | Response (summary) |
|---|---|---|---|---|---|
| POST | /auth/login | Authenticate, returns tokens | No | email, password | access_token, refresh_token |
| POST | /auth/refresh | Get new access token using refresh | No | refresh_token | access_token, refresh_token |
| POST | /auth/logout | Logout current user | Bearer | - | message |
| POST | /auth/change-password | Change password | Bearer | currentPassword, newPassword | message |
| POST | /auth/reset-password-request | Request password reset | No | email | message |
| POST | /auth/reset-password | Reset password | No | token, newPassword | message |
| GET | /auth/profile | Get current user profile with progression, attempts, gamification | Bearer | - | user, organisation, statistiques, gamification, parcours, certificats |
| GET | /auth/dashboard | Get dashboard (role-based) | Bearer | - | dashboard data |
| POST | /learning/parcours | Create learning path | Bearer (superadmin) | titre, description... | parcours |
| GET | /learning/parcours | List learning paths | Bearer | - | [parcours] |
| GET | /learning/parcours/:id | Get learning path | Bearer | - | parcours |
| DELETE | /learning/parcours/:id | Delete learning path | Bearer (superadmin) | - | message |
| POST | /learning/modules | Create module | Bearer (superadmin) | module fields | module |
| GET | /learning/modules | List modules | Bearer | - | [modules] |
| GET | /learning/modules/:id | Get module | Bearer | - | module |
| PUT | /learning/modules/:id | Update module | Bearer (superadmin) | fields | module |
| DELETE | /learning/modules/:id | Delete module | Bearer (superadmin) | - | message |
| POST | /learning/quizzes/:type/parent/:parentId | Create quiz (module/parcours_final) | Bearer (superadmin) | quiz payload | quiz |
| GET | /learning/quizzes/:type/parent/:parentId | List quizzes by type/parent | Bearer | - | [quiz] |
| GET | /learning/quiz/:quizId | Get quiz with questions | Bearer | - | quiz |
| POST | /learning/quiz/:quizId/submit | Submit quiz answers | Bearer | reponses[] | result with score, points, reussi |
| GET | /learning/quiz/:quizId/results | Get my quiz results | Bearer | - | results with details |
| GET | /learning/progress/user | Get my progress list | Bearer | - | [progress] |
| GET | /learning/progress/parcours/:parcoursId | Get my progress for a parcours | Bearer | - | progress |

Notes
- Module completion: a module is completed when all its module quizzes are at 100%.
- Progression aggregation: parcours progression is percentage of completed modules; quiz attempts (tentatives_quiz) are incremented on each submission.
- Tokens: access tokens expire in 1h; refresh tokens in 7d. Use /auth/refresh to renew.


