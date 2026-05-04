import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Briefcase, CreditCard, Save, LogOut, Lock, Eye, EyeOff, CheckCircle, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiDelete, apiGet, apiPatch, ApiError } from "@/lib/api";

import { ds, tk } from "@/lib/ds";

// ─── Types ────────────────────────────────────────────────────────────────────
type Profile = {
  name: string;
  email: string;
};

// ─── Password Field Component ─────────────────────────────────────────────────
function PasswordInput({ value, onChange, placeholder, id }: { value: string; onChange: (v: string) => void; placeholder: string; id: string; }) {
  const [show, setShow] = useState(false);
  const ui = tk(true);

  return (
      <div className="relative">
        <input
            id={id}
            type={show ? "text" : "password"}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${ui.input} w-full pr-10`}
            autoComplete="new-password"
        />
        <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] hover:text-white transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Settings() {
  const ui = tk(true);
  const [activeTab, setActiveTab] = useState<"profile" | "business" | "billing">("profile");

  const [profile, setProfile] = useState<Profile>({ name: "", email: "" });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [savingPassword, setSavingPassword] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [business, setBusiness] = useState({
    legalName: "Sohan Digital Labs",
    taxId: "GSTIN-29ABCDE1234F1Z5",
    address: "Mysuru, Karnataka",
    currency: "INR (₹)",
  });

  const TAB_LABELS = {
    profile: "Profile",
    business: "Business Details",
    billing: "Billing & Plan"
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    setLoadingProfile(true);
    try {
      const data = await apiGet<Profile>("/api/settings/profile");
      setProfile(data);
    } catch (err) {
      setProfile({ name: "Sohan", email: "sohans1625@gmail.com" });
      toast.error(err instanceof ApiError ? err.message : "Failed to load profile from server.");
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handleSaveProfile() {
    if (!profile.name.trim()) return toast.error("Name cannot be empty.");
    setSavingProfile(true);
    try {
      const updated = await apiPatch<Profile>("/api/settings/profile", { name: profile.name.trim() });
      setProfile(updated);
      setProfileSaved(true);
      toast.success("Profile updated.");
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  function validatePassword() {
    const errors: Record<string, string> = {};
    if (!oldPassword) errors.old = "Current password is required.";
    if (!newPassword) errors.new = "New password is required.";
    else if (newPassword.length < 6) errors.new = "Must be at least 6 characters.";
    if (!confirmPassword) errors.confirm = "Please confirm your new password.";
    else if (newPassword !== confirmPassword) errors.confirm = "Passwords do not match.";
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleChangePassword() {
    if (!validatePassword()) return;
    setSavingPassword(true);
    try {
      await apiPatch("/api/settings/password", { oldPassword, newPassword });
      toast.success("Password changed successfully.");
      setOldPassword(""); setNewPassword(""); setConfirmPassword(""); setPasswordErrors({});
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  }

  function handleSignOut() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
  }

  async function handleDeleteAccount() {
    if (deleteConfirm.trim().toUpperCase() !== "DELETE") {
      toast.error('Type DELETE to confirm account removal.');
      return;
    }

    setDeletingAccount(true);
    try {
      await apiDelete("/api/settings/account");
      localStorage.clear();
      toast.success("Account deleted.");
      window.location.href = "/login";
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete account.");
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
      <DashboardLayout title="Settings">
        <div className="mb-8 max-w-6xl">
          <h1 className={`${ds.font["2xl"]} ${ds.weight.semibold} ${ui.primary} tracking-tight`}>Settings</h1>
          <p className={`${ds.font.sm} ${ui.muted} mt-1`}>Manage your account, security, and business configuration.</p>
        </div>

        {/* Increased the gap and added a max-width to the entire layout container */}
        <div className="flex flex-col md:flex-row gap-10 max-w-6xl">

          {/* Left Sidebar: Vertical Tabs */}
          <aside className="w-full md:w-64 shrink-0">
            <nav className="flex flex-col space-y-1">
              {(Object.keys(TAB_LABELS) as Array<keyof typeof TAB_LABELS>).map((tab) => (
                  <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex items-center gap-3 px-4 py-2.5 ${ds.radius.md} ${ds.font.sm} ${ds.weight.medium} transition-colors ${
                          activeTab === tab ? "bg-[#222] text-white" : `${ui.secondary} hover:bg-[#141414] hover:text-white`
                      }`}
                  >
                    {tab === "profile" && <User className="w-4 h-4" />}
                    {tab === "business" && <Briefcase className="w-4 h-4" />}
                    {tab === "billing" && <CreditCard className="w-4 h-4" />}
                    {TAB_LABELS[tab]}
                  </button>
              ))}
              <div className={`my-2 border-t ${ui.divider}`}></div>
              <button onClick={handleSignOut} className={`flex items-center gap-3 px-4 py-2.5 ${ds.radius.md} ${ds.font.sm} ${ds.weight.medium} text-[#F05252] hover:bg-[rgba(240,82,82,0.1)] transition-colors`}>
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </nav>
          </aside>

          {/* Right Content Area: Increased from max-w-2xl to max-w-4xl for wider monitors */}
          <div className="flex-1 max-w-4xl space-y-6">

            {/* TAB 1: PROFILE & SECURITY */}
            {activeTab === "profile" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className={`${ui.card} p-8 mb-6`}>
                    <h2 className={`${ds.font.lg} ${ds.weight.semibold} ${ui.primary} mb-6`}>Personal Information</h2>
                    {loadingProfile ? (
                        <div className="space-y-4"><Skeleton className="h-10 w-full bg-[#222]" /><Skeleton className="h-10 w-full bg-[#222]" /></div>
                    ) : (
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <Label className={ui.secondary}>Full Name</Label>
                            <input className={`${ui.input} w-full`} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label className={ui.secondary}>Email Address</Label>
                            <input className={`${ui.input} w-full opacity-50 cursor-not-allowed`} value={profile.email} disabled />
                            <p className={`${ds.font.xs} ${ui.muted}`}>Email cannot be changed.</p>
                          </div>
                          <div className="flex justify-end pt-2">
                            <Button onClick={handleSaveProfile} disabled={savingProfile} className={ui.btnPrimary}>
                              {profileSaved ? <><CheckCircle className="h-4 w-4 mr-2" /> Saved!</> : savingProfile ? "Saving..." : "Save Profile"}
                            </Button>
                          </div>
                        </div>
                    )}
                  </div>

                  <div className={`${ui.card} p-8`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`flex h-10 w-10 items-center justify-center ${ds.radius.md} bg-[rgba(55,138,221,0.1)] text-[#378ADD]`}>
                        <Lock className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className={`${ds.font.md} ${ds.weight.semibold} ${ui.primary}`}>Change Password</h3>
                        <p className={`${ds.font.sm} ${ui.muted}`}>Update your account security</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label className={ui.secondary}>Current Password</Label>
                        <PasswordInput id="old-pwd" value={oldPassword} onChange={(v) => { setOldPassword(v); setPasswordErrors(p => ({...p, old: ""})); }} placeholder="Enter current password" />
                        {passwordErrors.old && <p className={`${ds.font.xs} text-[#F05252]`}>{passwordErrors.old}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className={ui.secondary}>New Password</Label>
                        <PasswordInput id="new-pwd" value={newPassword} onChange={(v) => { setNewPassword(v); setPasswordErrors(p => ({...p, new: ""})); }} placeholder="Min. 6 characters" />
                        {passwordErrors.new && <p className={`${ds.font.xs} text-[#F05252]`}>{passwordErrors.new}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className={ui.secondary}>Confirm Password</Label>
                        <PasswordInput id="conf-pwd" value={confirmPassword} onChange={(v) => { setConfirmPassword(v); setPasswordErrors(p => ({...p, confirm: ""})); }} placeholder="Repeat new password" />
                        {passwordErrors.confirm && <p className={`${ds.font.xs} text-[#F05252]`}>{passwordErrors.confirm}</p>}
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button onClick={handleChangePassword} disabled={savingPassword} variant="outline" className={ui.btnGhost}>
                          {savingPassword ? "Changing..." : "Change Password"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className={`${ui.card} p-8 border border-[rgba(240,82,82,0.18)] bg-[rgba(240,82,82,0.04)]`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[rgba(240,82,82,0.12)] text-[#F05252]">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className={`${ds.font.md} ${ds.weight.semibold} ${ui.primary}`}>Danger Zone</h3>
                        <p className={`${ds.font.sm} ${ui.muted}`}>Permanently delete your account from the database.</p>
                      </div>
                    </div>

                    <p className={`${ds.font.sm} ${ui.muted} mb-4`}>
                      This removes your user account and blocks future login with these credentials.
                    </p>

                    <div className="space-y-2 max-w-md">
                      <Label className={ui.secondary}>Type DELETE to confirm</Label>
                      <input
                        className={`${ui.input} w-full`}
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder="DELETE"
                        autoComplete="off"
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        variant="destructive"
                        className="bg-[#F05252] text-white hover:bg-[#d94848]"
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount}
                      >
                        <Trash2 className="w-4 h-4" />
                        {deletingAccount ? "Deleting..." : "Delete Account"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
            )}

            {/* TAB 2: BUSINESS DETAILS */}
            {activeTab === "business" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`${ui.card} p-8`}>
                  <div className="mb-6">
                    <h2 className={`${ds.font.lg} ${ds.weight.semibold} ${ui.primary}`}>Business Configuration</h2>
                    <p className={`${ds.font.sm} ${ui.muted} mt-1`}>This information appears on your generated invoices.</p>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className={ui.secondary}>Legal Business Name</Label>
                      <input className={`${ui.input} w-full`} value={business.legalName} onChange={(e) => setBusiness({...business, legalName: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className={ui.secondary}>Tax ID / GSTIN</Label>
                      <input className={`${ui.input} w-full`} value={business.taxId} onChange={(e) => setBusiness({...business, taxId: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className={ui.secondary}>Business Address</Label>
                      <textarea className={`${ui.input} w-full min-h-[100px] resize-none`} value={business.address} onChange={(e) => setBusiness({...business, address: e.target.value})} />
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button className={ui.btnPrimary}><Save className="w-4 h-4 mr-2" /> Save Business Details</Button>
                    </div>
                  </div>
                </motion.div>
            )}

            {/* TAB 3: BILLING */}
            {activeTab === "billing" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className={`${ui.card} p-8`}>
                    <div className="flex items-start justify-between mb-8">
                      <div>
                        <h2 className={`${ds.font.lg} ${ds.weight.semibold} ${ui.primary}`}>Current Plan</h2>
                        <p className={`${ds.font.sm} ${ui.muted} mt-1`}>You are currently on the Free plan.</p>
                      </div>
                      <span className={`px-4 py-1.5 ${ds.radius.full} ${ds.font.xs} ${ds.weight.medium} border`} style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#a1a1aa', borderColor: 'rgba(255,255,255,0.08)' }}>
                            Free
                        </span>
                    </div>
                    <div className="p-5 rounded-lg border border-[rgba(93,202,165,0.2)] bg-[rgba(93,202,165,0.05)] flex items-center justify-between">
                      <div>
                        <h3 className={`${ds.font.md} ${ds.weight.semibold} text-[#5DCAA5]`}>Upgrade to Pro</h3>
                        <p className={`${ds.font.sm} ${ui.muted} mt-1`}>Unlock advanced analytics and AI insights.</p>
                      </div>
                      <Button className="bg-[#5DCAA5] hover:bg-[#4eb391] text-black border-none px-6">Upgrade Now</Button>
                    </div>
                  </div>
                </motion.div>
            )}

          </div>
        </div>
      </DashboardLayout>
  );
}