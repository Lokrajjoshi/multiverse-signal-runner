# Contributing to Multiverse Signal Runner

Thank you for testing or improving the mission.

## Before you start

1. Play the live build at https://lokrajjoshi.github.io/multiverse-signal-runner/.
2. Check existing issues before opening a new one.
3. For bugs, include your browser, device, steps to reproduce, expected behavior, and actual behavior.
4. For accessibility feedback, mention keyboard, touch, focus, contrast, motion, or screen-reader impact.

## Local validation

The project has no build step and uses native Node.js tests:

```bash
npm test
npx serve .
```

Keep changes focused and verify that the game still works with keyboard and touch controls.

## Pull requests

A useful pull request should include:

- a concise problem statement;
- the technical approach;
- tests or manual validation performed;
- screenshots or a short recording for visual changes;
- accessibility considerations for interaction or motion changes.

Please use a descriptive title and explain any trade-offs. Small, reviewable changes are welcome.

## Project principles

- Keep the experience dependency-free where practical.
- Preserve reduced-motion support.
- Keep domain rules testable and separate from rendering.
- Prefer evidence-led improvements over decorative complexity.
- Never add artificial stars, votes, authorship, or contribution activity.

— Lokraj Joshi
