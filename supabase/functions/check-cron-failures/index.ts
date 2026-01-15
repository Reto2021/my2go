import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CronJobRun {
  jobid: number;
  runid: number;
  job_pid: number;
  database: string;
  username: string;
  command: string;
  status: string;
  return_message: string;
  start_time: string;
  end_time: string;
}

interface CronJob {
  jobid: number;
  schedule: string;
  command: string;
  nodename: string;
  nodeport: number;
  database: string;
  username: string;
  active: boolean;
  jobname: string;
}

interface ResendEmailResponse {
  id?: string;
  error?: { message: string };
}

async function sendEmail(resendApiKey: string, to: string, subject: string, html: string): Promise<ResendEmailResponse> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: "my2go System <notifications@my2go.de>",
      to: [to],
      subject,
      html,
    }),
  });

  return response.json();
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Resend API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the admin email from system_settings or use default
    const { data: settingsData } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "admin_notification_email")
      .single();

    const adminEmail = (settingsData?.value as string) || "admin@my2go.de";

    console.log(`Checking for failed cron jobs, notifications will be sent to: ${adminEmail}`);

    // Get recent cron job runs (last hour) that failed
    const { data: recentRuns, error: runsError } = await supabase.rpc("get_cron_job_runs");

    if (runsError) {
      console.error("Error fetching cron job runs:", runsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch cron job runs", details: runsError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get job names for better context
    const { data: cronJobs } = await supabase.rpc("get_cron_jobs");
    const jobNameMap = new Map<number, string>();
    if (cronJobs) {
      (cronJobs as CronJob[]).forEach((job) => {
        jobNameMap.set(job.jobid, job.jobname || `Job ${job.jobid}`);
      });
    }

    // Filter for failed runs in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const failedRuns = (recentRuns as CronJobRun[] || []).filter((run) => {
      const runTime = new Date(run.start_time);
      const isFailed = run.status === "failed";
      const isRecent = runTime >= oneHourAgo;
      return isFailed && isRecent;
    });

    if (failedRuns.length === 0) {
      console.log("No failed cron jobs in the last hour");
      return new Response(
        JSON.stringify({ message: "No failures detected", checked: recentRuns?.length || 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${failedRuns.length} failed cron job(s)`);

    // Build the email content
    const failureDetails = failedRuns.map((run) => {
      const jobName = jobNameMap.get(run.jobid) || `Job ${run.jobid}`;
      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px; font-weight: 600;">${jobName}</td>
          <td style="padding: 12px;">${new Date(run.start_time).toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}</td>
          <td style="padding: 12px;">
            <span style="background: #fee2e2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Fehlgeschlagen</span>
          </td>
          <td style="padding: 12px; font-family: monospace; font-size: 12px; max-width: 300px; word-break: break-all;">${run.return_message || "Keine Details verfügbar"}</td>
        </tr>
      `;
    }).join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Cron-Job Fehler</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">⚠️ Cron-Job Fehler erkannt</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">my2go System-Benachrichtigung</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="margin-top: 0;">Es wurden <strong>${failedRuns.length} fehlgeschlagene Cron-Job(s)</strong> in der letzten Stunde erkannt:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Job Name</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Zeitpunkt</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Status</th>
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Fehlermeldung</th>
                </tr>
              </thead>
              <tbody>
                ${failureDetails}
              </tbody>
            </table>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <strong style="color: #92400e;">Empfohlene Maßnahmen:</strong>
              <ul style="margin: 10px 0 0; padding-left: 20px; color: #78350f;">
                <li>Überprüfen Sie die Logs der betroffenen Edge Functions</li>
                <li>Prüfen Sie ob alle API-Keys gültig sind</li>
                <li>Kontrollieren Sie die Netzwerk-Verbindungen</li>
              </ul>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 12px; margin-bottom: 0;">
              Diese E-Mail wurde automatisch von my2go generiert.<br>
              Zeitpunkt: ${new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}
            </p>
          </div>
        </body>
      </html>
    `;

    // Send the notification email
    const emailResult = await sendEmail(
      resendApiKey,
      adminEmail,
      `⚠️ ${failedRuns.length} Cron-Job(s) fehlgeschlagen - my2go`,
      emailHtml
    );

    if (emailResult.error) {
      console.error("Error sending notification email:", emailResult.error);
      return new Response(
        JSON.stringify({ error: "Failed to send notification", details: emailResult.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Notification email sent successfully:", emailResult.id);

    return new Response(
      JSON.stringify({
        message: "Failure notification sent",
        failedJobs: failedRuns.length,
        emailId: emailResult.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Check cron failures error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
