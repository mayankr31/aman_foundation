# Agent Instructions

- **Database:** Always use `db push` to sync database changes. Never create migrations unless explicitly asked.
- **Lint:** Run lint checks only on files changed during the current session. Ignore pre-existing errors and warnings. Do not fix unrelated lint issues.
- **Build:** Do not run build commands unless explicitly requested.
- **Dev server:** Never start the development server (`npm run dev` or equivalent). The user will start it.
- **Existing changes:** Preserve the user's existing work. Never overwrite or revert unrelated changes.
- **Code quality:** Follow existing project conventions and reuse existing code where possible. Avoid unnecessary dependencies.
- **Mobile responsiveness:** Ensure all UI changes are responsive and work properly on mobile, tablet, and desktop screens. Follow existing responsive design patterns and avoid breaking layouts on smaller screens.
- **Verification:** Review your changes and run targeted lint checks before finishing.
- **Final response:** Always provide a walkthrough of the changes made, including the files modified, what changed in each file, how the changes work, and how the application will behave as a result. Mention lint results and any manual verification needed. Keep the explanation clear and concise.