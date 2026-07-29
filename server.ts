import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

async function startServer() {
  try {
    const app = express();
    const PORT = Number(process.env.PORT) || 3000;

    app.use(express.json());

    // API Route: Send Contact Form Email via Resend SMTP
    app.post("/api/contact", async (req, res) => {
      try {
        const { name, phone, company, isDefense, message, email, service } = req.body || {};

        if (!name || !phone) {
          return res.status(400).json({
            success: false,
            error: "Missing required fields (name and phone)",
          });
        }

        console.log(`[CONTACT INQUIRY RECEIVED] From: ${name} (${phone}), Email: ${email || "N/A"}, Company: ${company || "N/A"}`);

        // Resend SMTP Configuration
        const smtpPass = process.env.SMTP_PASS;

        const transporter = nodemailer.createTransport({
          host: "smtp.resend.com",
          port: 587,
          secure: false,
          auth: {
            user: "resend",
            pass: smtpPass,
          },
        });

        const htmlContent = `
          <div style="font-family: Arial, sans-serif; background-color: #0b0c10; color: #f1f5f9; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
            <h2 style="color: #38bdf8; margin-top: 0; border-bottom: 2px solid #38bdf8; padding-bottom: 8px;">
              📩 פנייה חדשה מאתר TECH-SELECT
            </h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px; color: #e2e8f0;">
              <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 10px; font-weight: bold; width: 35%;">שם פונה:</td>
                <td style="padding: 10px;">${name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 10px; font-weight: bold;">טלפון:</td>
                <td style="padding: 10px; font-family: monospace; font-size: 15px; color: #38bdf8;"><a href="tel:${phone}" style="color:#38bdf8; text-decoration:none;">${phone}</a></td>
              </tr>
              ${
                email
                  ? `<tr style="border-bottom: 1px solid #334155;">
                      <td style="padding: 10px; font-weight: bold;">דוא"ל:</td>
                      <td style="padding: 10px;">${email}</td>
                    </tr>`
                  : ""
              }
              <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 10px; font-weight: bold;">חברה / ארגון:</td>
                <td style="padding: 10px;">${company || "לא צוין"}</td>
              </tr>
              <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 10px; font-weight: bold;">פנייה מסווגת / ביטחונית:</td>
                <td style="padding: 10px; color: ${isDefense ? "#34d399" : "#94a3b8"}; font-weight: bold;">
                  ${isDefense ? "🛡️ כן - מתקן מסווג / חברה ביטחונית" : "לא"}
                </td>
              </tr>
              ${
                service
                  ? `<tr style="border-bottom: 1px solid #334155;">
                      <td style="padding: 10px; font-weight: bold;">שירות מבוקש:</td>
                      <td style="padding: 10px;">${service}</td>
                    </tr>`
                  : ""
              }
              <tr>
                <td style="padding: 10px; font-weight: bold; vertical-align: top;">תוכן ההודעה:</td>
                <td style="padding: 10px; white-space: pre-wrap; background-color: #1e293b; border-radius: 6px; color: #f8fafc;">${message || "ללא פירוט נוסף"}</td>
              </tr>
            </table>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: center; border-top: 1px solid #334155; padding-top: 12px;">
              הודעה זו נשלחה אוטומטית מטופס יצירת הקשר באתר TECH-SELECT (https://tech-select.co.il)
            </p>
          </div>
        `;

        const mailOptions = {
          from: "onboarding@resend.dev",
          to: "guyyaakobi@gmail.com",
          replyTo: email || undefined,
          subject: `פנייה חדשה מהאתר - ${req.body?.name || ""}`,
          html: htmlContent,
        };

        try {
          const info = await transporter.sendMail(mailOptions);
          console.log("[RESEND SMTP SUCCESS]", info);
          return res.json({
            success: true,
            message: "Email sent successfully via Resend SMTP",
            info,
          });
        } catch (sendErr: any) {
          console.error("[RESEND SMTP FAILURE]", sendErr);
          return res.status(500).json({
            success: false,
            error: sendErr?.message || "Failed to send email via Resend SMTP",
            details: sendErr,
          });
        }
      } catch (err: any) {
        console.error("[SERVER ERROR]", err);
        return res.status(500).json({
          success: false,
          error: "Internal server error",
          details: err?.message || String(err),
        });
      }
    });

    // Vite middleware for development vs static files for production
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (startupErr) {
    console.error("[FATAL SERVER STARTUP ERROR]", startupErr);
  }
}

startServer();
