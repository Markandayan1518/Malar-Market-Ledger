# Feature Specification: Shop-Specific Flower Types and Farmer Mapping

**Feature Branch**: `002-flower-farmer-mapping`  
**Created**: 2026-02-19  
**Status**: Draft  
**Input**: User description: "Shop-Specific Flower Types and Farmer Mapping - Map flowers to shop configuration and farmers for smart suggestions during daily entry"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Shop Flower Catalog (Priority: P1)

As a shop owner/admin, I want to define which flower types my shop trades so that staff only see relevant flowers during rate setting and daily entry.

**Why this priority**: This is the foundation for all other features - without a configured flower catalog, the smart suggestions and rate management cannot function. This directly reduces data entry errors by limiting options to relevant flowers.

**Independent Test**: Can be fully tested by accessing the Flower Management screen, adding/removing flower types, and verifying that only active flowers appear in the rate setting dropdown.

**Acceptance Scenarios**:

1. **Given** I am logged in as an admin, **When** I navigate to Flower Management, **Then** I see a list of all available flower types with their bilingual names (English/Tamil) and active status
2. **Given** I am on the Flower Management screen, **When** I deactivate a flower type (e.g., Marigold), **Then** that flower no longer appears in rate setting or daily entry dropdowns
3. **Given** I am on the Flower Management screen, **When** I activate a previously deactivated flower, **Then** it immediately becomes available in all dropdowns
4. **Given** I am on the Flower Management screen, **When** I add a new flower type with English and Tamil names, **Then** the new flower appears in the catalog and is available for selection

---

### User Story 2 - Link Farmers to Their Crops (Priority: P1)

As a shop owner/admin, I want to associate each farmer with the specific flower types they typically supply so that the system can predict and auto-suggest flowers during entry.

**Why this priority**: This enables the smart suggestion feature that dramatically speeds up daily entry. Without farmer-crop associations, staff must manually select flowers every time.

**Independent Test**: Can be fully tested by editing a farmer's profile, selecting their supplying crops via checkboxes, and verifying the associations are saved and displayed correctly.

**Acceptance Scenarios**:

1. **Given** I am editing a farmer's profile, **When** I view the "Supplying Crops" section, **Then** I see a checkbox list of all active flower types with bilingual labels
2. **Given** I am editing a farmer's profile, **When** I select multiple crops (e.g., Jasmine and Mullai) and save, **Then** those associations are stored and displayed when I view the farmer
3. **Given** a farmer has crop associations, **When** I edit their profile again, **Then** the previously selected crops are shown as checked
4. **Given** I am editing a farmer's profile, **When** I deselect all crops and save, **Then** the farmer has no crop associations

---

### User Story 3 - Smart Flower Suggestion During Entry (Priority: P2)

As a staff member entering daily collections, I want the system to auto-suggest or pre-select the flower type based on the selected farmer so that I can enter data faster with fewer errors.

**Why this priority**: This is the primary UX benefit of the feature - it directly reduces clicks and errors during the high-frequency daily entry task. However, it depends on P1 stories being complete.

**Independent Test**: Can be fully tested by creating farmer-crop associations, then performing daily entries and verifying the auto-selection behavior.

**Acceptance Scenarios**:

1. **Given** a farmer has exactly one crop association (e.g., Ramesh → Jasmine), **When** I select that farmer in the daily entry form, **Then** the flower type dropdown automatically selects "Jasmine"
2. **Given** a farmer has multiple crop associations (e.g., Suresh → Rose, Mullai), **When** I select that farmer in the daily entry form, **Then** the flower type dropdown shows associated flowers at the top (highlighted) followed by other active flowers
3. **Given** a farmer has no crop associations, **When** I select that farmer in the daily entry form, **Then** the flower type dropdown shows all active flowers in alphabetical order with no pre-selection
4. **Given** I have selected a farmer with auto-selected flower, **When** I manually change the flower type, **Then** my selection is honored and the entry is saved with the manually selected flower

---

### User Story 4 - Prompt to Add New Crop Association (Priority: P3)

As a staff member, I want to be prompted to add a new flower type to a farmer's profile when they bring a different flower so that future entries are faster.

