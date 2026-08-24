"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Mail, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetchJson } from "@/lib/api/client";
import type { Contact } from "@/types/pipeline";

// `linkedinUrl` é texto livre, sem validação de schema no backend — sem essa checagem, um
// valor tipo `javascript:...` salvo aqui vira um link clicável que executa JS na origem do
// app quando clicado. Só renderiza como `<a>` se for realmente http(s).
function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function JobContactsTab({ jobId }: { jobId: string }) {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    apiFetchJson<Contact[]>(`/api/pipeline/${jobId}/contacts`)
      .then(setContacts)
      .catch((err: Error) => setError(err.message));
  }, [jobId]);

  async function handleDelete(contactId: string) {
    setDeletingId(contactId);
    try {
      await apiFetchJson(`/api/pipeline/${jobId}/contacts/${contactId}`, { method: "DELETE" });
      setContacts((current) => current?.filter((c) => c.id !== contactId) ?? current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível remover o contato.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {!contacts && !error && <p className="text-sm text-muted-foreground">Carregando…</p>}

      {contacts && contacts.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">Nenhum contato adicionado ainda.</p>
      )}

      <div className="space-y-2.5">
        {contacts?.map((contact) => (
          <Card key={contact.id}>
            <CardContent className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{contact.name}</p>
                {contact.role && <p className="truncate text-xs text-muted-foreground">{contact.role}</p>}
                {contact.email && (
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <Mail className="size-3 shrink-0" aria-hidden="true" />
                    {contact.email}
                  </p>
                )}
                {contact.linkedinUrl && isHttpUrl(contact.linkedinUrl) ? (
                  <a
                    href={contact.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-xs text-primary hover:underline"
                  >
                    {contact.linkedinUrl}
                  </a>
                ) : (
                  contact.linkedinUrl && (
                    <p className="truncate text-xs text-muted-foreground">{contact.linkedinUrl}</p>
                  )
                )}
                {contact.notes && <p className="mt-1 text-xs text-muted-foreground">{contact.notes}</p>}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remover contato"
                disabled={deletingId === contact.id}
                onClick={() => handleDelete(contact.id)}
              >
                {deletingId === contact.id ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {showForm ? (
        <AddContactForm
          jobId={jobId}
          onAdded={(contact) => {
            setContacts((current) => [...(current ?? []), contact]);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setShowForm(true)}>
          <UserPlus className="size-4" aria-hidden="true" />
          Adicionar contato
        </Button>
      )}
    </div>
  );
}

function AddContactForm({
  jobId,
  onAdded,
  onCancel,
}: {
  jobId: string;
  onAdded: (contact: Contact) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const contact = await apiFetchJson<Contact>(`/api/pipeline/${jobId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role: role || undefined,
          linkedinUrl: linkedinUrl || undefined,
          email: email || undefined,
        }),
      });
      onAdded(contact);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível adicionar o contato.");
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contactName">Nome</Label>
              <Input id="contactName" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactRole">Cargo (opcional)</Label>
              <Input id="contactRole" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contactEmail">Email (opcional)</Label>
              <Input id="contactEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactLinkedin">LinkedIn (opcional)</Label>
              <Input
                id="contactLinkedin"
                placeholder="linkedin.com/in/..."
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p role="alert" aria-live="polite" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !name}>
              {submitting ? "Adicionando…" : "Adicionar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
