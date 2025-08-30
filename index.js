const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const app = express();

// Configuración de Twilio (usa tus credenciales)
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACd49100e1053db003f37809c7e1f80739';
const authToken = process.env.TWILIO_AUTH_TOKEN || '259d5c64985f0514f929f3c8cb741cc';
const client = new twilio(accountSid, authToken);
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+15107377549';

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint para enviar código de verificación
app.post('/send-code', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, error: 'Número de teléfono requerido' });
  }

  // Generar código de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await client.messages.create({
      body: `Golden Charge: Tu código de verificación es: ${code}`,
      from: twilioPhoneNumber,
      to: phone
    });

    console.log(`Código ${code} enviado a ${phone}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error enviando SMS:', error.message);
    res.status(500).json({ success: false, error: 'No se pudo enviar el SMS' });
  }
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
