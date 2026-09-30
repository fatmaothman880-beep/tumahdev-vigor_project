# VIGOR interface refinement

This pass preserves the existing VIGOR navigation, operational workflows, authentication,
roles, API routing and PostgreSQL integration. No UI dependencies were added.
The earlier runtime and Control Tower repairs remain in the working tree.

## Audit and consolidation

- The top bar repeated page headings, branding, live status and account details. Page headings now live in the content; connection status has one control, account details live in the account menu, and alert counts live in navigation.
- Summary and Operations rendered the same dashboard. Summary now provides four executive metrics and compact visit tables. Operations provides working cards with progress, remaining cargo, checklist context and actions.
- The Vessels page stacked visits, the site registry and fleet records. These are now Port visits, Fleet directory and Site registry views. Saving a visit or fleet vessel selects the relevant view.
- A fixed 100% fleet-readiness card was removed because it did not reflect calculated data. Fleet count, capacity and active-cycle metrics remain.
- Repeated visit metadata moved into expandable arrival/reading details. Required data remains available in operation dialogs.
- Two separate modal implementations now share one native dialog, with focus containment, Escape handling, scroll locking and focus restoration.

## Visual system

The prior implementation mixed a dark sidebar with cream content panels. Per the requested
dark direction, a consistent charcoal palette now covers the content, forms and dialogs.
VIGOR green remains the action/positive accent; teal identifies information, amber indicates
attention and red indicates errors. Semantic Tailwind tokens replace repeated color literals.

Shared improvements include quieter card borders, consistent spacing and type hierarchy,
tabular numeric values, restrained status badges, visible keyboard focus, reduced-motion
support, dark native form controls, readable table headers and scoped table scrolling.
Primary, secondary, ghost and icon button patterns live in the global stylesheet.

No backend behavior, authentication policy, operational calculations or persistence code
was changed in this UI pass. The reset-scenario action remains available in the account menu;
evaluation role switching remains in the sidebar. No operational records were created or
edited during browser verification.

## Important files

| Area | Files and changes |
| --- | --- |
| Theme and shell | `src/index.css`, `index.html`, `src/App.tsx`: semantic palette, shared control styles, responsive content spacing and skip link. |
| Navigation | `src/components/Sidebar.tsx`, `src/components/TopBar.tsx`: quieter navigation, consolidated account/status controls and native mobile drawer. |
| Shared primitives | `src/components/ui/KpiCard.tsx`, `Modal.tsx`, `StatusBadge.tsx`, new `Feedback.tsx`: typography, keyboard access, shared dialog, visit statuses and loading/empty/error states. |
| Live dashboards | `src/components/ui/LiveVisitDashboard.tsx`, `src/pages/DashboardSummary.tsx`: separate summary and operational presentations using the same existing data. |
| Vessel workflows | `src/pages/Vessels.tsx`, `src/components/ui/VesselVisitList.tsx`, `AddVesselVisit.tsx`, `EditVesselOperation.tsx`: focused views, compact row actions and form hierarchy. |
| Administration | `src/pages/Admin.tsx`: shorter page/tab labels and consistent styling; existing administrative behavior retained. |
| Other views | Remaining files below use the shared palette; Control Tower also reuses visit-status and loading components. |

Complete frontend file inventory for this pass:

