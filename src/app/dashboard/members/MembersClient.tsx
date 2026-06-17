"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  ChevronLeft,
  Copy,
  Check,
  Loader2,
  Mail,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { ROLES, ROLE_LABEL, ROLE_HINT, type Role } from "@/lib/roleLabels";

type Member = {
  id: string;
  email: string | null;
  name: string | null;
  role: Role;
};
type Invite = {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  expiresAt: string;
};
type Workspace = { domain: string; name: string; members: number };
type Data = {
  isSuperAdmin: boolean;
  domain: string | null;
  self: string;
  workspaces?: Workspace[];
  members: Member[];
  invitations: Invite[];
};

const selectClass =
  "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30";

export default function MembersClient({
  isSuperAdmin,
}: {
  isSuperAdmin: boolean;
}) {
  const [data, setData] = useState<Data | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("editor");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{
    text: string;
    link?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (forDomain: string | null) => {
    try {
      const qs = forDomain ? `?domain=${encodeURIComponent(forDomain)}` : "";
      const res = await fetch(`/api/members${qs}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load members");
      setData(json);
      setDomain(json.domain ?? null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(null), 0);
    return () => clearTimeout(t);
  }, [load]);

  async function submitInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!domain) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      const res = await fetch("/api/members/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole, domain }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to invite");
      setInviteEmail("");
      setInviteMsg(
        json.emailed
          ? { text: `Invite emailed to ${inviteEmail}.` }
          : {
              text: "Invite created. Share this link (email could not be sent from your account):",
              link: json.link,
            }
      );
      await load(domain);
    } catch (e) {
      setInviteMsg({ text: e instanceof Error ? e.message : "Failed to invite" });
    } finally {
      setInviting(false);
    }
  }

  async function changeRole(userId: string, role: Role) {
    setBusyId(userId);
    try {
      const res = await fetch(`/api/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to change role");
      await load(domain);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to change role");
    } finally {
      setBusyId(null);
    }
  }

  async function removeMember(userId: string, label: string) {
    if (!confirm(`Remove ${label} from the workspace? Their campaigns stay.`)) {
      return;
    }
    setBusyId(userId);
    try {
      const res = await fetch(`/api/members/${userId}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Failed to remove");
      await load(domain);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to remove");
    } finally {
      setBusyId(null);
    }
  }

  async function revokeInvite(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/members/invite?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      await load(domain);
    } finally {
      setBusyId(null);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" /> Loading workspace...
      </div>
    );
  }
  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (!data) return null;

  // Super-admin without a chosen workspace: show the picker.
  if (data.isSuperAdmin && !data.domain) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Workspaces</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Pick a workspace to manage its members.
        </p>
        <ul className="mt-6 space-y-2">
          {(data.workspaces ?? []).map((w) => (
            <li key={w.domain}>
              <button
                onClick={() => load(w.domain)}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <span className="flex items-center gap-2.5">
                  <Building2 size={16} className="text-indigo-600" />
                  <span className="font-medium text-slate-900">{w.domain}</span>
                </span>
                <span className="text-xs text-slate-500">
                  {w.members} member{w.members === 1 ? "" : "s"}
                </span>
              </button>
            </li>
          ))}
          {(data.workspaces ?? []).length === 0 && (
            <li className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No client workspaces yet.
            </li>
          )}
        </ul>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {isSuperAdmin && (
            <button
              onClick={() => {
                setData({ ...data, domain: null });
                setDomain(null);
                load(null);
              }}
              className="mb-1 inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-800"
            >
              <ChevronLeft size={13} /> All workspaces
            </button>
          )}
          <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <Users size={18} className="text-indigo-600" />
            {data.domain}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {data.members.length} member{data.members.length === 1 ? "" : "s"} ·
            invite-only workspace
          </p>
        </div>
      </div>

      {/* Invite */}
      <form
        onSubmit={submitInvite}
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <UserPlus size={16} className="text-indigo-600" />
          Invite a teammate
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder={`name@${data.domain}`}
            className="min-w-56 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as Role)}
            className={selectClass}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-linear-to-br from-sky-500 to-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow transition hover:brightness-110 disabled:opacity-60"
          >
            {inviting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Mail size={14} />
            )}
            Send invite
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">{ROLE_HINT[inviteRole]}</p>
        {inviteMsg && (
          <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <p>{inviteMsg.text}</p>
            {inviteMsg.link && (
              <div className="mt-1.5 flex items-center gap-2">
                <code className="truncate rounded bg-white px-2 py-1 text-[11px] text-slate-700 ring-1 ring-slate-200">
                  {inviteMsg.link}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(inviteMsg.link!);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-slate-600 transition hover:bg-white"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            )}
          </div>
        )}
      </form>

      {/* Members */}
      <ul className="mt-6 space-y-2">
        {data.members.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {m.name || m.email?.split("@")[0]}
                {m.id === data.self && (
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    you
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-slate-500">{m.email}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <select
                value={m.role}
                disabled={busyId === m.id}
                onChange={(e) => changeRole(m.id, e.target.value as Role)}
                className={selectClass}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
              <button
                onClick={() =>
                  removeMember(m.id, m.email ?? m.name ?? "this member")
                }
                disabled={busyId === m.id}
                title="Remove from workspace"
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Pending invitations */}
      {data.invitations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-slate-700">
            Pending invitations
          </h2>
          <ul className="mt-2 space-y-2">
            {data.invitations.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-800">{inv.email}</p>
                  <p className="text-xs text-slate-500">
                    {ROLE_LABEL[inv.role]} · invited, not yet accepted
                  </p>
                </div>
                <button
                  onClick={() => revokeInvite(inv.id)}
                  disabled={busyId === inv.id}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
