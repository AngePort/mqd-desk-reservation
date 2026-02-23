## ADDED Requirements

### Requirement: Secure password storage
The system MUST store user passwords only as secure hashes and MUST NOT store plaintext passwords.

#### Scenario: Password is not stored in plaintext
- **WHEN** an admin creates a user with a password
- **THEN** the system MUST persist only a password hash and MUST NOT persist the plaintext password

### Requirement: User login
The system MUST provide a login mechanism using an email and password.

#### Scenario: Successful login
- **WHEN** a user submits valid credentials
- **THEN** the system MUST establish an authenticated session

#### Scenario: Invalid login
- **WHEN** a user submits an invalid email or password
- **THEN** the system MUST NOT establish an authenticated session

### Requirement: Session-based authentication
The system MUST use an authenticated session to authorize requests to protected resources.

#### Scenario: Unauthenticated access is rejected
- **WHEN** a client requests a protected resource without a valid authenticated session
- **THEN** the system MUST reject the request

### Requirement: Logout terminates the session
The system MUST provide a logout mechanism that terminates the authenticated session.

#### Scenario: Logout
- **WHEN** a user logs out
- **THEN** subsequent requests using the prior session MUST be rejected

### Requirement: Admin can provision user accounts
The system MUST allow Admin users to create and manage User accounts.

#### Scenario: Admin creates a user
- **WHEN** an Admin creates a new user with an email, role, and password
- **THEN** the user MUST be able to log in with those credentials

### Requirement: Role-based authorization
The system MUST enforce role-based authorization.

#### Scenario: User cannot access admin-only endpoints
- **WHEN** a User attempts to access an admin-only operation
- **THEN** the system MUST reject the request
