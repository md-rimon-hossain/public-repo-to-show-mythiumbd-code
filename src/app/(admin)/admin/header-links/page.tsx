"use client";

import React, { useEffect, useMemo, useState } from "react";
import LoadingSpinnerIphone from '@/components/shared/loadingSpinerIphone';
import {
  Link as LinkIcon,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  Loader2,
  X,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface HeaderLinkItem {
  _id: string;
  title: string;
  href: string;
  order: number;
  isActive: boolean;
  isExternal: boolean;
  parentId: string | null;
}

interface FormState {
  title: string;
  href: string;
  parentId: string; // "" means top-level
  isActive: boolean;
  isExternal: boolean;
  order: number;
}

const emptyForm: FormState = {
  title: "",
  href: "",
  parentId: "",
  isActive: true,
  isExternal: false,
  order: 0,
};

export default function HeaderLinksPage() {
  const [links, setLinks] = useState<HeaderLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<HeaderLinkItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HeaderLinkItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [reordering, setReordering] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/header-links");
      const data = await res.json();
      if (data.success) setLinks(data.data);
      else toast.error(data.message || "Failed to load links");
    } catch {
      toast.error("Failed to load links");
    } finally {
      setLoading(false);
    }
  };

  // Build a parent -> children tree, sorted by order at every level
  const tree = useMemo(() => {
    const topLevel = links.filter((l) => !l.parentId).sort((a, b) => a.order - b.order);
    const childrenOf = (parentId: string) =>
      links.filter((l) => l.parentId === parentId).sort((a, b) => a.order - b.order);
    return { topLevel, childrenOf };
  }, [links]);

  // Only top-level links can be picked as a parent (keeps hierarchy to 2 levels)
  const parentOptions = useMemo(() => tree.topLevel, [tree]);

  const openCreate = (defaultParentId?: string) => {
    setEditing(null);
    const siblingCount = links.filter((l) => (l.parentId || "") === (defaultParentId || "")).length;
    setForm({ ...emptyForm, parentId: defaultParentId || "", order: siblingCount });
    setShowModal(true);
  };

  const openEdit = (link: HeaderLinkItem) => {
    setEditing(link);
    setForm({
      title: link.title,
      href: link.href,
      parentId: link.parentId || "",
      isActive: link.isActive,
      isExternal: link.isExternal,
      order: link.order,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.href.trim()) {
      toast.error("Title and URL are required");
      return;
    }
    try {
      setSaving(true);
      const url = editing ? `/api/header-links/${editing._id}` : "/api/header-links";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, parentId: form.parentId || null }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editing ? "Link updated" : "Link created");
        setShowModal(false);
        fetchLinks();
      } else {
        toast.error(data.message || "Failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/header-links/${deleteTarget._id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Link deleted");
        setDeleteTarget(null);
        fetchLinks();
      } else {
        toast.error(data.message || "Failed");
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (link: HeaderLinkItem) => {
    try {
      setToggling(link._id);
      const res = await fetch(`/api/header-links/${link._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !link.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(link.isActive ? "Link deactivated" : "Link activated");
        fetchLinks();
      } else {
        toast.error(data.message || "Failed");
      }
    } catch {
      toast.error("Failed");
    } finally {
      setToggling(null);
    }
  };

  // Swap order with the sibling above/below (same parentId group only)
  const moveLink = async (link: HeaderLinkItem, direction: "up" | "down") => {
    const siblings = (link.parentId ? tree.childrenOf(link.parentId) : tree.topLevel).slice();
    const index = siblings.findIndex((s) => s._id === link._id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const target = siblings[targetIndex];
    try {
      setReordering(link._id);
      const res = await fetch("/api/header-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          links: [
            { _id: link._id, order: target.order },
            { _id: target._id, order: link.order },
          ],
        }),
      });
      const data = await res.json();
      if (data.success) fetchLinks();
      else toast.error(data.message || "Failed to reorder");
    } catch {
      toast.error("Failed to reorder");
    } finally {
      setReordering(null);
    }
  };

  const renderRow = (link: HeaderLinkItem, isChild: boolean) => {
    const siblings = link.parentId ? tree.childrenOf(link.parentId) : tree.topLevel;
    const idx = siblings.findIndex((s) => s._id === link._id);
    const isFirst = idx === 0;
    const isLast = idx === siblings.length - 1;
    const childCount = tree.childrenOf(link._id).length;

    return (
      <div
        key={link._id}
        className={`flex items-center gap-3 p-4 border-b border-border transition-colors group ${
          isChild
            ? "ml-8 bg-muted/30"
            : "bg-background hover:bg-muted/20"
        }`}
      >
        {isChild && <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />}

        <div className="flex flex-col gap-1">
          <button
            onClick={() => moveLink(link, "up")}
            disabled={isFirst || reordering === link._id}
            className="text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="MOVE UP"
          >
            <ArrowUp size={14} />
          </button>
          <button
            onClick={() => moveLink(link, "down")}
            disabled={isLast || reordering === link._id}
            className="text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="MOVE DOWN"
          >
            <ArrowDown size={14} />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-foreground uppercase tracking-widest truncate">{link.title}</h3>
            {link.isExternal && <ExternalLink size={12} className="text-muted-foreground flex-shrink-0" />}
            {!link.isActive && (
              <span className="text-[9px] uppercase tracking-widest font-black border border-muted-foreground text-muted-foreground px-1.5 py-0.5">
                INACTIVE
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground font-bold truncate mt-1">{link.href}</p>
          {childCount > 0 && (
            <p className="text-[9px] font-black tracking-widest text-blue-500 uppercase mt-1">{childCount} SUB-LINK{childCount > 1 ? "S" : ""}</p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {!isChild && (
            <button
              onClick={() => openCreate(link._id)}
              className="p-2 border border-transparent hover:border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 transition-colors"
              title="ADD SUB-LINK"
            >
              <Plus size={16} />
            </button>
          )}

          <button onClick={() => toggleActive(link)} disabled={toggling === link._id} className="relative">
            <div className={`w-9 h-5 border-2 transition-colors ${link.isActive ? "bg-foreground border-foreground" : "bg-transparent border-muted-foreground"}`}>
              <div
                className={`absolute top-[2px] left-[2px] w-3 h-3 bg-background transition-transform ${
                  link.isActive ? "translate-x-4" : "bg-muted-foreground"
                }`}
              />
            </div>
          </button>

          <div className="w-px h-6 bg-foreground/20 mx-1" />

          <button onClick={() => openEdit(link)} className="p-2 border border-transparent hover:border-blue-500 text-blue-500 hover:bg-blue-500/10 transition-colors">
            <Edit size={16} />
          </button>
          <button
            onClick={() => setDeleteTarget(link)}
            className="p-2 border border-transparent hover:border-red-500 text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-foreground leading-none mb-2">Header Links</h1>
          <p className="text-muted-foreground mt-2 text-xs md:text-sm uppercase tracking-[0.2em] font-semibold">Manage navigation menu links and sub-categories.</p>
        </div>
        <button
          onClick={() => openCreate()}
          className="px-6 py-3 border border-border font-semibold text-xs hover:bg-foreground hover:text-background transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Add Link
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-foreground" size={32} />
        </div>
      ) : tree.topLevel.length === 0 ? (
        <div className="border border-border bg-background rounded-xl p-12 text-center text-muted-foreground">
          <LinkIcon size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm font-bold ">No header links yet. Add your first navigation link.</p>
        </div>
      ) : (
        <div className="border border-border bg-background rounded-xl p-4 max-w-3xl">
          <div className="flex flex-col border border-border">
            {tree.topLevel.map((link) => (
              <React.Fragment key={link._id}>
                {renderRow(link, false)}
                {tree.childrenOf(link._id).map((child) => renderRow(child, true))}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="border border-border bg-background rounded-xl p-6 lg:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
              <h3 className="text-xl md:text-2xl font-bold tracking-tighter text-foreground">{editing ? "EDIT LINK" : "NEW LINK"}</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">TITLE *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-transparent border border-border focus:border-foreground outline-none text-xs font-bold text-foreground transition-colors uppercase tracking-widest"
                  placeholder="E.G. SHOP ALL"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">URL *</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-transparent border border-border focus:border-foreground outline-none text-xs font-bold text-foreground transition-colors"
                  placeholder="e.g. /products or https://example.com"
                  value={form.href}
                  onChange={(e) => setForm({ ...form, href: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">PARENT LINK</label>
                <select
                  className="w-full px-4 py-3 bg-background border border-border focus:border-foreground outline-none text-xs font-bold text-foreground transition-colors uppercase tracking-widest appearance-none"
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                >
                  <option value="">NONE (TOP-LEVEL LINK)</option>
                  {parentOptions
                    .filter((p) => !editing || p._id !== editing._id)
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title}
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-muted-foreground font-bold mt-2 uppercase ">
                  Choose a parent to make this a dropdown sub-category.
                </p>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer border border-border p-3 hover:border-foreground transition-colors flex-1">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-foreground"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  <span className="text-xs font-medium text-foreground">ACTIVE</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer border border-border p-3 hover:border-foreground transition-colors flex-1">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-foreground"
                    checked={form.isExternal}
                    onChange={(e) => setForm({ ...form, isExternal: e.target.checked })}
                  />
                  <span className="text-xs font-medium text-foreground">EXTERNAL</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-border font-semibold text-xs hover:border-foreground transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 border border-border bg-foreground text-background font-semibold text-xs hover:bg-transparent hover:text-foreground transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {editing ? "UPDATE" : "CREATE"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div className="border border-border bg-background rounded-xl p-6 lg:p-8 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-6">
              <div className="p-3 border-2 border-red-500 bg-red-500/10 flex-shrink-0">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold tracking-tighter text-foreground">DELETE LINK?</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
                  Delete <span className="text-foreground">"{deleteTarget.title}"</span>
                  {tree.childrenOf(deleteTarget._id).length > 0
                    ? ` and its ${tree.childrenOf(deleteTarget._id).length} sub-link(s)`
                    : ""}
                  ? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 border border-border font-semibold text-xs hover:border-foreground transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-3 border-2 border-red-500 bg-red-500/10 text-red-500 font-semibold text-xs hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleting && <Loader2 size={16} className="animate-spin" />}
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
