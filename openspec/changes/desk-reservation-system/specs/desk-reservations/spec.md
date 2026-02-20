## ADDED Requirements

### Requirement: Users can view desk availability for a time range
The system MUST allow viewing availability of all desks for a selected start/end time range.

#### Scenario: View availability
- **WHEN** an authenticated user selects a start time and end time
- **THEN** the system MUST indicate for each enabled desk whether it is available or reserved for that range

### Requirement: Reservations require a desk, person, and time range
The system MUST allow creating a reservation by selecting a desk, selecting a person from the personnel directory, selecting a start time, selecting an end time, and confirming.

The system MUST require `startAt` to be strictly before `endAt`.

#### Scenario: Create a reservation successfully
- **WHEN** an authenticated user creates a reservation with a valid desk, person, and non-overlapping time range
- **THEN** the system MUST persist the reservation

#### Scenario: Reject invalid time ranges
- **WHEN** an authenticated user attempts to create a reservation where start time is not before end time
- **THEN** the system MUST reject the reservation

### Requirement: Desk reservations cannot overlap
The system MUST reject creating or updating a reservation if it overlaps an existing reservation for the same desk.

#### Scenario: Reject overlapping reservation
- **WHEN** an authenticated user attempts to reserve a desk for a time range that overlaps an existing reservation on that desk
- **THEN** the system MUST reject the request

### Requirement: Reservations can be canceled
The system MUST allow canceling an existing reservation.

#### Scenario: Cancel reservation
- **WHEN** an authenticated user cancels an existing reservation
- **THEN** the system MUST remove it from availability results for that time range

### Requirement: Reservations can be edited by privileged users
The system MUST allow updating an existing reservation’s person assignment or time range.

#### Scenario: Edit reservation
- **WHEN** an authenticated user updates an existing reservation to a non-overlapping time range
- **THEN** the system MUST persist the update
