# Implementation Checklist - Phase 1

## Sprint 1: Foundation
- [ ] Bootstrap `.NET 8` solution (Api, Application, Domain, Infrastructure)
- [ ] Add platform DB + tenant DB contexts
- [ ] Implement tenant resolution middleware
- [ ] Implement JWT auth + refresh flow
- [ ] Implement permission-based authorization handler
- [ ] Add license guard middleware

## Sprint 2: Masters + Security
- [ ] Branch CRUD
- [ ] Location CRUD
- [ ] Customer CRUD
- [ ] Roles CRUD
- [ ] Permission assignment APIs
- [ ] User CRUD + role assignment

## Sprint 3: Core Transaction Flow
- [ ] Consignment CRUD + status transitions
- [ ] Challan create/list/detail
- [ ] Lorry payment entries (part/balance)
- [ ] Invoice create/post/print payload
- [ ] Money receipt create/list
- [ ] Outstanding calculation query

## Sprint 4: Reports + Commercial Controls
- [ ] Booking report API
- [ ] Lorry payment report API
- [ ] Outstanding report API
- [ ] Usage sync job (consignment counters)
- [ ] Plan limit enforcement + warnings
- [ ] Subscription/renewal endpoints

## Done criteria for Phase 1
- [ ] End-to-end flow works: consignment -> challan -> invoice -> receipt
- [ ] Role restrictions verified for each module action
- [ ] Quota enforcement tested
- [ ] Basic printable invoice and receipt outputs available
- [ ] Smoke test completed for at least two tenant DBs

