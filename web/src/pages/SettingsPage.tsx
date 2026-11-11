import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../api/client";
import { PageHead, Panel, Shell, inputClass, primaryButton, quietButton } from "../shell/Shell";
import { ThemeToggle } from "../ThemeToggle";

export function SettingsPage() {
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: ["settings"], queryFn: api.settings, retry: false });
  const categories = useQuery({ queryKey: ["categories"], queryFn: api.categories, retry: false });
  const [name, setName] = useState("");
  const [soon, setSoon] = useState("");
  const [message, setMessage] = useState("");

  const addCategory = async () => {
    setMessage("");
    try {
      await api.createCategory(name);
      setName("");
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The category could not be saved.");
    }
  };

  const saveSoon = async () => {
    const days = Number(soon || settings.data?.soon_days || 7);
    await api.patchSettings(days);
    await queryClient.invalidateQueries({ queryKey: ["settings"] });
  };

  const download = async () => {
    const body = await api.exportJson();
    const blob = new Blob([JSON.stringify(body, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "cards-backup.json";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const restore = async (file: File) => {
    setMessage("");
    try {
      const body: unknown = JSON.parse(await file.text());
      await api.importJson(body);
      setMessage("Backup restored.");
      await queryClient.invalidateQueries();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The backup was not restored.");
    }
  };

  return (
    <Shell>
      <div>
        <PageHead kicker="Preferences" title="Settings" />
        <div className="mt-8 grid gap-3 lg:grid-cols-2">
          <Panel title="Theme">
            <p className="m-0 mb-3 text-sm text-muted">Ivory, teal, and coral. Or black, white, and gold.</p>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-md p-3" style={{ background: "#f3eee8", color: "#17645f" }}>
                Light
                <span className="mt-2 block h-2 rounded-full" style={{ background: "#ff6845" }} />
              </div>
              <div className="rounded-md p-3" style={{ background: "#08090b", color: "#f5f3ef" }}>
                Dark
                <span className="mt-2 block h-2 rounded-full" style={{ background: "#ffc900" }} />
              </div>
            </div>
            <ThemeToggle />
          </Panel>
          <Panel title="Currency">
            <p className="m-0">INR</p>
            <p className="m-0 mt-2 text-sm text-muted">Amounts are stored in paise.</p>
          </Panel>
          <Panel title="Categories">
            <ul className="m-0 list-none p-0 text-sm">
              {categories.data?.map((category) => <li key={category.id} className="py-1">{category.name}</li>)}
            </ul>
            <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); void addCategory(); }}>
              <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="New category" />
              <button type="submit" className={primaryButton}>Add</button>
            </form>
          </Panel>
          <Panel title="Reminders">
            <p className="m-0 text-sm text-muted">Due soon is {settings.data?.soon_days ?? 7} days. No messages are sent.</p>
            <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); void saveSoon(); }}>
              <input className={inputClass} inputMode="numeric" value={soon} placeholder={String(settings.data?.soon_days ?? 7)} onChange={(event) => setSoon(event.target.value)} />
              <button type="submit" className={quietButton}>Save</button>
            </form>
          </Panel>
          <Panel title="Backup">
            <div className="flex flex-wrap gap-3">
              <button type="button" className={primaryButton} onClick={() => void download()}>Download JSON</button>
              <label className={quietButton}>
                Restore
                <input className="sr-only" type="file" accept="application/json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void restore(file); }} />
              </label>
            </div>
            <p className="m-0 mt-3 text-sm text-muted">Restore runs only when the ledger is empty.</p>
            {message ? <p className="text-sm text-secondary">{message}</p> : null}
          </Panel>
        </div>
      </div>
    </Shell>
  );
}
