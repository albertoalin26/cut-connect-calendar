
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  action: "new" | "updated" | "cancelled";
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, clientName, service, date, time, action }: EmailRequest = await req.json();

    // Create subject and email content based on action type
    let subject = "";
    let heading = "";
    let content = "";

    switch (action) {
      case "new":
        subject = "Nuovo Appuntamento Confermato";
        heading = "Nuovo Appuntamento Confermato";
        content = `Gentile ${clientName}, il tuo appuntamento per ${service} è stato confermato per il giorno ${date} alle ore ${time}.`;
        break;
      case "updated":
        subject = "Appuntamento Aggiornato";
        heading = "Appuntamento Aggiornato";
        content = `Gentile ${clientName}, il tuo appuntamento per ${service} è stato aggiornato per il giorno ${date} alle ore ${time}.`;
        break;
      case "cancelled":
        subject = "Appuntamento Cancellato";
        heading = "Appuntamento Cancellato";
        content = `Gentile ${clientName}, il tuo appuntamento per ${service} previsto per il giorno ${date} alle ore ${time} è stato cancellato.`;
        break;
    }

    const { data, error } = await resend.emails.send({
      from: "Salone Achi <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h1 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">${heading}</h1>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">${content}</p>
        <p style="font-size: 16px; line-height: 1.5; color: #555;">Se hai domande o necessiti di modificare il tuo appuntamento, contattaci.</p>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #888;">
          <p>Salone Achi<br>
          Via Roma, 123<br>
          Milano, Italia<br>
          Tel: 02 123 4567</p>
        </div>
      </div>
      `,
    });

    if (error) {
      console.error("Error sending email:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in send-appointment-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
})
