import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/rl";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/_dash/about")({
  head: () => meta("About", "ResultLens NG is a politically neutral civic technology prototype for large-scale election result verification."),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="About ResultLens NG" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="What it is" className="lg:col-span-2">
          <div className="space-y-3 text-[14px] leading-relaxed text-muted-foreground">
            <p>ResultLens NG is a civic technology prototype designed to make large-scale election-result verification more accessible to observers, journalists, researchers and civic organizations.</p>
            <p>It is <b className="text-foreground">politically neutral</b>. It does not endorse candidates, parties or electoral outcomes. It provides data and evidence for independent review.</p>
            <p>The current build runs on clearly labelled DEMO / SYNTHETIC DATA. A separate collector for publicly available result data will be connected once its source has been validated.</p>
          </div>
        </Panel>
        <Panel title="Data status">
          <ul className="space-y-2 text-[12px]">
            <li className="flex justify-between"><span>Mode</span><span className="num">DEMO</span></li>
            <li className="flex justify-between"><span>Real source connected</span><span className="num">No</span></li>
            <li className="flex justify-between"><span>Elections supported</span><span className="num">Any (config)</span></li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