- [index.html](../index.html)
- [src/App.tsx](../src/App.tsx)
- [src/components/AiAssistantModal.tsx](../src/components/AiAssistantModal.tsx)
- [src/components/Sidebar.tsx](../src/components/Sidebar.tsx)
- [src/components/TopBar.tsx](../src/components/TopBar.tsx)
- [src/components/ui/AddVesselVisit.tsx](../src/components/ui/AddVesselVisit.tsx)
- [src/components/ui/ControlTowerTimeline.tsx](../src/components/ui/ControlTowerTimeline.tsx)
- [src/components/ui/DualProgress.tsx](../src/components/ui/DualProgress.tsx)
- [src/components/ui/EditVesselOperation.tsx](../src/components/ui/EditVesselOperation.tsx)
- [src/components/ui/Feedback.tsx](../src/components/ui/Feedback.tsx)
- [src/components/ui/KpiCard.tsx](../src/components/ui/KpiCard.tsx)
- [src/components/ui/LiveControlTower.tsx](../src/components/ui/LiveControlTower.tsx)
- [src/components/ui/LiveVisitDashboard.tsx](../src/components/ui/LiveVisitDashboard.tsx)
- [src/components/ui/Modal.tsx](../src/components/ui/Modal.tsx)
- [src/components/ui/OperationalChecklist.tsx](../src/components/ui/OperationalChecklist.tsx)
- [src/components/ui/OverdueTasks.tsx](../src/components/ui/OverdueTasks.tsx)
- [src/components/ui/SiteRegistry.tsx](../src/components/ui/SiteRegistry.tsx)
- [src/components/ui/StatusBadge.tsx](../src/components/ui/StatusBadge.tsx)
- [src/components/ui/VesselCycleTimeline.tsx](../src/components/ui/VesselCycleTimeline.tsx)
- [src/components/ui/VesselVisitList.tsx](../src/components/ui/VesselVisitList.tsx)
- [src/index.css](../src/index.css)
- [src/pages/Admin.tsx](../src/pages/Admin.tsx)
- [src/pages/AlertsPage.tsx](../src/pages/AlertsPage.tsx)
- [src/pages/Berths.tsx](../src/pages/Berths.tsx)
- [src/pages/ControlTower.tsx](../src/pages/ControlTower.tsx)
- [src/pages/Dashboard.tsx](../src/pages/Dashboard.tsx)
- [src/pages/DashboardSummary.tsx](../src/pages/DashboardSummary.tsx)
- [src/pages/Fuel.tsx](../src/pages/Fuel.tsx)
- [src/pages/Login.tsx](../src/pages/Login.tsx)
- [src/pages/ManufacturerQueue.tsx](../src/pages/ManufacturerQueue.tsx)
- [src/pages/Payments.tsx](../src/pages/Payments.tsx)
- [src/pages/Reports.tsx](../src/pages/Reports.tsx)
- [src/pages/VesselDetail.tsx](../src/pages/VesselDetail.tsx)
- [src/pages/Vessels.tsx](../src/pages/Vessels.tsx)
- [src/pages/Voyages.tsx](../src/pages/Voyages.tsx)

This report is saved in `docs/ui-refinement.md`. Other modified files visible in Git belong
to the earlier authorized fixes, not new backend work in this UI pass.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed; existing bundle-size warning remains (approximately 538 kB minified JavaScript).
- `npm test`: all six tests passed.
- Chrome: main navigation destinations inspected at desktop and 1024px laptop width; one page heading and no document-level horizontal overflow.
- Summary and navigation inspected at 390px width; operational tables retain local horizontal scrolling.
- Add Visit and Edit Operation dialogs checked; keyboard focus remains inside and Escape closes them.
- Vessel views, vessel detail, administration, assistant and dashboard API-error recovery checked without runtime exceptions.

## Review screenshots

Screenshots are local artifacts (ignored by Git):

- [Executive summary](../artifacts/ui-polish/summary-desktop.png)
- [Operations workspace](../artifacts/ui-polish/Operations-Dashboard.png)
- [Mobile summary](../artifacts/ui-polish/summary-mobile.png)
- [Add visit](../artifacts/ui-polish/add-visit.png)
- [Edit operation](../artifacts/ui-polish/edit-operation.png)
- [Assistant](../artifacts/ui-polish/assistant.png)

## Remaining considerations

- Large operational tables may benefit from pagination and saved filters as the dataset grows.
- Some older planning views still carry demonstration-specific copy and assumptions; reviewing their data semantics is separate from this visual pass.
- The existing production bundle-size warning could be addressed later with route-level code splitting.

All changes remain local for review. Nothing was committed or pushed.
