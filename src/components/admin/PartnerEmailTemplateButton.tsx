import { useState } from 'react';
import { Copy, Check, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const EMAIL_SUBJECT = 'Mehr Laufkundschaft für Ihr Geschäft – ohne Risiko';

const EMAIL_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Radio 2Go Partner werden</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  
  <!-- Container -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0C4A56 0%, #0a3d47 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #F7B500; font-size: 28px; font-weight: 700;">Radio 2Go</h1>
              <p style="margin: 8px 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">Das lokale Bonusprogramm</p>
            </td>
          </tr>
          
          <!-- Gold accent bar -->
          <tr>
            <td style="background-color: #F7B500; height: 4px;"></td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 20px; font-size: 16px; color: #333333;">
                Guten Tag,
              </p>
              
              <!-- Intro -->
              <p style="margin: 0 0 24px; font-size: 16px; color: #333333; line-height: 1.6;">
                wir von <strong>Radio 2Go</strong> bringen Laufkundschaft direkt zu Ihnen – und zwar ohne Aufwand und ohne Risiko.
              </p>
              
              <!-- Value Proposition Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px; font-size: 18px; color: #0C4A56;">So funktioniert's:</h2>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; vertical-align: top;">
                          <span style="display: inline-block; width: 28px; height: 28px; background-color: #F7B500; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; color: #0C4A56; margin-right: 12px;">1</span>
                        </td>
                        <td style="padding: 8px 0; color: #333333; font-size: 15px;">
                          <strong>Hörer sammeln Taler</strong> – einfach beim Radiohören
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; vertical-align: top;">
                          <span style="display: inline-block; width: 28px; height: 28px; background-color: #F7B500; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; color: #0C4A56; margin-right: 12px;">2</span>
                        </td>
                        <td style="padding: 8px 0; color: #333333; font-size: 15px;">
                          <strong>Sie bieten Rabatte</strong> – z.B. 10% oder ein Gratis-Getränk
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; vertical-align: top;">
                          <span style="display: inline-block; width: 28px; height: 28px; background-color: #F7B500; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; color: #0C4A56; margin-right: 12px;">3</span>
                        </td>
                        <td style="padding: 8px 0; color: #333333; font-size: 15px;">
                          <strong>Kunden kommen zu Ihnen</strong> – und lösen ihre Taler ein
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Benefits -->
              <h3 style="margin: 0 0 16px; font-size: 16px; color: #0C4A56;">Ihre Vorteile:</h3>
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 6px 0; color: #333333; font-size: 15px;">✓ <strong>1.400+ aktive Hörer</strong> in Ihrer Region</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #333333; font-size: 15px;">✓ <strong>Mehr Google-Bewertungen</strong> durch integriertes Review-System</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #333333; font-size: 15px;">✓ <strong>Echtzeit-Dashboard</strong> mit Analysen & Statistiken</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #333333; font-size: 15px;">✓ <strong>Kein Risiko</strong> – Sie zahlen nur für echte Einlösungen</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #333333; font-size: 15px;">✓ <strong>POS-Material inklusive</strong> – Aufsteller, Sticker, alles dabei</td>
                </tr>
              </table>
              
              <!-- Pricing Teaser -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0C4A56; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 4px; color: #F7B500; font-size: 14px; font-weight: 600;">EINSTIEG AB</p>
                    <p style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">CHF 49<span style="font-size: 16px; opacity: 0.8;">/Monat</span></p>
                    <p style="margin: 8px 0 0; color: #ffffff; font-size: 13px; opacity: 0.8;">Jederzeit kündbar • Keine Einrichtungsgebühr</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://my2go.lovable.app/go" style="display: inline-block; background-color: #F7B500; color: #0C4A56; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 8px;">
                      Jetzt mehr erfahren →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Closing -->
              <p style="margin: 32px 0 0; font-size: 15px; color: #333333; line-height: 1.6;">
                Haben Sie Fragen? Antworten Sie einfach auf diese E-Mail oder rufen Sie uns an.
              </p>
              
              <p style="margin: 24px 0 0; font-size: 15px; color: #333333;">
                Herzliche Grüsse<br>
                <strong>Ihr Radio 2Go Team</strong>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #666666;">
                <a href="https://my2go.lovable.app/go" style="color: #0C4A56; text-decoration: none; font-weight: 600;">my2go.lovable.app/go</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                © 2025 Radio 2Go • Das lokale Bonusprogramm
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
  
</body>
</html>`;

const EMAIL_PLAIN = `Guten Tag,

wir von Radio 2Go bringen Laufkundschaft direkt zu Ihnen – und zwar ohne Aufwand und ohne Risiko.

SO FUNKTIONIERT'S:
1. Hörer sammeln Taler – einfach beim Radiohören
2. Sie bieten Rabatte – z.B. 10% oder ein Gratis-Getränk
3. Kunden kommen zu Ihnen – und lösen ihre Taler ein

IHRE VORTEILE:
✓ 1.400+ aktive Hörer in Ihrer Region
✓ Mehr Google-Bewertungen durch integriertes Review-System
✓ Echtzeit-Dashboard mit Analysen & Statistiken
✓ Kein Risiko – Sie zahlen nur für echte Einlösungen
✓ POS-Material inklusive – Aufsteller, Sticker, alles dabei

EINSTIEG AB CHF 49/MONAT
Jederzeit kündbar • Keine Einrichtungsgebühr

→ Jetzt mehr erfahren: https://my2go.lovable.app/go

Haben Sie Fragen? Antworten Sie einfach auf diese E-Mail oder rufen Sie uns an.

Herzliche Grüsse
Ihr Radio 2Go Team

---
my2go.lovable.app/go
© 2025 Radio 2Go • Das lokale Bonusprogramm`;

export function PartnerEmailTemplateButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedPlain, setCopiedPlain] = useState(false);
  
  const copyToClipboard = async (text: string, type: 'subject' | 'html' | 'plain') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'subject') {
        setCopiedSubject(true);
        setTimeout(() => setCopiedSubject(false), 2000);
      } else if (type === 'html') {
        setCopiedHtml(true);
        setTimeout(() => setCopiedHtml(false), 2000);
      } else {
        setCopiedPlain(true);
        setTimeout(() => setCopiedPlain(false), 2000);
      }
      toast.success('In Zwischenablage kopiert!');
    } catch (error) {
      toast.error('Kopieren fehlgeschlagen');
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Mail className="h-4 w-4" />
          E-Mail-Vorlage anzeigen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Partner-Akquise E-Mail</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Subject */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Betreff</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(EMAIL_SUBJECT, 'subject')}
                className="gap-1"
              >
                {copiedSubject ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Kopieren
              </Button>
            </div>
            <div className="p-3 bg-muted rounded-lg text-sm font-medium">
              {EMAIL_SUBJECT}
            </div>
          </div>
          
          {/* Preview */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Vorschau</label>
            <div 
              className="border rounded-lg overflow-hidden"
              style={{ maxHeight: '400px', overflow: 'auto' }}
            >
              <iframe
                srcDoc={EMAIL_HTML}
                title="Email Preview"
                className="w-full h-[400px] border-0"
              />
            </div>
          </div>
          
          {/* Copy Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => copyToClipboard(EMAIL_HTML, 'html')}
              className="gap-2"
            >
              {copiedHtml ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              HTML kopieren
            </Button>
            
            <Button
              variant="outline"
              onClick={() => copyToClipboard(EMAIL_PLAIN, 'plain')}
              className="gap-2"
            >
              {copiedPlain ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Plain-Text kopieren
            </Button>
          </div>
          
          {/* Usage Hint */}
          <div className="p-4 bg-accent/10 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Tipp:</strong> Kopiere den HTML-Code und füge ihn in deinen E-Mail-Client ein 
              (z.B. Gmail: "Als HTML einfügen" oder Mailchimp). Für einfache E-Mails nutze die Plain-Text-Version.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
