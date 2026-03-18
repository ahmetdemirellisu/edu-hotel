/**
 * Branded bilingual HTML email layout for EDU Hotel.
 */

/**
 * Wraps EN + TR body sections in the branded outer template.
 * @param {string} bodyEN - HTML for English section
 * @param {string} bodyTR - HTML for Turkish section
 * @returns {string} Full HTML email
 */
function emailTemplate(bodyEN, bodyTR) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>EDU Hotel</title>
</head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:#eef2f7;padding:36px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background:#ffffff;border-radius:14px;
             overflow:hidden;box-shadow:0 4px 20px rgba(0,51,102,0.12);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#003366 0%,#0055aa 100%);
                     padding:26px 36px 22px;">
            <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;
                      letter-spacing:2.5px;text-transform:uppercase;">EDU Hotel</p>
            <p style="margin:4px 0 0;font-size:11.5px;color:rgba(255,255,255,0.65);
                      letter-spacing:0.4px;">Sabancı University &nbsp;·&nbsp; Sabancı Üniversitesi</p>
          </td>
        </tr>

        <!-- English Body -->
        <tr>
          <td style="padding:32px 36px 24px;font-size:14px;color:#1e293b;line-height:1.75;">
            ${bodyEN}
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 36px;">
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:0;"/>
          </td>
        </tr>

        <!-- Turkish Body -->
        <tr>
          <td style="padding:24px 36px 32px;font-size:14px;color:#1e293b;line-height:1.75;">
            ${bodyTR}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:14px 36px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.9;">
              EDU Hotel &nbsp;·&nbsp; Sabancı Üniversitesi, Tuzla 34956, İstanbul<br/>
              <a href="mailto:hotel@sabanciuniv.edu"
                 style="color:#94a3b8;text-decoration:none;">hotel@sabanciuniv.edu</a>
              &nbsp;·&nbsp; +90 (216) 483 9000
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Renders a colored pill badge.
 * @param {string} text
 * @param {'green'|'red'|'orange'|'blue'} color
 */
function badge(text, color) {
  const styles = {
    green:  { bg: '#dcfce7', fg: '#166534' },
    red:    { bg: '#fee2e2', fg: '#991b1b' },
    orange: { bg: '#fef3c7', fg: '#92400e' },
    blue:   { bg: '#dbeafe', fg: '#1e40af' },
  };
  const s = styles[color] || styles.blue;
  return `<span style="display:inline-block;padding:5px 16px;border-radius:999px;margin-bottom:16px;
    background:${s.bg};color:${s.fg};font-size:12.5px;font-weight:700;letter-spacing:0.5px;">${text}</span>`;
}

/**
 * Renders a single label–value row for the detail table.
 * Returns '' if value is null/undefined/empty string.
 */
function row(label, value) {
  if (value === null || value === undefined || value === '') return '';
  return `<tr>
    <td style="padding:5px 12px 5px 0;font-size:13px;color:#64748b;
               width:150px;vertical-align:top;white-space:nowrap;">${label}</td>
    <td style="padding:5px 0;font-size:13px;color:#0f172a;font-weight:600;">${value}</td>
  </tr>`;
}

/**
 * Wraps row strings in a styled detail table container.
 */
function detailTable(rows) {
  const content = rows.filter(Boolean).join('');
  if (!content) return '';
  return `<table cellpadding="0" cellspacing="0"
          style="margin:12px 0 20px;width:100%;border-collapse:collapse;
                 background:#f8fafc;border-radius:8px;padding:4px 14px;">
    <tbody>${content}</tbody>
  </table>`;
}

/**
 * Renders a section heading.
 */
function heading(text) {
  return `<p style="margin:20px 0 6px;font-size:12px;font-weight:700;
                    color:#003366;letter-spacing:0.8px;text-transform:uppercase;">${text}</p>`;
}

// Human-readable labels for DB enum values
const ACCOMM_LABELS = {
  PERSONAL:  { en: 'Personal',       tr: 'Kişisel'       },
  CORPORATE: { en: 'Corporate (SU)', tr: 'Kurumsal (SÜ)' },
  EDUCATION: { en: 'Education',      tr: 'Eğitim'        },
};
const INVOICE_LABELS = {
  INDIVIDUAL: { en: 'Individual', tr: 'Bireysel' },
  CORPORATE:  { en: 'Corporate',  tr: 'Kurumsal' },
};

module.exports = { emailTemplate, badge, row, detailTable, heading, ACCOMM_LABELS, INVOICE_LABELS };
