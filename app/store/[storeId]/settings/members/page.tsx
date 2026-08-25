"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { usePermission } from "@/lib/hooks/usePermission";
import {
  fetchMembers,
  inviteMember,
  removeMember,
  updatePermissions,
  clearMembersError,
} from "@/lib/features/members/membersSlice";
import { Membership, StoreRole } from "@/lib/types/members";
import { InviteMemberModal } from "@/components/members/InviteMemberModal";
import { PermissionsSlideOver } from "@/components/members/PermissionsSlideOver";
import {
  MoreVertical,
  Clock,
  ShieldCheck,
  UserX,
  Plus,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MembersAndRolesPage() {
  const dispatch = useAppDispatch();
  const params = useParams();
  const storeId = params.storeId as string;
  const { t, language } = useLanguage();
  const { hasPermission } = usePermission();

  const { members, loading, error } = useAppSelector((state) => state.members);
  const { user } = useAppSelector((state) => state.auth);

  // Modals state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isPermsOpen, setIsPermsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Membership | null>(null);
  const [actionDropdownId, setActionDropdownId] = useState<string | null>(null);

  // UI States
  const [showSingleMemberHint, setShowSingleMemberHint] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [submittingPerms, setSubmittingPerms] = useState(false);

  // Fetch members if not already loaded or on page mount
  useEffect(() => {
    if (storeId) {
      dispatch(fetchMembers(storeId));
    }
  }, [dispatch, storeId]);

  // Clean up notifications toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Verify RBAC access to view members page
  const canView = hasPermission("members:view");
  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 font-sans">
        <UserX className="h-10 w-10 text-red-500 mb-2.5" />
        <h3 className="text-base font-bold text-[#151328]">Access Denied</h3>
        <p className="text-xs font-semibold text-[#65637D] mt-1 max-w-sm leading-relaxed">
          You do not have authorization to view user memberships and permissions for this shop. Contact the store manager for access.
        </p>
      </div>
    );
  }

  const handleInvite = async (phone: string, role: StoreRole) => {
    setSubmittingInvite(true);
    try {
      await dispatch(inviteMember({ phone, role })).unwrap();
      setToastMessage(t("members.inviteSuccess") || "Invitation sent successfully");
      setIsInviteOpen(false);
    } catch (err: any) {
      throw new Error(err || "Failed to invite member");
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleSaveOverrides = async (userId: string, overrides: Record<string, boolean>) => {
    setSubmittingPerms(true);
    try {
      await dispatch(updatePermissions({ userId, overrides })).unwrap();
      setToastMessage(t("members.permSaved") || "Permissions updated successfully");
      setIsPermsOpen(false);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSubmittingPerms(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await dispatch(removeMember(userId)).unwrap();
      setToastMessage(t("members.removeSuccess") || "Member removed successfully");
      setActionDropdownId(null);
    } catch (err: any) {
      alert(err || "Failed to remove member");
    }
  };

  const getRoleBadgeStyle = (role: StoreRole) => {
    switch (role) {
      case "owner":
        return "bg-[#EEF2FF] text-[#4338CA]";
      case "manager":
        return "bg-[#E0E7FF] text-[#4338CA]";
      default:
        return "bg-[#F1F1F6] text-[#65637D]";
    }
  };

  return (
    <div className="space-y-6 font-sans relative">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 mb-5">
        <div>
          <h2 className="text-base font-bold text-[#151328]">{t("members.title") || "Members & Roles"}</h2>
          <p className="text-xs font-semibold text-[#65637D] mt-0.5">
            {t("members.subtitle") || "Manage who has access to this store and what they can do."}
          </p>
        </div>
        
        {hasPermission("members:invite") && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="h-9.5 px-4 bg-[#FF6B5B] hover:bg-[#E05344] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {t("members.inviteCTA") || "+ Invite Member"}
          </button>
        )}
      </div>

      {/* Inline Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#151328] text-white px-4.5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-5">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Single member hint banner */}
      {showSingleMemberHint && members.length === 1 && (
        <div className="p-3.5 bg-[#EEF2FF] rounded-xl border border-brand-light text-brand text-xs font-semibold flex items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4338CA] animate-pulse shrink-0" />
            {t("members.onlyMemberHint") || "You're the only member right now — invite your staff to give them access."}
          </div>
          <button onClick={() => setShowSingleMemberHint(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Members table list view */}
      <div className="bg-white rounded-xl border border-[#E4E4F0] overflow-hidden shadow-sm">
        
        {loading && members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-xs font-semibold text-slate-400">Loading memberships...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F7FB] border-b border-[#C7C7E0] text-slate-400 uppercase font-bold text-[10px] tracking-wider select-none">
                  <th className="py-3 px-4.5">{t("members.memberCol") || "Member"}</th>
                  <th className="py-3 px-4.5">{t("members.roleCol") || "Role"}</th>
                  <th className="py-3 px-4.5">{t("members.statusCol") || "Status"}</th>
                  <th className="py-3 px-4.5">{t("members.joinedCol") || "Joined"}</th>
                  <th className="py-3 px-4.5 text-right w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F1F5]">
                {members.map((member) => {
                  const initial = member.user.name.trim().charAt(0).toUpperCase() || "M";
                  const isOwnerRow = member.role.toLowerCase() === "owner";
                  const isDropdownActive = actionDropdownId === member.user_id;

                  return (
                    <tr key={member.id} className="group hover:bg-[#F7F7FB] transition-all">
                      {/* Profile details */}
                      <td className="py-3 px-4.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-50 border border-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                            {initial}
                          </div>
                          <div>
                            <span className="font-bold text-[#151328] block text-xs">
                              {member.user.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              {member.user.phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Access Role */}
                      <td className="py-3 px-4.5">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-transparent",
                          getRoleBadgeStyle(member.role)
                        )}>
                          {t(`members.roleLabels.${member.role.toLowerCase()}`) || member.role}
                        </span>
                      </td>

                      {/* Status Badges */}
                      <td className="py-3 px-4.5">
                        {member.status === "invited" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-[#FEF3C7] text-[#B45309] uppercase tracking-wider">
                            <Clock className="h-3 w-3" />
                            {t("members.invitedStatus") || "Invited"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-[#D1FAE5] text-[#047857] uppercase tracking-wider">
                            {t("members.activeStatus") || "Active"}
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4.5 text-slate-500 font-medium">
                        {member.status === "invited"
                          ? "Pending"
                          : new Date(member.joined_at).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                      </td>

                      {/* Dropdown Options menu */}
                      <td className="py-3 px-4.5 text-right relative">
                        {!isOwnerRow && (
                          <div>
                            <button
                              onClick={() =>
                                setActionDropdownId(isDropdownActive ? null : member.user_id)
                              }
                              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                            >
                              <MoreVertical className="h-4.5 w-4.5" />
                            </button>

                            {/* Dropdown element */}
                            {isDropdownActive && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setActionDropdownId(null)}
                                />
                                <div className="absolute right-4.5 mt-1 w-44 bg-white border border-[#E4E4F0] rounded-lg shadow-lg py-1 z-20 text-left font-sans select-none animate-in fade-in duration-100">
                                  {hasPermission("members:role_update") && (
                                    <button
                                      onClick={() => {
                                        setSelectedMember(member);
                                        setIsPermsOpen(true);
                                        setActionDropdownId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-2 hover:bg-[#F7F7FB] text-xs font-bold text-[#151328] cursor-pointer"
                                    >
                                      {t("members.editPermissions") || "Edit Permissions"}
                                    </button>
                                  )}
                                  
                                  {hasPermission("members:remove") && (
                                    <>
                                      <div className="border-t border-[#F1F1F5] my-1" />
                                      <button
                                        onClick={() => handleRemove(member.user_id)}
                                        className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-xs font-bold text-red-600 cursor-pointer"
                                      >
                                        {t("members.removeMember") || "Remove Member"}
                                      </button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Member Centered Modal */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvite={handleInvite}
        loading={submittingInvite}
      />

      {/* Granular Permission overrides Slide-Over */}
      <PermissionsSlideOver
        isOpen={isPermsOpen}
        onClose={() => setIsPermsOpen(false)}
        member={selectedMember}
        onSave={handleSaveOverrides}
        saving={submittingPerms}
      />

    </div>
  );
}
