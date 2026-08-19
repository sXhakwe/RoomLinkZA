# MVP traceability

| Requirement | Frontend | API | Data |
| --- | --- | --- | --- |
| Registration/login | `AuthPage.jsx` | `/api/auth/*` | `users` |
| User profiles | `PeoplePage.jsx` | `/api/users/me/*` | `users`, `roommate_preferences` |
| Listings CRUD/details | `ListingsPage.jsx` | `/api/listings/*` | `listings` |
| Search/filtering | `ListingsPage.jsx` | `GET /api/listings` | listing search index |
| Roommate matching | `PeoplePage.jsx` | `GET /api/users/matches` | preferences, blocks |
| Social feed | `SocialPage.jsx` | `/api/social/*` | posts, comments, reactions |
| Private messaging | `MessagesPage.jsx` | `/api/messages/*` | conversations, members, messages |
| Saved listings | `SavedPage` | listing save routes | `saved_listings` |
| Notifications | `NotificationsPage` | `/api/notifications/*` | `notifications` |
| Reporting/blocking | report modal, matches | `/api/reports`, block routes | reports, blocks |
| Admin dashboard | `AdminPage.jsx` | `/api/admin/dashboard` | aggregate queries |
| User/content moderation | `AdminPage.jsx` | `/api/admin/*` | status/visibility fields |
| Connection requests / My Matches | `ConnectionsPage.jsx` | `/api/connections/*` | `connections` |
| Message reactions | `MessagesPage.jsx` | `/api/messages/messages/:id/reactions` | `message_reactions` |
| Events, RSVP, past-event ratings | `EventsPage.jsx` | `/api/events/*` | `events`, `event_rsvps`, `event_ratings` |
| Household chores | `LivingPage.jsx` | `/api/living/chores/*` | `households`, `household_members`, `chores` |
| Shared bills and payments | `LivingPage.jsx` | `/api/living/bills/*` | `bills`, `bill_shares` |
