## ADDED Requirements

### Requirement: Shared account authentication
The system MUST require authentication before any desk, personnel, map, or reservation operations are performed.

#### Scenario: Unauthenticated access is rejected
- **WHEN** a client requests a protected resource without a valid authenticated session
- **THEN** the system MUST reject the request

### Requirement: Login with configured credentials
The system MUST provide a login mechanism using a configured username and password for a single shared account.

#### Scenario: Successful login
- **WHEN** a user submits valid shared-account credentials
- **THEN** the system MUST establish an authenticated session

#### Scenario: Invalid login
- **WHEN** a user submits an invalid username or password
- **THEN** the system MUST NOT establish an authenticated session

### Requirement: Logout terminates the session
The system MUST provide a logout mechanism that terminates the authenticated session.

#### Scenario: Logout
- **WHEN** a user logs out
- **THEN** subsequent requests using the prior session MUST be rejected
