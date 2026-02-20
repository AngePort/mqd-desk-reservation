## ADDED Requirements

### Requirement: Personnel list is available for reservations
The system MUST maintain a directory of personnel records that can be selected when creating a reservation.

#### Scenario: List personnel
- **WHEN** an authenticated user requests the personnel list
- **THEN** the system MUST return all active personnel records

### Requirement: Personnel records can be created and updated
The system MUST allow authenticated users to create and update personnel records, including a display name.

#### Scenario: Create a personnel record
- **WHEN** an authenticated user creates a new personnel record with a display name
- **THEN** the system MUST persist the record and make it available in the personnel list

#### Scenario: Update a personnel record
- **WHEN** an authenticated user updates an existing personnel record
- **THEN** the system MUST persist the updated values

### Requirement: Personnel records can be deactivated
The system MUST support deactivating personnel records.

#### Scenario: Deactivated personnel cannot be selected
- **WHEN** a personnel record is deactivated
- **THEN** the system MUST exclude it from the personnel list used for new reservations
