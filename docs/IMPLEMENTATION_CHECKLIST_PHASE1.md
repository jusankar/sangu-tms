# Implementation Checklist - Phase 1

## Sprint 1: Foundation
- [x] Bootstrap `.NET 8` solution (Api, Application, Domain, Infrastructure)
- [x] Add platform DB + tenant DB contexts
- [x] Implement tenant resolution middleware
- [x] Implement JWT auth + refresh flow
- [x] Implement permission-based authorization handler
- [x] Add license guard middleware

## Sprint 2: Masters + Security
- [x] Branch CRUD
- [x] Location CRUD
- [x] Customer CRUD
- [x] Roles CRUD
- [x] Permission assignment APIs
- [x] User CRUD + role assignment

## Sprint 3: Core Transaction Flow
- [x] Consignment CRUD + status transitions
- [x] Challan create/list/detail
- [x] Lorry payment entries (part/balance)
- [x] Invoice create/post/print payload
- [x] Money receipt create/list
- [x] Outstanding calculation query

## Sprint 4: Reports + Commercial Controls
- [x] Booking report API
- [x] Lorry payment report API
- [x] Outstanding report API
- [ ] Usage sync job (consignment counters)
- [ ] Plan limit enforcement + warnings
- [ ] Subscription/renewal endpoints

## Done criteria for Phase 1
- [x] End-to-end flow works: consignment -> challan -> invoice -> receipt
- [x] Role restrictions verified for each module action
- [ ] Quota enforcement tested
- [ ] Basic printable invoice and receipt outputs available
- [ ] Smoke test completed for at least two tenant DBs
