# Sandbox test data

Customizable test data for sandbox/demo mode is loaded from JSON files:

- **`sandbox-individual.json`** – personal (user) account
- **`sandbox-sme.json`** – business (SME) account

- **Bank connected (Plaid):** the app displays only the sandbox JSON data for the user's account type (no real bank data shown).
- **Bank not connected:** the app displays the user's own data (transactions, balance, subscriptions stored in the DB). When the DB is empty, sandbox JSON is shown as fallback. Edit the JSON files to change sandbox/demo content.

## JSON structure

Each file must include:

```json
{
  "account": {
    "displayName": "Optional label",
    "currentBalance": 12400
  },
  "transactions": [
    {
      "id": "unique-id",
      "date": "YYYY-MM-DD",
      "amount": 100,
      "merchant": "Name",
      "type": "income",
      "category": "Category"
    }
  ],
  "subscriptions": [
    {
      "id": "sub-1",
      "merchant": "Service",
      "amount": 9.99,
      "nextDueDate": "YYYY-MM-DD",
      "frequency": "monthly"
    }
  ]
}
```

- **account.currentBalance** – starting balance shown in the app.
- **transactions** – full history; each item has `id`, `date`, `amount`, `merchant`, `type` (`"income"` or `"expense"`), and `category`.
- **subscriptions** – optional; `frequency` is `"monthly"` or `"weekly"`.

Edit these JSON files to change sandbox account and transaction history without changing code.
