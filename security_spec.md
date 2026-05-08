# Security Spec: Kash Finance App

## 1. Data Invariants
- Every `Transaction` must have a `userId` matching the request auth UID.
- `Transaction` IDs must be safe and unique.
- `amount` must be a positive number.
- `type` must be either 'expense' or 'income'.
- Users can only read, create, update, or delete their own data.

## 2. The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a transaction with `userId: "attacker_id"`.
2. **Access Violation**: Attempt to read `/users/victim_user/transactions`.
3. **Ghost Field**: Attempt to add `verifiedByAdmin: true` to a transaction.
4. **Type Poisoning**: Attempt to set `amount: "one million"`.
5. **Negative Wealth**: Attempt to create a transaction with `amount: -100`.
6. **Description Exhaustion**: Attempt to write a 1MB string to `description`.
7. **Immutable Bypass**: Attempt to change `userId` during an update.
8. **Path Poisoning**: Attempt to write to `/users/%2F..%2Fsys_config/transactions/evil`.
9. **Date Invalidity**: Attempt to set `date: "not-a-date"`.
10. **Settings Hijack**: Attempt to update another user's `settings`.
11. **Empty Transaction**: Attempt to create a transaction missing required fields like `category`.
12. **Orphaned Write**: Attempt to write a transaction to a user path that doesn't exist (if parent validation is enforced).

## 3. Test Cases
The `firestore.rules` will be formulated to deny all the above.
