# Email API (nodemailer + Vercel)

API kecil untuk mengirim email, dipanggil dari bot WhatsApp yang SMTP-nya diblokir.

## Deploy
1. Upload semua file ini ke repo GitHub.
2. Di vercel.com: **Add New > Project**, pilih repo itu, lalu **Deploy**.
3. Isi Environment Variables (lihat `.env.example`), lalu **Redeploy**.

## Pemakaian
```
POST https://NAMA-PROJECT.vercel.app/api/send-email
Authorization: Bearer <API_SECRET>
Content-Type: application/json

{ "to": "user@mail.com", "subject": "Kode verifikasi", "text": "Kode kamu: 123456" }
```
Respons sukses: `{ "ok": true, "id": "..." }`

## Catatan
- `MAIL_FROM` harus alamat yang sudah diverifikasi di penyedia SMTP (misal Brevo: Senders & IP > Senders).
- `API_SECRET` dibuat sendiri, string acak panjang (misal 32+ karakter). Jangan dibagikan.
- Batas pengiriman mengikuti plan penyedia SMTP, bukan Vercel.

## Konfigurasi
Di Vercel, buka Settings > Environment Variables, lalu isi:

	•	API_SECRET: string acak panjang buatanmu sendiri
	
	•	SMTP_HOST: smtp.gmail.com
	
	•	SMTP_PORT: 587
	
	•	SMTP_USER: email akun Gmail
	
	•	SMTP_KEY: App Password 16 karakter
	
	•	MAIL_FROM: alamat Gmail yang sama, misalnya Nama Bot <kamu@gmail.com>
