THE WORKSHOP

Edit the story title or its local web-menu label. The story and row inherit the
source title; the menu keeps its own label. Each accepted edit produces a new
revision and a receipt. Invalid or stale edits leave the accepted session intact.
Changes stay in this tab and reset on reload.

The inspector exposes sources, expressions, processes, HTML and receipts. Preview
navigation follows checked page-open descriptors in script-free sandboxed frames.
The row action is displayed without an event binding. No edit is saved to an
account, repository or shared record.

Source owners in the site repository:
- source/encounter/example.json: typed input for ec.prepare, ec.run and ec.patch.
- source/workshop/document.html: interface.
- source/stylesheets/contract.json: stylesheet routing and structured CSS owners.
- algebra/workshop-lab.process.json: checked edits and snapshots.
- algebra/workshop-session.process.json: session, revisions, inspector and previews.
- algebra/reader-workshop-publication.process.json: documents and runtime bundles.

Use npm run author -- proposal.json for editable sources, then npm run build.
The repository README and source/authoring-contract.json define the proposal
format, authority and validation checks.

Files under sources/ are byte-pinned comparison contracts, programmes and
mechanisms. Their hashes identify those files; the inspector shows the active
edited session.
