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

## CI triage — 2026-09-27
- Isolated v10.4 workflow succeeded: syntax checks, cash-flow unit tests, and integration wiring.
- Full suite: 344 passed / 9 failed. Failures: two Business Health Score boundary assertions; chart-animation.test.js; clinical-intelligence.test.js; clinical-ui.test.js; daily-memo-edit.test.js; legacy-today-form-removal cache release assertion; score-ring-animation.test.js; today-v9-ui.test.js.
- The cache-release assertion expects v9506 but sw.js currently identifies v9602. These failures require separate baseline comparison and must not be described as verified pre-existing until compared against main at the same test revision.
- No production merge or deployment is authorized by this result.

## iPhone Safari / PWA acceptance checklist (pending real device)
1. Back up the current Dashboard data before opening a preview; do not test against the production URL.
2. On the preview, open Finance and verify the new card is visible, legible, and scrollable without horizontal clipping or frozen vertical scrolling.
3. Save a test month with opening 3,000,000, closing 3,200,000, estimated cash profit 250,000; verify +200,000 movement, 6,800,000 remaining, 32.0% progress, and -50,000 unclassified difference.
4. Reload Safari and resume the PWA; verify saved values persist. Switch months and verify records remain isolated.
5. Clear test-month fields and confirm missing balances display as missing, not zero; confirm negative estimated profit is allowed but negative bank balance is rejected.
6. Open Kagemusha, select 「現金は増えた？」 and ask 「預金1000万円まで？」; verify the answers agree with Finance and never approve investment based solely on a balance.
7. Confirm existing Today, Finance, input, and backup flows remain usable. Record screenshots and device/iOS/browser version.
8. Only after review, decide separately whether to merge; no automatic deployment.

## Verified main baseline comparison — 2026-09-27
- Run 36298151307 checked out unmodified main under Node 22: 344 tests, 335 pass, 9 fail.
- v10.4 branch full suite: 353 tests, 344 pass, 9 fail. The nine failure names match main; no additional failing test was observed.
- Isolated v10.4 job passed in the same run. This is a baseline comparison, not a waiver of the nine existing failures or real-device acceptance.
- Main baseline log is retained as the workflow artifact. PR remains draft; no merge/deployment.
