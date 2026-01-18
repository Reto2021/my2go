import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Building2, 
  Calendar,
  Search,
  Filter,
  User,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type InquiryStatus = 'new' | 'contacted' | 'in_progress' | 'closed' | 'rejected';

interface SponsoringInquiry {
  id: string;
  company: string;
  contact_name: string;
  email: string;
  phone: string | null;
  desired_level: string | null;
  engagement_area: string | null;
  message: string | null;
  status: InquiryStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  processed_by: string | null;
}

const statusConfig: Record<InquiryStatus, { label: string; color: string; icon: typeof Clock }> = {
  new: { label: 'Neu', color: 'bg-blue-500', icon: Clock },
  contacted: { label: 'Kontaktiert', color: 'bg-yellow-500', icon: Phone },
  in_progress: { label: 'In Bearbeitung', color: 'bg-orange-500', icon: Loader2 },
  closed: { label: 'Abgeschlossen', color: 'bg-green-500', icon: CheckCircle },
  rejected: { label: 'Abgelehnt', color: 'bg-red-500', icon: XCircle },
};

const levelLabels: Record<string, string> = {
  gold: 'Gold Partner',
  silber: 'Silber Partner',
  bronze: 'Bronze Partner',
  supporter: 'Supporter',
  custom: 'Individuell',
};

const engagementLabels: Record<string, string> = {
  'community-events': 'Community Events',
  'app-features': 'App Features',
  'radio-sponsoring': 'Radio Sponsoring',
  'content-marketing': 'Content Marketing',
  'partner-rewards': 'Partner Rewards',
};

export default function AdminSponsoringInquiries() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<SponsoringInquiry | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<InquiryStatus>('new');

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['sponsoring-inquiries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsoring_inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SponsoringInquiry[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: InquiryStatus; notes: string }) => {
      const { error } = await supabase
        .from('sponsoring_inquiries')
        .update({ 
          status, 
          notes,
          processed_at: status !== 'new' ? new Date().toISOString() : null,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsoring-inquiries'] });
      toast.success('Anfrage aktualisiert');
      setSelectedInquiry(null);
    },
    onError: () => {
      toast.error('Fehler beim Aktualisieren');
    },
  });

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = 
      inquiry.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = inquiries.reduce((acc, inquiry) => {
    acc[inquiry.status] = (acc[inquiry.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const message = encodeURIComponent(`Hallo ${name}, vielen Dank für Ihr Interesse am 2Go Sponsoring! Ich würde gerne mehr über Ihre Vorstellungen erfahren.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const openEmail = (email: string, name: string, company: string) => {
    const subject = encodeURIComponent(`2Go Sponsoring - ${company}`);
    const body = encodeURIComponent(`Hallo ${name},\n\nvielen Dank für Ihr Interesse am 2Go Sponsoring!\n\nIch würde gerne mehr über Ihre Vorstellungen erfahren und Ihnen unser Angebot näher vorstellen.\n\nMit freundlichen Grüssen\n2Go Team`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleSelectInquiry = (inquiry: SponsoringInquiry) => {
    setSelectedInquiry(inquiry);
    setEditNotes(inquiry.notes || '');
    setEditStatus(inquiry.status);
  };

  const handleSave = () => {
    if (!selectedInquiry) return;
    updateMutation.mutate({
      id: selectedInquiry.id,
      status: editStatus,
      notes: editNotes,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sponsoring-Anfragen</h1>
        <p className="text-muted-foreground">Verwalte eingehende Sponsoring-Anfragen</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(statusConfig).map(([status, config]) => {
          const StatusIcon = config.icon;
          return (
            <Card 
              key={status} 
              className={cn(
                "cursor-pointer transition-all",
                statusFilter === status && "ring-2 ring-accent"
              )}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className={cn("p-2 rounded-lg", config.color)}>
                    <StatusIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{statusCounts[status] || 0}</p>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Suche nach Firma, Name oder E-Mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            {Object.entries(statusConfig).map(([status, config]) => (
              <SelectItem key={status} value={status}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Inquiry List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredInquiries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Keine Anfragen gefunden</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredInquiries.map(inquiry => {
            const status = statusConfig[inquiry.status] || statusConfig.new;
            const StatusIcon = status.icon;
            
            return (
              <Card 
                key={inquiry.id} 
                className="cursor-pointer hover:border-accent transition-colors"
                onClick={() => handleSelectInquiry(inquiry)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{inquiry.company}</h3>
                        <Badge className={cn("text-white", status.color)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {inquiry.contact_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {inquiry.email}
                        </span>
                        {inquiry.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {inquiry.phone}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {inquiry.desired_level && (
                          <Badge variant="outline">
                            {levelLabels[inquiry.desired_level] || inquiry.desired_level}
                          </Badge>
                        )}
                        {inquiry.engagement_area && (
                          <Badge variant="secondary">
                            {engagementLabels[inquiry.engagement_area] || inquiry.engagement_area}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right text-xs text-muted-foreground shrink-0">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(inquiry.created_at), 'dd.MM.yyyy', { locale: de })}
                      </div>
                      <div>{format(new Date(inquiry.created_at), 'HH:mm', { locale: de })} Uhr</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={!!selectedInquiry} onOpenChange={(open) => !open && setSelectedInquiry(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedInquiry && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {selectedInquiry.company}
                </SheetTitle>
              </SheetHeader>
              
              <div className="space-y-6 mt-6">
                {/* Contact Info */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Kontakt</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedInquiry.contact_name}</span>
                    </div>
                    <div 
                      className="flex items-center gap-3 p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                      onClick={() => openEmail(selectedInquiry.email, selectedInquiry.contact_name, selectedInquiry.company)}
                    >
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{selectedInquiry.email}</span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {selectedInquiry.phone && (
                      <div 
                        className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg cursor-pointer hover:bg-green-500/20"
                        onClick={() => openWhatsApp(selectedInquiry.phone!, selectedInquiry.contact_name)}
                      >
                        <MessageSquare className="h-4 w-4 text-green-600" />
                        <span className="flex-1">{selectedInquiry.phone}</span>
                        <span className="text-xs text-green-600 font-medium">WhatsApp</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Gewünschtes Level</p>
                      <p className="font-medium">
                        {selectedInquiry.desired_level 
                          ? (levelLabels[selectedInquiry.desired_level] || selectedInquiry.desired_level)
                          : '-'}
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Engagement-Bereich</p>
                      <p className="font-medium">
                        {selectedInquiry.engagement_area 
                          ? (engagementLabels[selectedInquiry.engagement_area] || selectedInquiry.engagement_area)
                          : '-'}
                      </p>
                    </div>
                  </div>
                  
                  {selectedInquiry.message && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Nachricht</p>
                      <p className="text-sm whitespace-pre-wrap">{selectedInquiry.message}</p>
                    </div>
                  )}
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Eingegangen am</p>
                    <p className="font-medium">
                      {format(new Date(selectedInquiry.created_at), "dd. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: de })}
                    </p>
                  </div>
                </div>

                {/* Status & Notes */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Bearbeitung</h4>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={editStatus} onValueChange={(v) => setEditStatus(v as InquiryStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([status, config]) => (
                          <SelectItem key={status} value={status}>
                            <span className="flex items-center gap-2">
                              <span className={cn("h-2 w-2 rounded-full", config.color)} />
                              {config.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Interne Notizen</label>
                    <Textarea 
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Notizen zur Anfrage hinzufügen..."
                      rows={4}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setSelectedInquiry(null)}
                  >
                    Abbrechen
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Speichern
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
