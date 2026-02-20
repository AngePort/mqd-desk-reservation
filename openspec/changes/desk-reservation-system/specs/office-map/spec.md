## ADDED Requirements

### Requirement: Office layout images can be uploaded and retrieved
The system MUST support storing an office layout image used as the map background.

#### Scenario: Upload a base layout
- **WHEN** an authenticated user uploads a base office layout image
- **THEN** the system MUST persist it and make it retrievable by the client

#### Scenario: Retrieve the current base layout
- **WHEN** an authenticated user requests the current base office layout
- **THEN** the system MUST return the layout image metadata and a retrievable image reference

### Requirement: Optional reference layout may be provided
The system MUST support an optional second layout image that visually highlights bookable desk locations as a reference for admins.

#### Scenario: Upload a reference layout
- **WHEN** an authenticated user uploads an optional reference layout image
- **THEN** the system MUST persist it and make it retrievable for admin use

### Requirement: Desks are rendered as interactive overlays on the layout
The system MUST render bookable desks as interactive overlays positioned relative to the layout image.

#### Scenario: Desk overlays are displayed
- **WHEN** an authenticated user views the office map
- **THEN** the system MUST display the office layout and overlays for all enabled desks

### Requirement: Reservation state is visible on the map
The system MUST visually distinguish reserved desks from available desks for the selected time range.

#### Scenario: Reserved desks display reserver identity
- **WHEN** a desk is reserved for the selected time range
- **THEN** the desk MUST be shown as reserved and MUST display the reserver’s name on hover or click