**Why this priority**: This enhances the system over time but is not critical for initial operation. It improves long-term data quality and entry speed.

**Independent Test**: Can be fully tested by selecting a farmer, choosing a flower not in their associations, and verifying the prompt appears and correctly saves the new association.

**Acceptance Scenarios**:

1. **Given** I selected farmer "Suresh" (associated with Rose) and manually chose "Tuberose", **When** the entry is saved, **Then** I see a prompt asking "Add Tuberose to Suresh's profile for future entries?"
2. **Given** I see the prompt to add a new crop association, **When** I tap "Yes", **Then** the flower is added to the farmer's profile immediately
3. **Given** I see the prompt to add a new crop association, **When** I tap "No" or dismiss it, **Then** the entry is saved but no association is added
4. **Given** I am offline, **When** I make an entry with a new flower for a farmer, **Then** the prompt is queued and shown when I'm back online

---

### Edge Cases

- What happens when all flower types are deactivated? System should prevent this - at least one flower must remain active.
- How does the system handle a farmer whose only associated flower has been deactivated? The farmer appears with no auto-selection; dropdown shows all active flowers.
- What happens when a farmer is deleted? Their crop associations are also removed (cascade delete).
- What happens when a flower type is deleted? All associations to that flower are removed; existing entries retain historical data.
- How does the system behave when offline? Farmer-crop associations are cached locally; new associations from prompts are queued for sync.
- What happens if two staff members edit the same farmer's crops simultaneously? Last write wins; no locking mechanism required.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow administrators to activate and deactivate flower types in the shop's catalog
- **FR-002**: System MUST display flower types with bilingual names (English and Tamil) in all interfaces
- **FR-003**: System MUST allow administrators to associate multiple flower types with each farmer
- **FR-004**: System MUST prevent duplicate farmer-flower associations
- **FR-005**: System MUST auto-select the flower type in daily entry when a farmer has exactly one associated crop
- **FR-006**: System MUST prioritize associated flowers at the top of dropdown when a farmer has multiple crops
- **FR-007**: System MUST display all active flowers in dropdowns, allowing manual selection regardless of associations
- **FR-008**: System MUST prompt staff to add new crop associations when a farmer brings a different flower
- **FR-009**: System MUST support one-tap confirmation to add crop associations from the prompt
- **FR-010**: System MUST cache farmer-crop associations for offline use
- **FR-011**: System MUST only show active (non-deactivated) flowers in rate setting and daily entry screens
- **FR-012**: System MUST maintain historical accuracy - deactivating a flower does not affect past entries or rates

### Key Entities

- **Flower Type (Master Catalog)**: Represents a type of flower the shop may trade. Has bilingual names (English/Tamil), active status, and optional display image. Can be enabled/disabled at shop level without deleting historical data.

- **Farmer-Flower Association**: Links a farmer to a flower type they typically supply. Represents the relationship "Farmer X grows Flower Y". Used for smart suggestions during entry. Multiple associations per farmer are allowed.

- **Market Rate**: Daily price per kg for a specific flower type. Linked to the flower master catalog. Has validity period (valid_from, valid_to) for historical tracking.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Staff can complete a daily entry for a known farmer (single crop association) in under 10 seconds, down from 15+ seconds previously
- **SC-002**: Flower selection errors (wrong flower selected) reduce by 80% after implementation
- **SC-003**: 90% of staff report that daily entry is "faster" or "much faster" after training
- **SC-004**: Time to configure a new farmer's crop associations is under 30 seconds
- **SC-005**: System displays flower suggestions within 200 milliseconds of farmer selection
- **SC-006**: Offline entry with cached associations succeeds 100% of the time when network is unavailable
- **SC-007**: 70% of "new flower for farmer" prompts result in association addition (measuring adoption of the feature)

## Assumptions

- The existing `flower_types` table can be extended with `is_active` field rather than creating a new table
- Farmers typically supply 1-3 different flower types (rarely more than 5)
- Shop owners have admin privileges; staff have entry privileges only
- The prompt to add new associations is non-blocking (does not interrupt workflow)
- Bilingual names for flowers already exist in the current system
- The existing offline/IndexedDB infrastructure can be extended for association caching
