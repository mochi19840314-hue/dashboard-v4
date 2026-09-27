# v10.4 Cash Flow Intelligence — implementation contract

Tracking: #185. This document is a specification, not a deployed feature.

## Definitions
- Actual bank movement = closing balance − opening balance for the same set of hospital accounts and period.
- Existing hospital cash profit is an operational estimate, **not** actual bank movement.
- Reconciliation difference = actual bank movement − estimated cash movement, with explicit unclassified remainder.
- Do not infer missing balance, expense, or transfer as zero.
- Transfers between included hospital accounts must cancel. Household transfers already debited from hospital accounts must not be deducted again.
- Show tax-inclusive/exclusive and timing basis; distinguish sales booked from card deposits received.
- Principal repayment, taxes, equipment investment, owner drawings/contributions and new loans must remain distinguishable.
- Target gap = max(0, 10,000,000 − latest confirmed hospital bank balance). Show forecast only if enough observed periods and positive sustainable monthly movement exist; otherwise “算出不可”.

## UI acceptance
1. Finance: opening/closing bank balance, actual movement, existing cash profit, reconciliation difference, target progress.
2. Today: at most one concise cash-status line, without duplicating monthly cards.
3. Kagemusha: distinguish profit from liquidity; no definitive investment approval from balance alone.
4. Missing values show “未入力/確認できません”, never fabricated 0.
5. Keep current gross profit, operating margin and cash margin definitions and labels unchanged unless explicitly migrated.

## Engineering acceptance
- Inspect current main implementation and PR #177–#184 before touching runtime code.
- Preserve localStorage keys and historical records; additive migration only, with rollback.
- Add tests for missing inputs, month boundaries, inter-account transfers, card settlement timing, principal repayments, owner transfers, and double counting.
- Record baseline CI failures separately from regressions.
- Verify iPhone Safari vertical scrolling, saving, reload and PWA resume.
- Do not merge or deploy until tests and actual-device review.
