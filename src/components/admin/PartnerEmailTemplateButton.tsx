import { useState } from 'react';
import { Copy, Check, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const EMAIL_SUBJECT = 'Mehr Stammkunden, bessere Bewertungen – kostenlos testen';

const EMAIL_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My 2Go App von Radio 2Go</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #0C4A56 0%, #0a3d47 100%); padding: 32px 40px; text-align: center;">
              <img src="https://my2go.lovable.app/pwa-192x192.png" alt="Radio 2Go Logo" style="width: 80px; height: 80px; margin-bottom: 16px; border-radius: 16px;">
              <h1 style="margin: 0; color: #F7B500; font-size: 28px; font-weight: 700;">My 2Go App</h1>
              <p style="margin: 8px 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">von Radio 2Go • Hör Radio. Sammle Taler. Geniess vor Ort.</p>
            </td>
          </tr>
          
          <!-- Gold accent bar -->
          <tr>
            <td style="background-color: #F7B500; height: 4px;"></td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              
              <p style="margin: 0 0 20px; font-size: 16px; color: #333333;">
                Guten Tag,
              </p>
              
              <p style="margin: 0 0 24px; font-size: 16px; color: #333333; line-height: 1.6;">
                wussten Sie, dass <strong>70% der Neukunden nie wiederkommen</strong>? Und nur 5% hinterlassen aktiv eine Google-Bewertung?
              </p>
              
              <p style="margin: 0 0 24px; font-size: 16px; color: #333333; line-height: 1.6;">
                Mit der <strong>My 2Go App von Radio 2Go</strong> ändern Sie das – ganz ohne Aufwand.
              </p>
              
              <!-- Value Proposition Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 16px; font-size: 18px; color: #0C4A56;">So funktioniert die My 2Go App:</h2>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0; vertical-align: top; width: 40px;">
                          <span style="display: inline-block; width: 28px; height: 28px; background-color: #F7B500; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; color: #0C4A56;">1</span>
                        </td>
                        <td style="padding: 8px 0; color: #333333; font-size: 15px;">
                          <strong>Kunden hören Radio 2Go</strong> in der App und sammeln dabei automatisch Taler
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; vertical-align: top; width: 40px;">
                          <span style="display: inline-block; width: 28px; height: 28px; background-color: #F7B500; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; color: #0C4A56;">2</span>
                        </td>
                        <td style="padding: 8px 0; color: #333333; font-size: 15px;">
                          <strong>Sie bieten Prämien</strong> – z.B. 10% Rabatt oder ein Gratis-Getränk
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; vertical-align: top; width: 40px;">
                          <span style="display: inline-block; width: 28px; height: 28px; background-color: #F7B500; border-radius: 50%; text-align: center; line-height: 28px; font-weight: bold; color: #0C4A56;">3</span>
                        </td>
                        <td style="padding: 8px 0; color: #333333; font-size: 15px;">
                          <strong>Kunden lösen bei Ihnen ein</strong> – und kommen wieder
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Benefits -->
              <h3 style="margin: 0 0 16px; font-size: 16px; color: #0C4A56;">Das bringt Ihnen die My 2Go App:</h3>
              <table cellpadding="0" cellspacing="0" style="margin-bottom: 24px;" width="100%">
                <tr>
                  <td style="padding: 6px 0; color: #333333; font-size: 15px;">✓ <strong>Mehr Stammkunden</strong> – Kunden sammeln Taler und kommen wieder</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #333333; font-size: 15px;">✓ <strong>Bessere Google-Bewertungen</strong> – automatische Review-Anfragen nach positiven Erlebnissen</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #333333; font-size: 15px;">✓ <strong>Radio-Präsenz</strong> – Ihr Name im Radio, ohne eigenes Werbebudget</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #333333; font-size: 15px;">✓ <strong>Live-Dashboard</strong> – Scans, Einlösungen & Reviews auf einen Blick</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #333333; font-size: 15px;">✓ <strong>Alles inklusive</strong> – QR-Steller, Aufkleber, persönliches Onboarding</td>
                </tr>
              </table>
              
              <!-- Pricing -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0C4A56; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 4px; color: #F7B500; font-size: 14px; font-weight: 600;">30 TAGE KOSTENLOS TESTEN</p>
                    <p style="margin: 0 0 8px; color: #ffffff; font-size: 28px; font-weight: 700;">Ab CHF 249<span style="font-size: 14px; opacity: 0.8;">/Monat</span></p>
                    <p style="margin: 0; color: #ffffff; font-size: 13px; opacity: 0.8;">30 Tage Geld-zurück-Garantie • DSGVO-konform</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTAs -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                <tr>
                  <td align="center">
                    <a href="https://my2go.lovable.app/go" style="display: inline-block; background-color: #F7B500; color: #0C4A56; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 8px;">
                      Jetzt kostenlos starten →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Calendar Link -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://calendly.com/radio2go/partner-demo" style="display: inline-block; background-color: #ffffff; color: #0C4A56; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 8px; border: 2px solid #0C4A56;">
                      📅 Termin für Beratungsgespräch vereinbaren
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 32px 0 0; font-size: 15px; color: #333333; line-height: 1.6;">
                Haben Sie Fragen? Antworten Sie einfach auf diese E-Mail – wir melden uns persönlich.
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
                © 2025 My 2Go App von Radio 2Go • Das lokale Bonusprogramm
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

Wussten Sie, dass 70% der Neukunden nie wiederkommen? Und nur 5% hinterlassen aktiv eine Google-Bewertung?

Mit der My 2Go App von Radio 2Go ändern Sie das – ganz ohne Aufwand.

SO FUNKTIONIERT DIE MY 2GO APP:
1. Kunden hören Radio 2Go in der App und sammeln dabei automatisch Taler
2. Sie bieten Prämien – z.B. 10% Rabatt oder ein Gratis-Getränk
3. Kunden lösen bei Ihnen ein – und kommen wieder

DAS BRINGT IHNEN DIE MY 2GO APP:
✓ Mehr Stammkunden – Kunden sammeln Taler und kommen wieder
✓ Bessere Google-Bewertungen – automatische Review-Anfragen
✓ Radio-Präsenz – Ihr Name im Radio, ohne eigenes Werbebudget
✓ Live-Dashboard – Scans, Einlösungen & Reviews auf einen Blick
✓ Alles inklusive – QR-Steller, Aufkleber, persönliches Onboarding

30 TAGE KOSTENLOS TESTEN
Ab CHF 249/Monat
30 Tage Geld-zurück-Garantie • DSGVO-konform

→ Jetzt kostenlos starten: https://my2go.lovable.app/go

📅 Termin für Beratungsgespräch vereinbaren: https://calendly.com/radio2go/partner-demo

Haben Sie Fragen? Antworten Sie einfach auf diese E-Mail – wir melden uns persönlich.

Herzliche Grüsse
Ihr Radio 2Go Team

---
my2go.lovable.app/go
© 2025 My 2Go App von Radio 2Go • Das lokale Bonusprogramm`;

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
      <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl max-h-[calc(100vh-4rem)] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Partner-Akquise E-Mail</DialogTitle>
          <DialogDescription>
            Formatierte E-Mail-Vorlage für die Erstansprache von Partnerbetrieben
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 pb-6">
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
              <div className="border rounded-lg overflow-hidden bg-white">
                <iframe
                  srcDoc={EMAIL_HTML}
                  title="Email Preview"
                  className="w-full h-[350px] border-0"
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
