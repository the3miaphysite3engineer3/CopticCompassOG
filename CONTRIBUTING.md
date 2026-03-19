# Contributing

Thanks for helping improve the dictionary and portfolio.

## What Contributions Are Most Helpful

- Dictionary corrections, additions, or metadata cleanup
- UI improvements for readability and pedagogy
- Grammar and learning content
- README, documentation, and accessibility improvements

## Dictionary Workflow

The current source-of-truth workflow is Excel-first.

1. Update the spreadsheet expected by `scripts/parseExcel.ts`.
   The parser currently reads `~/Desktop/Coptic/marcion-test.xlsx`.
2. Regenerate the dictionary JSON:

   ```bash
   npx ts-node scripts/parseExcel.ts
   ```

3. If you also need to refresh the Dutch dataset, run:

   ```bash
   npx ts-node scripts/translateDictionary.ts
   ```

4. Review the generated diffs in:
   - `public/data/dictionary.json`
   - `public/data/woordenboek.json`

If your local Excel source lives somewhere else, update the path inside `scripts/parseExcel.ts` before regenerating data.

## Pull Request Notes

Please keep PRs focused and explain:

- what changed
- why it changed
- whether the update is editorial, lexical, technical, or visual
- any source or scholarly rationale behind dictionary edits

## Suggested Validation

Before opening a PR, run:

```bash
npm run build
```

If you touched lint-clean areas, also run:

```bash
npm run lint
```

## Style Guidelines

- Preserve Coptic spelling and dialect notation exactly unless the change is intentional
- Prefer small, reviewable commits over broad unrelated changes
- Flag uncertain readings or reconstructions clearly in the PR description
- Keep UI additions consistent with the academic and reference-focused character of the app
