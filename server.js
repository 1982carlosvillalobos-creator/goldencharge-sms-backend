// server.js - Backend para verificación por SMS (Golden Charge)
// Usa Twilio Verify API + variables de entorno en Render
// =============================================================================

// 1. Dependencias
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

// 2. Leer credenciales desde variables de entorno (Render)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

// 2.1 Validación: Asegurarse de que todas las variables estén definidas
if (!accountSid) {
  console.error('❌ Error: TWILIO_ACCOUNT_SID no está definido en las variables de entorno');
  process.exit(1);
}
if (!authToken) {
  console.error('❌ Error: TWILIO_AUTH_TOKEN no está definido en las variables de entorno');
  process.exit(1);
}
if (!verifySid) {
  console.error('❌ Error: TWILIO_VERIFY_SERVICE_SID no está definido en las variables de entorno');
  process.exit(1);
}

// 2.2 Crear cliente de Twilio
const client = new twilio(accountSid, authToken);

// 3. Inicializar Express
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 4. ENDPOINTS: Enviar y verificar código

// 4A. Enviar código por SMS
app.post('/send-code', async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, error: 'Phone number is required' });
  }

  try {
    const verification = await client.verify.services(verifySid)
      .verifications.create({ to: phone, channel: 'sms' });

    console.log(`✅ Código enviado a ${phone}, estado: ${verification.status}`);
    res.json({ success: true, status: verification.status });
  } catch (err) {
    console.error('❌ Error enviando SMS:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4B. Verificar código ingresado
app.post('/check-code', async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ success: false, error: 'Phone and code are required' });
  }

  try {
    const check = await client.verify.services(verifySid)
      .verificationChecks.create({ to: phone, code });

    if (check.status === 'approved') {
      console.log(`✅ Código verificado correctamente para ${phone}`);
      res.json({ success: true });
    } else {
      console.log(`❌ Código inválido para ${phone}`);
      res.json({ success: false, error: 'Invalid code' });
    }
  } catch (err) {
    console.error('❌ Error verificando código:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Actualización automática de precios (opcional)
const pricesFile = path.join(__dirname, 'prices.json');

app.post('/update-prices', async (req, res) => {
  try {
    const newPrices = await fetchUpdatedPrices();
    fs.writeFileSync(pricesFile, JSON.stringify(newPrices, null, 2), 'utf8');
    res.json({ ok: true, message: 'Precios actualizados correctamente' });
  } catch (e) {
    console.error('❌ Error actualizando precios:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Función simulada para actualizar precios
async function fetchUpdatedPrices() {
  return {
    "panel-100": { base: { small: 3200, medium: 3600, large: 4000 }, factor: { new: 0, mid: 400, old: 800 } },
    "panel-200": { base: { small: 4800, medium: 5200, large: 5800 }, factor: { new: 0, mid: 500, old: 1000 } },
    "ev-charger": { base: { small: 850, medium: 1200, large: 1500 }, factor: { new: 0, mid: 200, old: 400 } },
    "smart-home": { base: { small: 2000, medium: 3500, large: 5000 }, factor: { new: 0, mid: 300, old: 600 } }
  };
}

// 6. Puerto y arranque del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log('🔧 Esperando solicitudes en /send-code y /check-code');
});
