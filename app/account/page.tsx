"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Profile } from "@/lib/data";
import { PageHead } from "@/components/ui";

const fields: [keyof Profile, string][] = [
  ["firstName", "First name"], ["lastName", "Last name"], ["email", "Email"], ["phone", "Phone"],
  ["company", "Company"], ["role", "Role"], ["country", "Country"], ["timezone", "Timezone"],
];

export default function Account() {
  const { profile, saveProfile } = useStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(profile);
  const [saved, setSaved] = useState(false);

  return (
    <>
      <PageHead title="Account" sub="Your personal and company details.">
        {!editing && <button className="btn" onClick={() => { setForm(profile); setSaved(false); setEditing(true); }}>Edit details</button>}
      </PageHead>
      <form className="card p-6" onSubmit={(e) => { e.preventDefault(); saveProfile(form); setEditing(false); setSaved(true); }}>
        <div className="grid gap-5 sm:grid-cols-2">
          {fields.map(([k, label]) => (
            <div key={k}>
              <label className="label" htmlFor={k}>{label}</label>
              {editing
                ? <input id={k} className="input mt-1" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required />
                : <div className="mt-1 border border-transparent py-2 text-sm">{profile[k]}</div>}
            </div>
          ))}
        </div>
        {editing && (
          <div className="mt-6 flex gap-3 border-t border-line pt-6">
            <button type="submit" className="btn btn-primary">Save changes</button>
            <button type="button" className="btn" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        )}
        {saved && <p className="mt-6 border-t border-line pt-4 text-sm text-accent">Details updated.</p>}
      </form>
    </>
  );
}
