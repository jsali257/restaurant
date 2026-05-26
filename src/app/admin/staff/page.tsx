"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  RefreshCw,
  X,
  ChefHat,
  UtensilsCrossed,
  ShieldCheck,
  UserCircle,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

type Role = "staff" | "kitchen" | "admin" | "owner";

interface StaffMember {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  created_at: string;
}

const ROLE_CONFIG: Record<Role, { label: string; color: string; icon: React.ElementType; description: string }> = {
  owner:   { label: "Owner",   color: "bg-purple-100 text-purple-700 border-purple-200",  icon: ShieldCheck,     description: "Full access to everything" },
  admin:   { label: "Admin",   color: "bg-orange-100 text-orange-700 border-orange-200",  icon: ShieldCheck,     description: "Full admin panel access" },
  staff:   { label: "Server",  color: "bg-blue-100 text-blue-700 border-blue-200",        icon: UtensilsCrossed, description: "Order entry & table management" },
  kitchen: { label: "Kitchen", color: "bg-amber-100 text-amber-700 border-amber-200",     icon: ChefHat,         description: "Kitchen display only" },
};

const ASSIGNABLE_ROLES: Role[] = ["staff", "kitchen", "admin"];

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", full_name: "", role: "staff" as Role });
  const [inviting, setInviting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/staff");
    if (res.ok) setStaff(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleInvite() {
    if (!inviteForm.email) { toast.error("Email is required"); return; }
    setInviting(true);
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inviteForm),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to send invite");
    } else {
      toast.success(data.existing ? `Role updated for ${inviteForm.email}` : `Invite sent to ${inviteForm.email}`);
      setShowInvite(false);
      setInviteForm({ email: "", full_name: "", role: "staff" });
      load();
    }
    setInviting(false);
  }

  async function handleRoleChange(id: string, role: Role) {
    setUpdatingId(id);
    const res = await fetch("/api/admin/staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    if (res.ok) {
      setStaff((prev) => prev.map((s) => s.id === id ? { ...s, role } : s));
      toast.success("Role updated");
    } else {
      toast.error("Failed to update role");
    }
    setUpdatingId(null);
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-stone-900 dark:text-white">Staff Management</h1>
          <p className="text-stone-400 text-sm mt-1">{staff.length} team members</p>
        </div>
        <Button onClick={() => setShowInvite(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Invite Staff
        </Button>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {(Object.entries(ROLE_CONFIG) as [Role, typeof ROLE_CONFIG[Role]][]).map(([role, cfg]) => (
          <div key={role} className="bg-white dark:bg-stone-800 rounded-xl p-4 border border-stone-100 dark:border-stone-700">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color} mb-2`}>
              <cfg.icon className="w-3 h-3" />
              {cfg.label}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">{cfg.description}</p>
          </div>
        ))}
      </div>

      {/* Staff table */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-100 dark:border-stone-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-orange-400 animate-spin" />
          </div>
        ) : staff.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500 font-medium">No staff members yet</p>
            <p className="text-stone-400 text-sm mt-1">Invite your first team member above</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 dark:border-stone-700 bg-stone-50 dark:bg-stone-850">
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Name / Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider">Current Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider hidden md:table-cell">Access</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-stone-400 uppercase tracking-wider">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-700">
              {staff.map((member) => {
                const cfg = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.staff;
                const isOwner = member.role === "owner";
                return (
                  <tr key={member.id} className="hover:bg-stone-50 dark:hover:bg-stone-750 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-stone-100 dark:bg-stone-700 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserCircle className="w-5 h-5 text-stone-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900 dark:text-white">
                            {member.full_name || <span className="text-stone-400 italic">No name</span>}
                          </p>
                          <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />{member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                        <cfg.icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-stone-500 dark:text-stone-400 text-xs">{cfg.description}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-stone-400 text-xs">{formatDate(member.created_at)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isOwner ? (
                        <span className="text-xs text-stone-400 italic">Protected</span>
                      ) : (
                        <select
                          value={member.role}
                          disabled={updatingId === member.id}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as Role)}
                          className="text-xs border border-stone-200 dark:border-stone-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 focus:outline-none focus:border-orange-400 disabled:opacity-50"
                        >
                          {ASSIGNABLE_ROLES.map((r) => (
                            <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                          ))}
                          <option value="customer">Revoke Access</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite modal */}
      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInvite(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800">
                <h2 className="font-bold text-lg text-stone-900 dark:text-white">Invite Team Member</h2>
                <button onClick={() => setShowInvite(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1.5 block">Email Address *</label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="staff@restaurant.com"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1.5 block">Full Name</label>
                  <input
                    type="text"
                    value={inviteForm.full_name}
                    onChange={(e) => setInviteForm((f) => ({ ...f, full_name: e.target.value }))}
                    placeholder="e.g. Maria Gonzalez"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-500 mb-1.5 block">Role</label>
                  <div className="space-y-2">
                    {ASSIGNABLE_ROLES.map((role) => {
                      const cfg = ROLE_CONFIG[role];
                      return (
                        <label
                          key={role}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${inviteForm.role === role ? "border-orange-400 bg-orange-50 dark:bg-orange-950/30" : "border-stone-200 dark:border-stone-700 hover:border-stone-300"}`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={role}
                            checked={inviteForm.role === role}
                            onChange={() => setInviteForm((f) => ({ ...f, role }))}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${inviteForm.role === role ? "border-orange-500 bg-orange-500" : "border-stone-300"}`}>
                            {inviteForm.role === role && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <cfg.icon className="w-4 h-4 text-stone-500" />
                          <div>
                            <p className="text-sm font-semibold text-stone-800 dark:text-white">{cfg.label}</p>
                            <p className="text-xs text-stone-400">{cfg.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <p className="text-xs text-stone-400 bg-stone-50 dark:bg-stone-800 rounded-xl px-3 py-2">
                  The team member will receive an email invite to set their password and access the system.
                </p>

                <div className="flex gap-3 pt-1">
                  <Button variant="secondary" onClick={() => setShowInvite(false)} className="flex-1">Cancel</Button>
                  <Button onClick={handleInvite} loading={inviting} className="flex-1">Send Invite</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
