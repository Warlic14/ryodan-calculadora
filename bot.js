// 🔧 FIX Render / Discord conexión
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

// 🔧 Manejo de errores globales
process.on('uncaughtException', err => {
    console.error('❌ Excepción:', err);
});

process.on('unhandledRejection', err => {
    console.error('❌ Promesa rechazada:', err);
});

// 📦 Imports
const { Client, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const express = require('express');

// 🤖 Cliente Discord (con fix WebSocket)
const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    ws: {
        properties: {
            browser: "Discord iOS"
        }
    }
});

// 🔍 Eventos debug
client.on('ready', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('error', console.error);

client.on('debug', (info) => {
    console.log('🐛 DEBUG:', info);
});

client.on('disconnect', () => {
    console.log('🔌 Bot desconectado');
});

client.on('reconnecting', () => {
    console.log('🔄 Reconectando...');
});

// 🌐 Servidor web (Render)
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot activo 🤖');
});

app.listen(PORT, () => {
    console.log(`✅ Servidor web corriendo en puerto ${PORT}`);
});

// 💰 Tasas
const TASAS = {
    COP: { robuxAMoneda: 35, monedaARobux: 1 / 35 },
    MXN: { robuxAMoneda: 0.155, monedaARobux: 1 / 0.155 },
    USD: { robuxAMoneda: 0.0083, monedaARobux: 1 / 0.0083 }
};

// 🧮 Funciones
function robuxADinero(robux, moneda = 'COP') {
    const tasa = TASAS[moneda] || TASAS['COP'];
    return robux * tasa.robuxAMoneda;
}

function dineroARobux(dinero, moneda = 'COP') {
    const tasa = TASAS[moneda] || TASAS['COP'];
    return dinero * tasa.monedaARobux;
}

// ⚙️ Registrar comandos
client.once('ready', async () => {
    const commands = [
        new SlashCommandBuilder()
            .setName('robux')
            .setDescription('Convierte Robux a COP')
            .addIntegerOption(option =>
                option.setName('cantidad')
                    .setDescription('Cantidad de Robux')
                    .setRequired(true)
            ),

        new SlashCommandBuilder()
            .setName('dinero')
            .setDescription('Convierte dinero a Robux')
            .addNumberOption(option =>
                option.setName('cantidad')
                    .setDescription('Cantidad en COP')
                    .setRequired(true)
            )
    ];

    try {
        await client.application.commands.set(commands);
        console.log('✅ Comandos registrados');
    } catch (error) {
        console.error('❌ Error registrando comandos:', error);
    }
});

// 🎮 Comandos
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'robux') {
        const cantidad = interaction.options.getInteger('cantidad');
        const total = robuxADinero(cantidad);

        await interaction.reply(`💎 ${cantidad} Robux ≈ $${total.toLocaleString('es-CO')} COP`);
    }

    if (commandName === 'dinero') {
        const cantidad = interaction.options.getNumber('cantidad');
        const robux = dineroARobux(cantidad);

        await interaction.reply(`💰 $${cantidad.toLocaleString('es-CO')} ≈ ${Math.round(robux)} Robux`);
    }
});

// 🚀 LOGIN FINAL
console.log("🚀 Llegando al login...");

if (!process.env.DISCORD_TOKEN) {
    console.error("❌ Token no detectado");
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log("✅ Login enviado"))
    .catch(err => console.error("❌ Error en login:", err));
