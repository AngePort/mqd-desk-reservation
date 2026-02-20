## ADDED Requirements

### Requirement: Desks can be created on the office map
The system MUST allow authenticated users to define bookable desk locations directly on the office map.

Desk locations MUST include geometry relative to the office layout (e.g., normalized rectangle coordinates).

#### Scenario: Create a desk by placing geometry
- **WHEN** an authenticated user creates a desk with label and geometry on the map
- **THEN** the system MUST persist the desk and make it available for reservations

### Requirement: Desks can be edited
The system MUST allow updating a desk’s label and geometry.

#### Scenario: Update a desk
- **WHEN** an authenticated user updates an existing desk
- **THEN** the system MUST persist the updates

### Requirement: Desks can be disabled or deleted
The system MUST support disabling desks without removing historical data, and MUST support deleting desks when appropriate.

#### Scenario: Disable a desk
- **WHEN** an authenticated user disables a desk
- **THEN** the system MUST prevent new reservations on that desk

#### Scenario: Delete a desk
- **WHEN** an authenticated user deletes a desk
- **THEN** the system MUST remove it from the map and reservation selection
