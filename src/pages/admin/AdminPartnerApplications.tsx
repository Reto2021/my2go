import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Mail, 
  MapPin,
  Globe,
  Clock,
  Target,
  Loader2,
  Eye,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface PartnerApplication {
  id: string;
  user_id: string | null;
  company_name: string;
  industry: string;
  website: string | null;
  address_street: string;
  address_number: string;
  postal_code: string;
  city: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_opt_in: boolean;
  google_business_url: string | null;
  opening_hours: string | null;
  goals: string[];
  status: string;
  notes: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  contacted: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "Offen",
  contacted: "Kontaktiert",
  approved: "Genehmigt",
  rejected: "Abgelehnt",
};

export default function AdminPartnerApplications() {
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<PartnerApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: applications, isLoading } = useQuery({
    queryKey: ['partner-applications', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('partner_applications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PartnerApplication[];
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from('partner_applications')
        .update({ 
          status, 
          notes: notes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-applications'] });
      toast.success("Status aktualisiert");
      setSelectedApplication(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Fehler beim Aktualisieren");
    }
  });

  const handleStatusChange = (status: string) => {
    if (selectedApplication) {
      updateStatusMutation.mutate({ 
        id: selectedApplication.id, 
        status,
        notes: selectedApplication.notes || undefined
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Partner-Bewerbungen</h1>
          <p className="text-muted-foreground">
            Verwalte eingehende Partner-Anfragen
          </p>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="pending">Offen</SelectItem>
            <SelectItem value="contacted">Kontaktiert</SelectItem>
            <SelectItem value="approved">Genehmigt</SelectItem>
            <SelectItem value="rejected">Abgelehnt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : applications?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Keine Bewerbungen</h3>
            <p className="text-muted-foreground">
              Es gibt noch keine Partner-Bewerbungen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications?.map((app) => (
            <Card key={app.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{app.company_name}</h3>
                      <Badge className={statusColors[app.status]}>
                        {statusLabels[app.status]}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {app.industry}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {app.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {app.contact_email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(app.created_at), "dd.MM.yyyy", { locale: de })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedApplication(app)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                    {app.status !== 'pending' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: app.id, status: 'pending' })}
                      >
                        Zurücksetzen
                      </Button>
                    )}
                    {app.status !== 'contacted' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: app.id, status: 'contacted' })}
                      >
                        <Phone className="w-4 h-4 mr-1" />
                        Kontaktiert
                      </Button>
                    )}
                    {app.status !== 'approved' && (
                      <Button 
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: app.id, status: 'approved' })}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Genehmigen
                      </Button>
                    )}
                    {app.status !== 'rejected' && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: app.id, status: 'rejected' })}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Ablehnen
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedApplication?.company_name}</DialogTitle>
            <DialogDescription>
              Bewerbung vom {selectedApplication && format(new Date(selectedApplication.created_at), "dd. MMMM yyyy", { locale: de })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-4">
                <Label>Status:</Label>
                <Select 
                  value={selectedApplication.status} 
                  onValueChange={handleStatusChange}
                  disabled={updateStatusMutation.isPending}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Offen</SelectItem>
                    <SelectItem value="contacted">Kontaktiert</SelectItem>
                    <SelectItem value="approved">Genehmigt</SelectItem>
                    <SelectItem value="rejected">Abgelehnt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Company Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Firma</Label>
                  <p className="font-medium">{selectedApplication.company_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Branche</Label>
                  <p className="font-medium">{selectedApplication.industry}</p>
                </div>
                {selectedApplication.website && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Website</Label>
                    <p>
                      <a 
                        href={selectedApplication.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        {selectedApplication.website}
                      </a>
                    </p>
                  </div>
                )}
              </div>

              {/* Address */}
              <div>
                <Label className="text-muted-foreground text-xs">Adresse</Label>
                <p className="font-medium flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {selectedApplication.address_street} {selectedApplication.address_number}, 
                  {selectedApplication.postal_code} {selectedApplication.city}
                </p>
              </div>

              {/* Contact */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Kontaktperson</Label>
                  <p className="font-medium">{selectedApplication.contact_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">E-Mail</Label>
                  <p>
                    <a 
                      href={`mailto:${selectedApplication.contact_email}`}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {selectedApplication.contact_email}
                    </a>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Telefon</Label>
                  <p>
                    <a 
                      href={`tel:${selectedApplication.contact_phone}`}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {selectedApplication.contact_phone}
                    </a>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">WhatsApp Updates</Label>
                  <p className="font-medium">{selectedApplication.whatsapp_opt_in ? "Ja" : "Nein"}</p>
                </div>
              </div>

              {/* Goals */}
              {selectedApplication.goals.length > 0 && (
                <div>
                  <Label className="text-muted-foreground text-xs">Ziele</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedApplication.goals.map((goal) => (
                      <Badge key={goal} variant="secondary" className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Google Business */}
              {selectedApplication.google_business_url && (
                <div>
                  <Label className="text-muted-foreground text-xs">Google Business</Label>
                  <p>
                    <a 
                      href={selectedApplication.google_business_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {selectedApplication.google_business_url}
                    </a>
                  </p>
                </div>
              )}

              {/* Opening Hours */}
              {selectedApplication.opening_hours && (
                <div>
                  <Label className="text-muted-foreground text-xs">Öffnungszeiten</Label>
                  <p className="whitespace-pre-line text-sm">{selectedApplication.opening_hours}</p>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label className="text-muted-foreground text-xs">Interne Notizen</Label>
                <Textarea
                  value={selectedApplication.notes || ''}
                  onChange={(e) => setSelectedApplication({
                    ...selectedApplication,
                    notes: e.target.value
                  })}
                  placeholder="Notizen hinzufügen..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedApplication(null)}>
              Schliessen
            </Button>
            {selectedApplication?.status === 'approved' && (
              <Button onClick={async () => {
                if (!selectedApplication) return;
                
                // Parse contact name into first and last name
                const nameParts = selectedApplication.contact_name.trim().split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';
                
                // Generate slug from company name
                const slug = selectedApplication.company_name
                  .toLowerCase()
                  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
                  .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                
                try {
                  const { data, error } = await supabase
                    .from('partners')
                    .insert({
                      name: selectedApplication.company_name,
                      slug,
                      category: selectedApplication.industry,
                      address_street: selectedApplication.address_street,
                      address_number: selectedApplication.address_number,
                      postal_code: selectedApplication.postal_code,
                      city: selectedApplication.city,
                      website: selectedApplication.website,
                      contact_first_name: firstName,
                      contact_last_name: lastName,
                      contact_email: selectedApplication.contact_email,
                      contact_phone: selectedApplication.contact_phone,
                      is_active: false, // Start inactive
                      is_featured: false,
                    })
                    .select()
                    .single();
                  
                  if (error) throw error;
                  
                  // Send welcome email to partner
                  try {
                    const { error: emailError } = await supabase.functions.invoke('send-partner-welcome', {
                      body: {
                        partnerId: data.id,
                        partnerName: selectedApplication.company_name,
                        contactName: selectedApplication.contact_name,
                        contactEmail: selectedApplication.contact_email,
                      }
                    });
                    
                    if (emailError) {
                      console.error('Error sending welcome email:', emailError);
                      toast.warning('Partner erstellt, aber Welcome-E-Mail konnte nicht gesendet werden');
                    } else {
                      toast.success(`Partner "${selectedApplication.company_name}" erstellt & Welcome-E-Mail gesendet!`);
                    }
                  } catch (emailErr) {
                    console.error('Error sending welcome email:', emailErr);
                    toast.success(`Partner "${selectedApplication.company_name}" wurde erfolgreich erstellt!`);
                  }
                  
                  setSelectedApplication(null);
                } catch (error: any) {
                  console.error('Error creating partner:', error);
                  toast.error(error.message || 'Fehler beim Erstellen des Partners');
                }
              }}>
                <UserPlus className="w-4 h-4 mr-2" />
                Als Partner anlegen
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}