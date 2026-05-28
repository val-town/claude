---
name: email
description: Use when a val sends email, receives email, or is triggered by an incoming email. Covers email-type vals (the Email handler shape, attachment limits, the assigned val email address) and sending mail via std/email.
triggers: [email, mail, inbox, send, sending, smtp, imap, attachment, message, notification]
---

# Email

Val Town supports both directions: vals can be **triggered by** incoming mail (email-type vals) and can **send** mail via `std/email`.

## Receiving email — email-type vals

Email vals (`fileType: "email"`) run when a message is delivered to the val's assigned address.

```ts
// Learn more: https://docs.val.town/vals/email/
// Email type: {
//   from: string,
//   to: string[],
//   subject?: string,
//   text?: string,
//   html?: string,
//   attachments: File[],
//   headers: Record<string, string>
// }
export default async function (e: Email) {
  console.log(e.from, e.subject, e.text);
}
```

The file must have an `export` — `export default` for the handler.

**Maximum 30MB per message**, including attachments. Larger messages will be rejected.

### Reading the assigned address

When you list files or create an email-type file, the response includes `links.email` — the address that triggers this val. **Always read this from the API response. Never construct an email address yourself** — the format is owned by the platform and may change.

## Sending email — `std/email`

For outgoing mail, import from `std/email`:

```ts
import { email } from "https://esm.town/v/std/email";

await email.send({
  to: "user@example.com",
  subject: "Hello",
  text: "Message body",
});
```

`email.send` accepts the same shape you'd expect: `to`, `subject`, `text`, `html`, and standard fields. By default mail is sent from the val owner's address.

## Replying to an incoming message

Combine the two — read the inbound `from` in an email-type handler, then call `email.send` to reply:

```ts
import { email } from "https://esm.town/v/std/email";

export default async function (e: Email) {
  await email.send({
    to: e.from,
    subject: `Re: ${e.subject ?? ""}`,
    text: "Got it, thanks!",
  });
}
```

## Verifying changes

After editing an email-type val, use `run_file` with a sample `Email` payload to invoke the handler manually instead of waiting for a real incoming message. For send-only vals, run the script the same way and check `get_logs` for delivery errors.
