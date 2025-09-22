# Environment Configuration

## JWT claims required by Worker
```json
{
  "iss": "clientportal",
  "sub": "<user uuid>",
  "org_id": "<org uuid>",
  "role": "admin|internal|external",
  "company_ids": ["<uuid>", "..."]
}
```
