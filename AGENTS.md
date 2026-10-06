<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Data access goes only through src/lib/api.ts (service layer); verification rules live in src/lib/verification.ts — so the demo dataset can be swapped for a real collector without UI changes.
- Keep shared review, import-history, and audit persistence behind the existing service layer; the project intentionally uses public shared access without sign-in.
