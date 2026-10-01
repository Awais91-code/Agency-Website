import { updateEstimateRuleAction } from "@/app/admin/quote-rules/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSupabaseAdminClient } from "@/lib/db/admin";

export const dynamic = "force-dynamic";

export default async function QuoteRulesPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const query = await searchParams;
  const admin = getSupabaseAdminClient();
  const { data: rules, error } = await admin.from("estimate_rules").select("*").order("rule_type").order("sort_order");
  if (error) throw new Error(`Could not load estimate rules: ${error.message}`);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">M08 · Quote engine</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Estimate rules</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">These values generate a non-binding planning range. Final custom pricing still requires human review.</p>
      </div>

      {query.error ? <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-sm text-red-700">{query.error}</div> : null}
      {query.saved ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700">Saved {query.saved}.</div> : null}

      <div className="grid gap-4">
        {(rules ?? []).map((rule) => (
          <Card key={rule.id}>
            <CardContent className="p-5">
              <form action={updateEstimateRuleAction} className="grid gap-4 xl:grid-cols-[minmax(16rem,1.4fr)_9rem_9rem_8rem_7rem_auto] xl:items-end">
                <input type="hidden" name="id" value={rule.id} />
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">{rule.rule_type} · {rule.rule_key}</p>
                  <Label htmlFor={`label-${rule.id}`} className="mt-2 block">Label</Label>
                  <Input id={`label-${rule.id}`} name="label" defaultValue={rule.label} className="mt-2" required />
                </div>
                <div>
                  <Label htmlFor={`min-${rule.id}`}>Min</Label>
                  <Input id={`min-${rule.id}`} name="amountMin" type="number" min={0} step={100} defaultValue={rule.amount_min} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor={`max-${rule.id}`}>Max</Label>
                  <Input id={`max-${rule.id}`} name="amountMax" type="number" min={0} step={100} defaultValue={rule.amount_max} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor={`multiplier-${rule.id}`}>Multiplier</Label>
                  <Input id={`multiplier-${rule.id}`} name="multiplier" type="number" min="0.1" max="10" step="0.01" defaultValue={String(rule.multiplier)} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor={`currency-${rule.id}`}>Currency</Label>
                  <Input id={`currency-${rule.id}`} name="currency" maxLength={3} defaultValue={rule.currency} className="mt-2 uppercase" />
                </div>
                <div className="flex items-center gap-3 xl:pb-1">
                  <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="isActive" defaultChecked={rule.is_active} /> Active</label>
                  <Button type="submit" size="sm">Save</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
