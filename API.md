# ExamCraft REST API

All responses follow this shape:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```

Errors return:

```json
{
  "success": false,
  "message": "Validation failed",
  "details": {}
}
```

## Core routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/plans`
- `GET /api/dashboard`
- `GET /api/organizations`
- `PUT /api/organizations`
- `GET /api/papers`
- `POST /api/papers`
- `GET /api/papers/:id`
- `POST /api/papers/:id/duplicate`
- `PATCH /api/papers/:id/status`
- `PUT /api/papers/:paperId/questions`
- `GET /api/papers/:id/export/:format`
- `POST /api/uploads/intent`
- `GET /api/question-bank`
- `POST /api/question-bank`
- `POST /api/question-bank/random`
- `POST /api/papers/:paperId/versions`
- `GET /api/shared-links`
- `POST /api/shared-links`
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `GET /api/support/tickets`
- `POST /api/support/tickets`
- `POST /api/support/tickets/:id/replies`
- `POST /api/billing/payments`
- `GET /api/billing/payments`
- `POST /api/billing/coupons`
- `PATCH /api/billing/payments/:id/:decision`
- `GET /api/admin/dashboard`

## Plan enforcement

The backend owns all critical limits. Paper creation and question saving validate:

- Current plan
- Monthly paper usage
- Maximum questions per paper
- Export permissions
- Watermark requirements

Frontend validation is treated as UX only.
