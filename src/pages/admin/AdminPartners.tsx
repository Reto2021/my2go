import { useEffect, useState } from 'react';
import { 
  getAllPartners, 
  createPartner, 
  updatePartner, 
  deletePartner 
} from '@/lib/admin-helpers';
import { Partner } from '@/lib/supabase-helpers';
import { supabase } from '@/integrations/supabase/client';
import { 
  Store, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X,
  Check,
  MapPin,
  Star,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Sparkles,
  Loader2,
  ExternalLink,
  Download,
  Building2,
  ChevronDown,
  ChevronUp,
  Upload,
  FileSpreadsheet,
  ArrowRight,
  Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BulkSearchResult {
  google_place_id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  address_street: string;
  address_number: string;
  category: string;
  rating: number | null;
  review_count: number | null;
  lat: number | null;
  lng: number | null;
  types: string[];
  selected?: boolean;
  importing?: boolean;
  imported?: boolean;
  enriched?: boolean;
  website?: string;
  description?: string;
  short_description?: string;
}

export default function AdminPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showReviewsOverview, setShowReviewsOverview] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [aiSearchUrl, setAiSearchUrl] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // Bulk import state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkSearchCity, setBulkSearchCity] = useState('');
  const [bulkSearchCategory, setBulkSearchCategory] = useState('');
  const [bulkSearchResults, setBulkSearchResults] = useState<BulkSearchResult[]>([]);
  const [isBulkSearching, setIsBulkSearching] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkImportProgress, setBulkImportProgress] = useState({ current: 0, total: 0 });
  
  // CSV import state
  const [csvData, setCsvData] = useState<BulkSearchResult[]>([]);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvRawHeaders, setCsvRawHeaders] = useState<string[]>([]);
  const [csvRawData, setCsvRawData] = useState<Record<string, string>[]>([]);
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  
  // Partner field definitions for mapping
  const PARTNER_FIELDS = [
    { key: 'name', label: 'Name *', required: true },
    { key: 'category', label: 'Kategorie', required: false },
    { key: 'address_street', label: 'Strasse', required: false },
    { key: 'address_number', label: 'Hausnummer', required: false },
    { key: 'postal_code', label: 'PLZ', required: false },
    { key: 'city', label: 'Stadt', required: false },
    { key: 'website', label: 'Website', required: false },
    { key: 'description', label: 'Beschreibung', required: false },
    { key: 'short_description', label: 'Kurzbeschreibung', required: false },
    { key: 'google_place_id', label: 'Google Place ID', required: false },
    { key: 'rating', label: 'Rating', required: false },
    { key: 'review_count', label: 'Anzahl Reviews', required: false },
    { key: 'lat', label: 'Breitengrad', required: false },
    { key: 'lng', label: 'Längengrad', required: false },
  ];
  
  const PARTNER_CATEGORIES = [
    'Restaurant',
    'Café',
    'Bar',
    'Bäckerei',
    'Metzgerei',
    'Take-Away',
    'Fitness',
    'Wellness & Spa',
    'Kosmetik & Beauty',
    'Coiffeur',
    'Mode & Bekleidung',
    'Schuhe & Accessoires',
    'Schmuck & Uhren',
    'Optiker',
    'Blumen & Garten',
    'Lebensmittel',
    'Handwerk',
    'Autowerkstatt',
    'Tankstelle',
    'Hotel',
    'Freizeit & Kultur',
    'Sport',
    'Gesundheit',
    'Dienstleistung',
    'Einzelhandel',
    'Sonstiges'
  ];
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    category: '',
    address_street: '',
    address_number: '',
    postal_code: '',
    city: '',
    website: '',
    is_active: false,
    is_featured: false,
    google_place_id: '',
  });
  
  const loadPartners = async () => {
    setIsLoading(true);
    try {
      const data = await getAllPartners();
      setPartners(data);
    } catch (error) {
      console.error('Failed to load partners:', error);
      toast.error('Partner konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLastSyncDate = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'google_reviews_last_sync')
        .single();
      
      if (data?.value) {
        setLastSyncDate(data.value as string);
      }
    } catch (error) {
      // Setting might not exist yet
    }
  };

  // Sync Google Reviews for a single partner
  const syncSinglePartnerReviews = async (partnerId: string) => {
    try {
      toast.info('Google Reviews werden synchronisiert...');
      const { data, error } = await supabase.functions.invoke('sync-google-reviews');
      
      if (error) throw error;
      
      // Find and update the specific partner in state
      const result = data?.results?.find((r: any) => r.partnerId === partnerId);
      if (result?.success) {
        setPartners(prev => prev.map(p => 
          p.id === partnerId 
            ? { ...p, google_rating: result.rating, google_review_count: result.reviewCount }
            : p
        ));
        toast.success(`Google Reviews aktualisiert: ${result.rating?.toFixed(1) || '-'}★ (${result.reviewCount || 0} Bewertungen)`);
      }
      
      loadPartners(); // Reload to get fresh data
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Google Reviews konnten nicht synchronisiert werden');
    }
  };
  
  useEffect(() => {
    loadPartners();
    loadLastSyncDate();
  }, []);
  
  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      short_description: '',
      category: '',
      address_street: '',
      address_number: '',
      postal_code: '',
      city: '',
      website: '',
      is_active: false,
      is_featured: false,
      google_place_id: '',
    });
  };
  
  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-generate slug if empty
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const { partner, error } = await createPartner({ ...formData, slug });
    
    if (error) {
      toast.error(`Fehler: ${error}`);
      return;
    }
    
    if (partner) {
      setPartners(prev => [partner, ...prev]);
      toast.success('Partner erfolgreich erstellt');
      setShowCreateForm(false);
      resetForm();
      
      // Auto-sync Google Reviews if Place ID was provided
      if (formData.google_place_id) {
        syncSinglePartnerReviews(partner.id);
      }
    }
  };
  
  const handleUpdatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    
    const placeIdChanged = formData.google_place_id !== editingPartner.google_place_id;
    
    const { success, error } = await updatePartner(editingPartner.id, formData);
    
    if (error) {
      toast.error(`Fehler: ${error}`);
      return;
    }
    
    if (success) {
      setPartners(prev => prev.map(p => 
        p.id === editingPartner.id ? { ...p, ...formData } : p
      ));
      toast.success('Partner erfolgreich aktualisiert');
      setEditingPartner(null);
      resetForm();
      
      // Auto-sync Google Reviews if Place ID was added or changed
      if (placeIdChanged && formData.google_place_id) {
        syncSinglePartnerReviews(editingPartner.id);
      }
    }
  };
  
  const handleDeletePartner = async (partner: Partner) => {
    if (!confirm(`Partner "${partner.name}" wirklich löschen?`)) return;
    
    const { success, error } = await deletePartner(partner.id);
    
    if (error) {
      toast.error(`Fehler: ${error}`);
      return;
    }
    
    if (success) {
      setPartners(prev => prev.filter(p => p.id !== partner.id));
      toast.success('Partner erfolgreich gelöscht');
    }
  };
  
  const openEditForm = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      slug: partner.slug,
      description: partner.description || '',
      short_description: partner.short_description || '',
      category: partner.category || '',
      address_street: partner.address_street || '',
      address_number: partner.address_number || '',
      postal_code: partner.postal_code || '',
      city: partner.city || '',
      website: partner.website || '',
      is_active: partner.is_active,
      is_featured: partner.is_featured,
      google_place_id: partner.google_place_id || '',
    });
    setShowCreateForm(false);
  };

  const handleAiScrape = async () => {
    if (!aiSearchUrl.trim()) {
      toast.error('Bitte gib eine Website-URL ein');
      return;
    }
    
    setIsAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-partner-info', {
        body: { url: aiSearchUrl }
      });
      
      if (error) throw error;
      
      if (data?.success && data?.data) {
        const scraped = data.data;
        // Auto-generate slug from name
        const generatedSlug = scraped.name 
          ? scraped.name.toLowerCase()
              .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
              .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          : '';
        setFormData(prev => ({
          ...prev,
          name: scraped.name || prev.name,
          slug: generatedSlug || prev.slug,
          description: scraped.description || prev.description,
          short_description: scraped.short_description || prev.short_description,
          category: scraped.category || prev.category,
          address_street: scraped.address_street || prev.address_street,
          address_number: scraped.address_number || prev.address_number,
          postal_code: scraped.postal_code || prev.postal_code,
          city: scraped.city || prev.city,
          website: scraped.website || prev.website,
          google_place_id: scraped.google_place_id || prev.google_place_id,
        }));
        toast.success('Partner-Daten erfolgreich geladen!');
        setAiSearchUrl('');
      } else {
        toast.error(data?.error || 'Keine Daten gefunden');
      }
    } catch (error) {
      console.error('AI scrape error:', error);
      toast.error('Fehler beim Laden der Partner-Daten');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Bulk search function
  const handleBulkSearch = async () => {
    if (!bulkSearchCity.trim()) {
      toast.error('Bitte eine Stadt eingeben');
      return;
    }
    
    setIsBulkSearching(true);
    setBulkSearchResults([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('search-partners-bulk', {
        body: { 
          city: bulkSearchCity.trim(),
          category: bulkSearchCategory || undefined
        }
      });
      
      if (error) throw error;
      
      if (data?.success && data?.data) {
        // Filter out already existing partners by google_place_id
        const existingPlaceIds = new Set(partners.map(p => p.google_place_id).filter(Boolean));
        const newResults = data.data.filter((r: BulkSearchResult) => !existingPlaceIds.has(r.google_place_id));
        
        setBulkSearchResults(newResults.map((r: BulkSearchResult) => ({ ...r, selected: false })));
        toast.success(`${newResults.length} neue Geschäfte gefunden (${data.data.length - newResults.length} bereits vorhanden)`);
      } else {
        toast.error(data?.error || 'Keine Ergebnisse');
      }
    } catch (error) {
      console.error('Bulk search error:', error);
      toast.error('Fehler bei der Suche');
    } finally {
      setIsBulkSearching(false);
    }
  };

  // Toggle selection
  const toggleBulkSelection = (index: number) => {
    setBulkSearchResults(prev => prev.map((r, i) => 
      i === index ? { ...r, selected: !r.selected } : r
    ));
  };

  // Select all
  const toggleSelectAll = () => {
    const allSelected = bulkSearchResults.every(r => r.selected);
    setBulkSearchResults(prev => prev.map(r => ({ ...r, selected: !allSelected })));
  };

  // Import selected partners
  const handleBulkImport = async () => {
    const selected = bulkSearchResults.filter(r => r.selected && !r.imported);
    if (selected.length === 0) {
      toast.error('Keine Partner ausgewählt');
      return;
    }
    
    setIsBulkImporting(true);
    setBulkImportProgress({ current: 0, total: selected.length });
    
    let successCount = 0;
    
    for (let i = 0; i < selected.length; i++) {
      const result = selected[i];
      setBulkImportProgress({ current: i + 1, total: selected.length });
      
      // Mark as importing
      setBulkSearchResults(prev => prev.map(r => 
        r.google_place_id === result.google_place_id ? { ...r, importing: true } : r
      ));
      
      try {
        // Generate slug
        const slug = result.name
          .toLowerCase()
          .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
          .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        // Create partner
        const { partner, error } = await createPartner({
          name: result.name,
          slug,
          category: result.category,
          address_street: result.address_street,
          address_number: result.address_number,
          postal_code: result.postal_code,
          city: result.city,
          google_place_id: result.google_place_id,
          is_active: false, // Default inactive
          is_featured: false,
          lat: result.lat,
          lng: result.lng,
          google_rating: result.rating,
          google_review_count: result.review_count,
        });
        
        if (error) {
          console.error(`Error importing ${result.name}:`, error);
          setBulkSearchResults(prev => prev.map(r => 
            r.google_place_id === result.google_place_id ? { ...r, importing: false } : r
          ));
        } else {
          successCount++;
          if (partner) {
            setPartners(prev => [partner, ...prev]);
          }
          setBulkSearchResults(prev => prev.map(r => 
            r.google_place_id === result.google_place_id ? { ...r, importing: false, imported: true, selected: false } : r
          ));
        }
      } catch (error) {
        console.error(`Error importing ${result.name}:`, error);
        setBulkSearchResults(prev => prev.map(r => 
          r.google_place_id === result.google_place_id ? { ...r, importing: false } : r
        ));
      }
      
      // Small delay between imports
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setIsBulkImporting(false);
    toast.success(`${successCount} Partner erfolgreich importiert`);
  };

  // CSV parsing function - returns headers and raw data
  const parseCSV = (text: string): { headers: string[], rows: Record<string, string>[] } => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return { headers: [], rows: [] };
    
    // Parse header - handle both semicolon and comma as delimiter
    const delimiter = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/['"]/g, ''));
    
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
      if (values.length === headers.length) {
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        rows.push(row);
      }
    }
    return { headers, rows };
  };

  // Auto-detect column mapping based on common column names
  const autoDetectMapping = (headers: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {};
    const lowerHeaders = headers.map(h => h.toLowerCase());
    
    // Define common aliases for each field
    const fieldAliases: Record<string, string[]> = {
      name: ['name', 'firmenname', 'geschäft', 'partner', 'firma', 'unternehmen', 'business'],
      category: ['category', 'kategorie', 'branche', 'type', 'typ'],
      address_street: ['address_street', 'strasse', 'street', 'adresse', 'address'],
      address_number: ['address_number', 'hausnummer', 'nr', 'number', 'hnr'],
      postal_code: ['postal_code', 'plz', 'postleitzahl', 'zip', 'zipcode'],
      city: ['city', 'stadt', 'ort', 'gemeinde', 'town'],
      website: ['website', 'url', 'homepage', 'web', 'webseite'],
      description: ['description', 'beschreibung', 'desc', 'info'],
      short_description: ['short_description', 'kurzbeschreibung', 'kurztext', 'short_desc'],
      google_place_id: ['google_place_id', 'place_id', 'placeid', 'google_id'],
      rating: ['rating', 'bewertung', 'sterne', 'stars'],
      review_count: ['review_count', 'reviews', 'anzahl_bewertungen', 'bewertungen'],
      lat: ['lat', 'latitude', 'breitengrad'],
      lng: ['lng', 'longitude', 'längengrad', 'laengengrad'],
    };
    
    // Match headers to fields
    for (const [field, aliases] of Object.entries(fieldAliases)) {
      for (const header of headers) {
        if (aliases.includes(header.toLowerCase())) {
          mapping[field] = header;
          break;
        }
      }
    }
    
    return mapping;
  };

  // Map CSV row using custom column mapping
  const mapCsvToPartnerWithMapping = (row: Record<string, string>, mapping: Record<string, string>): BulkSearchResult | null => {
    const getValue = (field: string): string => {
      const csvColumn = mapping[field];
      return csvColumn ? (row[csvColumn] || '') : '';
    };
    
    const name = getValue('name');
    if (!name) return null;

    const placeId = getValue('google_place_id');
    
    return {
      google_place_id: placeId || `csv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      address: '',
      city: getValue('city'),
      postal_code: getValue('postal_code'),
      address_street: getValue('address_street'),
      address_number: getValue('address_number'),
      category: getValue('category') || 'Sonstiges',
      rating: getValue('rating') ? parseFloat(getValue('rating')) : null,
      review_count: getValue('review_count') ? parseInt(getValue('review_count')) : null,
      lat: getValue('lat') ? parseFloat(getValue('lat')) : null,
      lng: getValue('lng') ? parseFloat(getValue('lng')) : null,
      types: [],
      selected: false,
      website: getValue('website'),
      description: getValue('description'),
      short_description: getValue('short_description'),
    };
  };

  // Apply column mapping and show preview
  const applyColumnMapping = () => {
    if (!columnMapping.name) {
      toast.error('Bitte mindestens die Spalte "Name" zuordnen');
      return;
    }
    
    // Map data using custom mapping
    const existingNames = new Set(partners.map(p => p.name.toLowerCase()));
    const existingPlaceIds = new Set(partners.map(p => p.google_place_id).filter(Boolean));
    
    const mappedData = csvRawData
      .map(row => mapCsvToPartnerWithMapping(row, columnMapping))
      .filter((p): p is BulkSearchResult => p !== null)
      .filter(p => !existingNames.has(p.name.toLowerCase()) && !existingPlaceIds.has(p.google_place_id));

    setCsvData(mappedData.map(d => ({ ...d, selected: true })));
    setShowColumnMapping(false);
    
    toast.success(`${mappedData.length} Partner gemappt (${csvRawData.length - mappedData.length} übersprungen/bereits vorhanden)`);
  };

  // Handle CSV file upload - now shows column mapping dialog first
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    
    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);
      
      if (rows.length === 0) {
        toast.error('Keine gültigen Daten in der CSV-Datei gefunden');
        return;
      }

      // Store raw data and headers
      setCsvRawHeaders(headers);
      setCsvRawData(rows);
      
      // Auto-detect column mapping
      const autoMapping = autoDetectMapping(headers);
      setColumnMapping(autoMapping);
      
      // Show column mapping dialog
      setShowColumnMapping(true);
      setCsvData([]); // Clear previous data
      
      toast.success(`CSV geladen: ${rows.length} Zeilen, ${headers.length} Spalten`);
    } catch (error) {
      console.error('CSV parse error:', error);
      toast.error('Fehler beim Lesen der CSV-Datei');
    }
    
    // Reset file input
    e.target.value = '';
  };

  // Toggle CSV selection
  const toggleCsvSelection = (index: number) => {
    setCsvData(prev => prev.map((r, i) => 
      i === index ? { ...r, selected: !r.selected } : r
    ));
  };

  // Toggle all CSV
  const toggleCsvSelectAll = () => {
    const allSelected = csvData.every(r => r.selected);
    setCsvData(prev => prev.map(r => ({ ...r, selected: !allSelected })));
  };

  // Import from CSV
  const handleCsvImport = async () => {
    const selected = csvData.filter(r => r.selected && !r.imported);
    if (selected.length === 0) {
      toast.error('Keine Partner ausgewählt');
      return;
    }
    
    setIsBulkImporting(true);
    setBulkImportProgress({ current: 0, total: selected.length });
    
    let successCount = 0;
    
    for (let i = 0; i < selected.length; i++) {
      const result = selected[i];
      setBulkImportProgress({ current: i + 1, total: selected.length });
      
      // Mark as importing
      setCsvData(prev => prev.map(r => 
        r.google_place_id === result.google_place_id ? { ...r, importing: true } : r
      ));
      
      try {
        // Generate slug
        const slug = result.name
          .toLowerCase()
          .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
          .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        // Create partner
        const { partner, error } = await createPartner({
          name: result.name,
          slug,
          description: result.description,
          short_description: result.short_description,
          category: result.category,
          address_street: result.address_street,
          address_number: result.address_number,
          postal_code: result.postal_code,
          city: result.city,
          website: result.website,
          google_place_id: result.google_place_id.startsWith('csv_') ? undefined : result.google_place_id,
          is_active: false,
          is_featured: false,
          lat: result.lat,
          lng: result.lng,
          google_rating: result.rating,
          google_review_count: result.review_count,
        });
        
        if (error) {
          console.error(`Error importing ${result.name}:`, error);
          setCsvData(prev => prev.map(r => 
            r.google_place_id === result.google_place_id ? { ...r, importing: false } : r
          ));
        } else {
          successCount++;
          if (partner) {
            setPartners(prev => [partner, ...prev]);
          }
          setCsvData(prev => prev.map(r => 
            r.google_place_id === result.google_place_id ? { ...r, importing: false, imported: true, selected: false } : r
          ));
        }
      } catch (error) {
        console.error(`Error importing ${result.name}:`, error);
        setCsvData(prev => prev.map(r => 
          r.google_place_id === result.google_place_id ? { ...r, importing: false } : r
        ));
      }
      
      // Small delay between imports
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setIsBulkImporting(false);
    toast.success(`${successCount} Partner aus CSV importiert`);
  };

  // Download CSV template
  const downloadCsvTemplate = () => {
    const headers = ['name', 'kategorie', 'strasse', 'hausnummer', 'plz', 'stadt', 'website', 'beschreibung', 'kurzbeschreibung', 'google_place_id'];
    const exampleRow = ['Muster Café', 'Café', 'Bahnhofstrasse', '12', '5200', 'Brugg', 'https://www.muster.ch', 'Gemütliches Café im Herzen der Stadt', 'Ihr Lieblingscafé', ''];
    
    const csv = [headers.join(';'), exampleRow.join(';')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'partner-import-vorlage.csv';
    link.click();
    URL.revokeObjectURL(url);
  };
  
  const filteredPartners = partners.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSyncGoogleReviews = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-reviews');
      
      if (error) throw error;
      
      // Save last sync date
      const now = new Date().toISOString();
      await supabase.from('system_settings').upsert({
        key: 'google_reviews_last_sync',
        value: now,
        description: 'Letzte Google Reviews Synchronisierung'
      }, { onConflict: 'key' });
      setLastSyncDate(now);
      
      toast.success(`Google Reviews synchronisiert: ${data?.updated || 0} Partner aktualisiert`);
      loadPartners(); // Reload to show updated data
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Fehler beim Synchronisieren der Google Reviews');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (dateStr: string | null) => {
    if (!dateStr) return 'Noch nie synchronisiert';
    const date = new Date(dateStr);
    return date.toLocaleString('de-CH', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const partnersWithReviews = partners.filter(p => p.google_place_id);
  const partnersWithoutReviews = partners.filter(p => !p.google_place_id);
  
  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partner verwalten</h1>
          <p className="text-muted-foreground">{partners.length} Partner insgesamt</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkImport(!showBulkImport)}
            className={cn(
              "btn-ghost",
              showBulkImport && "bg-accent/10 text-accent"
            )}
          >
            <Download className="h-4 w-4" />
            Bulk-Import
          </button>
          <button
            onClick={() => setShowReviewsOverview(!showReviewsOverview)}
            className={cn(
              "btn-ghost",
              showReviewsOverview && "bg-primary/10 text-primary"
            )}
          >
            <Star className="h-4 w-4" />
            Reviews
          </button>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingPartner(null);
              resetForm();
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Partner hinzufügen
          </button>
        </div>
      </div>

      {/* Bulk Import Section */}
      {showBulkImport && (
        <div className="card-base p-6 animate-in space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-accent" />
                Massenerfassung
              </h2>
              <p className="text-sm text-muted-foreground">
                Suche Geschäfte via Google Places oder importiere aus CSV
              </p>
            </div>
            <button
              onClick={() => setShowBulkImport(false)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs for Google Places vs CSV */}
          <div className="flex gap-2 border-b border-border pb-3">
            <button
              onClick={() => setShowCsvImport(false)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                !showCsvImport ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Search className="h-4 w-4 inline mr-2" />
              Google Places
            </button>
            <button
              onClick={() => setShowCsvImport(true)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                showCsvImport ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <FileSpreadsheet className="h-4 w-4 inline mr-2" />
              CSV-Import
            </button>
          </div>

          {/* Google Places Search */}
          {!showCsvImport && (
            <>
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium mb-1">Stadt *</label>
                  <input
                    type="text"
                    value={bulkSearchCity}
                    onChange={(e) => setBulkSearchCity(e.target.value)}
                    placeholder="z.B. Brugg, Baden, Zürich..."
                    className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-accent/30 focus:bg-background transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBulkSearch();
                      }
                    }}
                  />
                </div>
                <div className="w-48">
                  <label className="block text-sm font-medium mb-1">Kategorie (optional)</label>
                  <select
                    value={bulkSearchCategory}
                    onChange={(e) => setBulkSearchCategory(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-accent/30 focus:bg-background transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Alle Kategorien</option>
                    {PARTNER_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleBulkSearch}
                    disabled={isBulkSearching}
                    className="btn-primary h-11"
                  >
                    {isBulkSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Suchen
                  </button>
                </div>
              </div>

              {/* Google Places Results */}
              {bulkSearchResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={toggleSelectAll}
                        className="btn-ghost text-sm"
                      >
                        {bulkSearchResults.every(r => r.selected) ? 'Keine auswählen' : 'Alle auswählen'}
                      </button>
                      <span className="text-sm text-muted-foreground">
                        {bulkSearchResults.filter(r => r.selected).length} von {bulkSearchResults.length} ausgewählt
                      </span>
                    </div>
                    <button
                      onClick={handleBulkImport}
                      disabled={isBulkImporting || bulkSearchResults.filter(r => r.selected && !r.imported).length === 0}
                      className="btn-primary"
                    >
                      {isBulkImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {bulkImportProgress.current}/{bulkImportProgress.total}
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Importieren ({bulkSearchResults.filter(r => r.selected && !r.imported).length})
                        </>
                      )}
                    </button>
                  </div>

                  <div className="divide-y divide-border rounded-xl border overflow-hidden max-h-96 overflow-y-auto">
                    {bulkSearchResults.map((result, index) => (
                      <div 
                        key={result.google_place_id}
                        className={cn(
                          "flex items-center gap-3 p-3 transition-colors",
                          result.imported ? "bg-success/10" : result.selected ? "bg-accent/5" : "bg-card hover:bg-muted/50",
                          result.importing && "opacity-50"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={result.selected || result.imported}
                          disabled={result.imported || result.importing}
                          onChange={() => toggleBulkSelection(index)}
                          className="h-5 w-5 rounded"
                        />
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted flex-shrink-0">
                          <Store className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate flex items-center gap-2">
                            {result.name}
                            {result.imported && <CheckCircle2 className="h-4 w-4 text-success" />}
                            {result.importing && <Loader2 className="h-4 w-4 animate-spin" />}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="px-2 py-0.5 rounded bg-muted">{result.category}</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {result.city}
                            </span>
                            {result.rating && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-accent fill-accent" />
                                {result.rating.toFixed(1)} ({result.review_count})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* CSV Import */}
          {showCsvImport && (
            <div className="space-y-4">
              {/* Column Mapping Dialog */}
              {showColumnMapping && csvRawHeaders.length > 0 && (
                <div className="p-5 rounded-xl bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-5 w-5 text-accent" />
                      <h3 className="font-bold">Spalten-Mapping</h3>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {csvRawData.length} Zeilen geladen
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Ordne deine CSV-Spalten den Partner-Feldern zu. Automatisch erkannte Zuordnungen sind bereits ausgewählt.
                  </p>
                  
                  {/* Preview of first row */}
                  {csvRawData.length > 0 && (
                    <div className="p-3 rounded-lg bg-muted/50 text-xs">
                      <div className="font-medium mb-1 text-muted-foreground">Vorschau erste Zeile:</div>
                      <div className="flex flex-wrap gap-2">
                        {csvRawHeaders.slice(0, 6).map(header => (
                          <span key={header} className="px-2 py-1 rounded bg-background border">
                            <span className="font-medium">{header}:</span>{' '}
                            <span className="text-muted-foreground">{csvRawData[0][header]?.substring(0, 20) || '(leer)'}</span>
                          </span>
                        ))}
                        {csvRawHeaders.length > 6 && (
                          <span className="px-2 py-1 text-muted-foreground">+{csvRawHeaders.length - 6} weitere</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Mapping Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PARTNER_FIELDS.map(field => (
                      <div key={field.key} className="flex items-center gap-3">
                        <div className="w-36 text-sm font-medium flex items-center gap-1">
                          {field.label}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <select
                          value={columnMapping[field.key] || ''}
                          onChange={(e) => setColumnMapping(prev => ({
                            ...prev,
                            [field.key]: e.target.value
                          }))}
                          className={cn(
                            "flex-1 h-9 px-3 rounded-lg bg-background border text-sm",
                            "focus:outline-none focus:ring-2 focus:ring-accent/30",
                            columnMapping[field.key] && "border-accent/50 bg-accent/5"
                          )}
                        >
                          <option value="">-- Nicht zuordnen --</option>
                          {csvRawHeaders.map(header => (
                            <option key={header} value={header}>
                              {header}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <button
                      onClick={() => {
                        setShowColumnMapping(false);
                        setCsvRawHeaders([]);
                        setCsvRawData([]);
                        setCsvFileName('');
                      }}
                      className="btn-ghost"
                    >
                      <X className="h-4 w-4" />
                      Abbrechen
                    </button>
                    <button
                      onClick={applyColumnMapping}
                      disabled={!columnMapping.name}
                      className="btn-primary"
                    >
                      <Check className="h-4 w-4" />
                      Mapping anwenden
                    </button>
                  </div>
                </div>
              )}
              
              {/* Upload Area - only show if not in mapping mode */}
              {!showColumnMapping && (
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium mb-1">CSV-Datei hochladen</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Beliebige Spalten – du kannst sie im nächsten Schritt zuordnen
                  </p>
                  <div className="flex justify-center gap-3">
                    <label className="btn-primary cursor-pointer">
                      <Upload className="h-4 w-4" />
                      CSV auswählen
                      <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleCsvUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={downloadCsvTemplate}
                      className="btn-ghost"
                    >
                      <Download className="h-4 w-4" />
                      Vorlage herunterladen
                    </button>
                  </div>
                  {csvFileName && csvData.length > 0 && (
                    <p className="text-sm text-accent mt-3">
                      Geladen: {csvFileName} ({csvData.length} Partner bereit)
                    </p>
                  )}
                </div>
              )}

              {/* CSV Data Preview */}
              {csvData.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={toggleCsvSelectAll}
                        className="btn-ghost text-sm"
                      >
                        {csvData.every(r => r.selected) ? 'Keine auswählen' : 'Alle auswählen'}
                      </button>
                      <span className="text-sm text-muted-foreground">
                        {csvData.filter(r => r.selected).length} von {csvData.length} ausgewählt
                      </span>
                    </div>
                    <button
                      onClick={handleCsvImport}
                      disabled={isBulkImporting || csvData.filter(r => r.selected && !r.imported).length === 0}
                      className="btn-primary"
                    >
                      {isBulkImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {bulkImportProgress.current}/{bulkImportProgress.total}
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Importieren ({csvData.filter(r => r.selected && !r.imported).length})
                        </>
                      )}
                    </button>
                  </div>

                  <div className="divide-y divide-border rounded-xl border overflow-hidden max-h-96 overflow-y-auto">
                    {csvData.map((result, index) => (
                      <div 
                        key={result.google_place_id}
                        className={cn(
                          "flex items-center gap-3 p-3 transition-colors",
                          result.imported ? "bg-success/10" : result.selected ? "bg-accent/5" : "bg-card hover:bg-muted/50",
                          result.importing && "opacity-50"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={result.selected || result.imported}
                          disabled={result.imported || result.importing}
                          onChange={() => toggleCsvSelection(index)}
                          className="h-5 w-5 rounded"
                        />
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted flex-shrink-0">
                          <Store className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate flex items-center gap-2">
                            {result.name}
                            {result.imported && <CheckCircle2 className="h-4 w-4 text-success" />}
                            {result.importing && <Loader2 className="h-4 w-4 animate-spin" />}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="px-2 py-0.5 rounded bg-muted">{result.category}</span>
                            {result.city && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {result.city}
                              </span>
                            )}
                            {result.website && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                Website
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Google Reviews Overview */}
      {showReviewsOverview && (
        <div className="card-base p-6 animate-in space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Star className="h-5 w-5 text-accent" />
                Google Reviews Übersicht
              </h2>
              <p className="text-sm text-muted-foreground">
                {partnersWithReviews.length} von {partners.length} Partnern mit Google Place ID
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Letzte Synchronisierung: {formatLastSync(lastSyncDate)}
              </p>
            </div>
            <button
              onClick={handleSyncGoogleReviews}
              disabled={isSyncing}
              className="btn-secondary"
            >
              <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
              {isSyncing ? 'Synchronisiere...' : 'Jetzt synchronisieren'}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-success/10 text-center">
              <div className="text-2xl font-bold text-success">{partnersWithReviews.length}</div>
              <div className="text-xs text-muted-foreground">Mit Place ID</div>
            </div>
            <div className="p-4 rounded-xl bg-warning/10 text-center">
              <div className="text-2xl font-bold text-warning">{partnersWithoutReviews.length}</div>
              <div className="text-xs text-muted-foreground">Ohne Place ID</div>
            </div>
            <div className="p-4 rounded-xl bg-primary/10 text-center">
              <div className="text-2xl font-bold text-primary">
                {partnersWithReviews.filter(p => p.google_rating).length > 0
                  ? (partnersWithReviews.reduce((sum, p) => sum + (p.google_rating || 0), 0) / 
                     partnersWithReviews.filter(p => p.google_rating).length).toFixed(1)
                  : '-'}
              </div>
              <div className="text-xs text-muted-foreground">Ø Rating</div>
            </div>
            <div className="p-4 rounded-xl bg-accent/10 text-center">
              <div className="text-2xl font-bold text-accent">
                {partnersWithReviews.reduce((sum, p) => sum + (p.google_review_count || 0), 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Reviews</div>
            </div>
          </div>

          {/* Partners with Reviews */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Partner mit Google Reviews
            </h3>
            {partnersWithReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Noch keine Partner mit Google Place ID konfiguriert
              </p>
            ) : (
              <div className="divide-y divide-border rounded-xl border overflow-hidden">
                {partnersWithReviews.map(partner => (
                  <div key={partner.id} className="flex items-center gap-4 p-3 bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 flex-shrink-0">
                      {partner.logo_url ? (
                        <img src={partner.logo_url} alt={partner.name} className="h-full w-full object-cover rounded-xl" />
                      ) : (
                        <Store className="h-5 w-5 text-secondary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{partner.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {partner.google_place_id}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {partner.google_rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-accent fill-accent" />
                          <span className="font-bold">{partner.google_rating.toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">
                            ({partner.google_review_count || 0})
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Keine Daten</span>
                      )}
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Partners without Reviews */}
          {partnersWithoutReviews.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Partner ohne Google Place ID
              </h3>
              <div className="divide-y divide-border rounded-xl border overflow-hidden">
                {partnersWithoutReviews.map(partner => (
                  <div key={partner.id} className="flex items-center gap-4 p-3 bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted flex-shrink-0">
                      {partner.logo_url ? (
                        <img src={partner.logo_url} alt={partner.name} className="h-full w-full object-cover rounded-xl" />
                      ) : (
                        <Store className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{partner.name}</div>
                      <div className="text-xs text-warning">Google Place ID fehlt</div>
                    </div>
                    <button
                      onClick={() => openEditForm(partner)}
                      className="btn-ghost text-sm"
                    >
                      <Edit className="h-4 w-4" />
                      Bearbeiten
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Partner suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 rounded-2xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
        />
      </div>
      
      {/* Create/Edit Form */}
      {(showCreateForm || editingPartner) && (
        <div className="card-base p-6 animate-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              {editingPartner ? 'Partner bearbeiten' : 'Neuer Partner'}
            </h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingPartner(null);
                resetForm();
              }}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* AI Assistant for new partners */}
          {!editingPartner && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-accent" />
                <span className="font-semibold">AI-Assistent</span>
                <span className="text-xs text-muted-foreground">– Website eingeben, Daten automatisch laden</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={aiSearchUrl}
                  onChange={(e) => setAiSearchUrl(e.target.value)}
                  placeholder="https://www.partner-website.ch"
                  className="flex-1 h-11 px-4 rounded-xl bg-background border-2 border-transparent focus:outline-none focus:border-accent/30 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAiScrape();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAiScrape}
                  disabled={isAiLoading}
                  className="btn-primary px-6"
                >
                  {isAiLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Laden
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          
          <form onSubmit={editingPartner ? handleUpdatePartner : handleCreatePartner} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
                  placeholder="z.B. Café Sonnenschein"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
                  placeholder="cafe-sonnenschein (auto-generiert)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Kategorie</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all appearance-none cursor-pointer"
                >
                  <option value="">Kategorie wählen...</option>
                  {PARTNER_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Stadt</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
                  placeholder="z.B. Brugg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Strasse</label>
                <input
                  type="text"
                  value={formData.address_street}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_street: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
                  placeholder="z.B. Bahnhofstrasse"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Nr.</label>
                  <input
                    type="text"
                    value={formData.address_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_number: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
                    placeholder="12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">PLZ</label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
                    placeholder="5200"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Kurzbeschreibung</label>
              <input
                type="text"
                value={formData.short_description}
                onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
                placeholder="Kurze Beschreibung für Listen"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Beschreibung</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all resize-none"
                placeholder="Ausführliche Beschreibung"
              />
            </div>
            
            {/* Google Place ID */}
            <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <Star className="h-4 w-4 text-accent" />
                Google Place ID
              </label>
              <input
                type="text"
                value={formData.google_place_id}
                onChange={(e) => setFormData(prev => ({ ...prev, google_place_id: e.target.value }))}
                className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
                placeholder="z.B. ChIJ..."
              />
              <p className="text-xs text-muted-foreground mt-2">
                Die Google Place ID findest du auf{' '}
                <a 
                  href="https://developers.google.com/maps/documentation/places/web-service/place-id" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Google Place ID Finder
                </a>
              </p>
            </div>
            
            {/* Website */}
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
                placeholder="https://www.beispiel.ch"
              />
            </div>
            
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-5 w-5 rounded"
                />
                <span className="text-sm font-medium">Aktiv</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="h-5 w-5 rounded"
                />
                <span className="text-sm font-medium">Featured</span>
              </label>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary">
                <Check className="h-4 w-4" />
                {editingPartner ? 'Speichern' : 'Erstellen'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingPartner(null);
                  resetForm();
                }}
                className="btn-ghost"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Partners List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))
        ) : filteredPartners.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Partner gefunden</p>
          </div>
        ) : (
          filteredPartners.map(partner => (
            <div
              key={partner.id}
              className="card-base p-4 flex items-center gap-4"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 flex-shrink-0">
                {partner.logo_url ? (
                  <img src={partner.logo_url} alt={partner.name} className="h-full w-full object-cover rounded-2xl" />
                ) : (
                  <Store className="h-6 w-6 text-secondary" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold truncate">{partner.name}</h3>
                  {partner.is_featured && (
                    <Star className="h-4 w-4 text-accent fill-accent" />
                  )}
                  {!partner.is_active && (
                    <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">Inaktiv</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {partner.category && <span>{partner.category}</span>}
                  {partner.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {partner.city}
                    </span>
                  )}
                  {partner.website && (
                    <a
                      href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Globe className="h-3 w-3" />
                      Website
                    </a>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <a
                  href={`/partner-portal?partner_id=${partner.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
                  title="Partner-Dashboard öffnen"
                >
                  <ExternalLink className="h-4 w-4 text-primary" />
                </a>
                <button
                  onClick={() => openEditForm(partner)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDeletePartner(partner)}
                  className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
