// Vercel Serverless Function: kirim email lewat SMTP (nodemailer).
// Panggil dengan: POST /api/send-email
// Header : Authorization: Bearer <API_SECRET>
// Body   : { "to": "user@mail.com", "subject": "Kode verifikasi", "text": "Kode kamu: 123456", "html": "<b>opsional</b>" }

const crypto = require('node:crypto')
const nodemailer = require('nodemailer')

// dibuat di luar handler supaya dipakai ulang antar pemanggilan
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465, // 465 = SSL, 587 = STARTTLS
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_KEY },
  connectionTimeout: 8000,
  greetingTimeout: 8000,
  socketTimeout: 8000
})

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/

// bandingkan secret dengan aman (tahan timing attack)
function safeEqual(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest()
  const y = crypto.createHash('sha256').update(String(b)).digest()
  return crypto.timingSafeEqual(x, y)
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  // --- cek konfigurasi ---
  const { API_SECRET, SMTP_USER, SMTP_KEY, MAIL_FROM } = process.env
  if (!API_SECRET || !SMTP_USER || !SMTP_KEY || !MAIL_FROM) {
    console.error('[send-email] environment variable belum lengkap')
    return res.status(500).json({ ok: false, error: 'Server belum dikonfigurasi' })
  }

  // --- autentikasi ---
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token || !safeEqual(token, API_SECRET)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  // --- validasi input ---
  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const to = String(body.to || '').trim()
  const subject = String(body.subject || '').trim()
  const text = body.text == null ? '' : String(body.text)
  const html = body.html == null ? '' : String(body.html)

  if (!EMAIL_RE.test(to) || to.length > 254) {
    return res.status(400).json({ ok: false, error: 'Alamat email tujuan tidak valid' })
  }
  if (!subject || subject.length > 200 || /[\r\n]/.test(subject)) {
    return res.status(400).json({ ok: false, error: 'Subject kosong, terlalu panjang, atau tidak valid' })
  }
  if (!text && !html) {
    return res.status(400).json({ ok: false, error: 'Isi email (text atau html) wajib diisi' })
  }
  if (text.length > 5000 || html.length > 20000) {
    return res.status(400).json({ ok: false, error: 'Isi email terlalu panjang' })
  }

  // --- kirim ---
  try {
    const info = await transporter.sendMail({
      from: MAIL_FROM,
      to,
      subject,
      ...(text ? { text } : {}),
      ...(html ? { html } : {})
    })
    return res.status(200).json({ ok: true, id: info.messageId })
  } catch (e) {
    console.error('[send-email] gagal kirim:', e.message)
    return res.status(502).json({ ok: false, error: 'Gagal mengirim email' })
  }
}
