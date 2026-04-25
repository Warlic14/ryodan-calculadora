const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const express = require('express');

// Configuración del bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
    ]
});

// Servidor HTTP para mantener el bot activo en Render.com
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    const status = client.isReady() ? '🟢 Online' : '🟡 Conectando...';
    res.send(`Bot de Calculadora de Robux - Estado: ${status}`);
});

app.get('/ping', (req, res) => {
    res.send('Pong! 🏓');
});

app.get('/status', (req, res) => {
    res.json({
        status: client.isReady() ? 'online' : 'connecting',
        user: client.user?.tag || 'No conectado',
        servers: client.guilds.cache.size || 0
    });
});

// Iniciar servidor Express INMEDIATAMENTE (Render lo necesita)
app.listen(PORT, () => {
    console.log(`✅ Servidor web corriendo en puerto ${PORT}`);
    console.log(`📡 Render puede detectar el servicio ahora`);
});

// Tasas de conversión reales
// 100 Robux = 3,500 COP → 1 Robux = 35 COP
// 100 Robux = 15.5 MXN → 1 Robux = 0.155 MXN
// 100 Robux = 0.83 USD → 1 Robux = 0.0083 USD
const TASAS = {
    COP: {
        robuxAMoneda: 35,           // 1 Robux = 35 COP
        monedaARobux: 1/35,         // 1 COP = 0.0286 Robux
        simbolo: '$',
        nombre: 'COP'
    },
    MXN: {
        robuxAMoneda: 0.155,        // 1 Robux = 0.155 MXN
        monedaARobux: 1/0.155,      // 1 MXN = 6.45 Robux
        simbolo: '$',
        nombre: 'MXN'
    },
    USD: {
        robuxAMoneda: 0.0083,       // 1 Robux = 0.0083 USD
        monedaARobux: 1/0.0083,     // 1 USD = 120.48 Robux
        simbolo: '$',
        nombre: 'USD'
    }
};

// Función para calcular Robux a dinero
function robuxADinero(robux, moneda = 'COP') {
    const tasa = TASAS[moneda];
    const total = robux * tasa.robuxAMoneda;
    return { total, simbolo: tasa.simbolo, nombre: tasa.nombre };
}

// Función para calcular dinero a Robux
function dineroARobux(dinero, moneda = 'COP') {
    const tasa = TASAS[moneda];
    const robux = dinero * tasa.monedaARobux;
    return { robux, simbolo: tasa.simbolo, nombre: tasa.nombre };
}

// Evento cuando el bot está listo
client.once('ready', async () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
    console.log(`📊 ID del bot: ${client.user.id}`);
    console.log(`🌐 Conectado a ${client.guilds.cache.size} servidor(es)`);
    
    // Registrar comandos slash
    const commands = [
        new SlashCommandBuilder()
            .setName('calculadora')
            .setDescription('Calculadora de conversión Robux ↔ Dinero'),
        
        new SlashCommandBuilder()
            .setName('robux')
            .setDescription('Convierte Robux a dinero')
            .addIntegerOption(option =>
                option.setName('cantidad')
                    .setDescription('Cantidad de Robux')
                    .setRequired(true)
                    .setMinValue(1))
            .addStringOption(option =>
                option.setName('moneda')
                    .setDescription('Moneda de conversión')
                    .setRequired(false)
                    .addChoices(
                        { name: '🇨🇴 Pesos Colombianos (COP)', value: 'COP' },
                        { name: '🇲🇽 Pesos Mexicanos (MXN)', value: 'MXN' },
                        { name: '🇺🇸 Dólares (USD)', value: 'USD' }
                    )),
        
        new SlashCommandBuilder()
            .setName('dinero')
            .setDescription('Convierte dinero a Robux')
            .addNumberOption(option =>
                option.setName('cantidad')
                    .setDescription('Cantidad de dinero')
                    .setRequired(true)
                    .setMinValue(1))
            .addStringOption(option =>
                option.setName('moneda')
                    .setDescription('Moneda de tu dinero')
                    .setRequired(false)
                    .addChoices(
                        { name: '🇨🇴 Pesos Colombianos (COP)', value: 'COP' },
                        { name: '🇲🇽 Pesos Mexicanos (MXN)', value: 'MXN' },
                        { name: '🇺🇸 Dólares (USD)', value: 'USD' }
                    )),
        
        new SlashCommandBuilder()
            .setName('tasas')
            .setDescription('Muestra las tasas de conversión actuales')
    ];

    try {
        await client.application.commands.set(commands);
        console.log('✅ Comandos registrados correctamente');
    } catch (error) {
        console.error('Error registrando comandos:', error);
    }
});

// Manejo de comandos slash
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

    // Comandos slash
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        if (commandName === 'calculadora') {
            const embed = new EmbedBuilder()
                .setColor('#00D9FF')
                .setTitle('🧮 Calculadora de Robux')
                .setDescription('Selecciona qué quieres calcular:')
                .addFields(
                    { name: '💎 Robux → Dinero', value: 'Convierte tus Robux a pesos colombianos', inline: true },
                    { name: '💵 Dinero → Robux', value: 'Calcula cuántos Robux puedes comprar', inline: true }
                )
                .setFooter({ text: 'Usa los botones o los comandos /robux o /dinero' })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('calc_robux')
                        .setLabel('Robux → Dinero')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('💎'),
                    new ButtonBuilder()
                        .setCustomId('calc_dinero')
                        .setLabel('Dinero → Robux')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('💵'),
                    new ButtonBuilder()
                        .setCustomId('ver_tasas')
                        .setLabel('Ver Tasas')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📊')
                );

            await interaction.reply({ embeds: [embed], components: [row] });
        }

        if (commandName === 'robux') {
            const cantidad = interaction.options.getInteger('cantidad');
            const moneda = interaction.options.getString('moneda') || 'COP';
            const resultado = robuxADinero(cantidad, moneda);

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('💎 Conversión: Robux → Dinero')
                .addFields(
                    { name: '🎮 Robux', value: `${cantidad.toLocaleString('es-CO')} R$`, inline: true },
                    { name: `💵 Total (${resultado.nombre})`, value: `${resultado.simbolo}${resultado.total.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${resultado.nombre}`, inline: true }
                )
                .setFooter({ text: `Tasa: 100 R$ = ${resultado.simbolo}${(TASAS[moneda].robuxAMoneda * 100).toLocaleString('es-CO', { minimumFractionDigits: 2 })} ${resultado.nombre}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'dinero') {
            const cantidad = interaction.options.getNumber('cantidad');
            const moneda = interaction.options.getString('moneda') || 'COP';
            const resultado = dineroARobux(cantidad, moneda);

            const embed = new EmbedBuilder()
                .setColor('#00D966')
                .setTitle('💵 Conversión: Dinero → Robux')
                .addFields(
                    { name: `💰 Dinero (${resultado.nombre})`, value: `${resultado.simbolo}${cantidad.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${resultado.nombre}`, inline: true },
                    { name: '💎 Robux', value: `${Math.floor(resultado.robux).toLocaleString('es-CO')} R$`, inline: true }
                )
                .setFooter({ text: `Tasa: ${resultado.simbolo}100 ${resultado.nombre} = ${Math.floor(100 * TASAS[moneda].monedaARobux).toLocaleString('es-CO')} R$` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'tasas') {
            const embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle('📊 Tasas de Conversión Actuales')
                .setDescription('Estas son las tasas utilizadas para los cálculos:')
                .addFields(
                    { name: '🇨🇴 Colombia (COP)', value: `100 R$ = $${(TASAS.COP.robuxAMoneda * 100).toLocaleString('es-CO')} COP\n$100 COP = ${Math.floor(100 * TASAS.COP.monedaARobux)} R$`, inline: true },
                    { name: '🇲🇽 México (MXN)', value: `100 R$ = $${(TASAS.MXN.robuxAMoneda * 100).toLocaleString('es-CO', { minimumFractionDigits: 2 })} MXN\n$100 MXN = ${Math.floor(100 * TASAS.MXN.monedaARobux)} R$`, inline: true },
                    { name: '🇺🇸 USA (USD)', value: `100 R$ = $${(TASAS.USD.robuxAMoneda * 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD\n$100 USD = ${Math.floor(100 * TASAS.USD.monedaARobux).toLocaleString('en-US')} R$`, inline: true }
                )
                .setFooter({ text: 'Tasas basadas en los precios oficiales de Roblox' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    }

    // Manejo de botones
    if (interaction.isButton()) {
        if (interaction.customId === 'ver_tasas') {
            const embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle('📊 Tasas de Conversión Actuales')
                .setDescription('Estas son las tasas utilizadas para los cálculos:')
                .addFields(
                    { name: '🇨🇴 Colombia (COP)', value: `100 R$ = $${(TASAS.COP.robuxAMoneda * 100).toLocaleString('es-CO')} COP\n$100 COP = ${Math.floor(100 * TASAS.COP.monedaARobux)} R$`, inline: true },
                    { name: '🇲🇽 México (MXN)', value: `100 R$ = $${(TASAS.MXN.robuxAMoneda * 100).toLocaleString('es-CO', { minimumFractionDigits: 2 })} MXN\n$100 MXN = ${Math.floor(100 * TASAS.MXN.monedaARobux)} R$`, inline: true },
                    { name: '🇺🇸 USA (USD)', value: `100 R$ = $${(TASAS.USD.robuxAMoneda * 100).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD\n$100 USD = ${Math.floor(100 * TASAS.USD.monedaARobux).toLocaleString('en-US')} R$`, inline: true }
                )
                .setFooter({ text: 'Tasas basadas en los precios oficiales de Roblox' })
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (interaction.customId === 'calc_robux' || interaction.customId === 'calc_dinero') {
            const tipo = interaction.customId === 'calc_robux' ? 'Robux a Dinero' : 'Dinero a Robux';
            const comando = interaction.customId === 'calc_robux' ? '/robux' : '/dinero';
            const ejemploMoneda = interaction.customId === 'calc_robux' ? 'COP' : 'COP';
            
            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle(`ℹ️ Cómo usar la calculadora`)
                .setDescription(`Para calcular ${tipo}, usa el comando:`)
                .addFields(
                    { 
                        name: 'Comando', 
                        value: `\`${comando} cantidad:[número] moneda:[COP/MXN/USD]\`\n\n**Ejemplos:**\n\`${comando} cantidad:1000 moneda:COP\`\n\`${comando} cantidad:500 moneda:USD\`\n\n*La moneda es opcional (por defecto: COP)*` 
                    }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
});

// Manejadores de errores del cliente
client.on('error', error => {
    console.error('❌ Error del cliente Discord:', error);
});

client.on('warn', info => {
    console.warn('⚠️ Advertencia:', info);
});

client.on('shardError', error => {
    console.error('❌ Error de shard:', error);
});

// Login del bot (usa variable de entorno)
const token = process.env.DISCORD_TOKEN;

if (!token) {
    console.error('❌ ERROR: No se encontró DISCORD_TOKEN en las variables de entorno');
    console.error('❌ Verifica que la variable esté configurada en Render.com');
    process.exit(1);
}

console.log('🔑 Token detectado, longitud:', token.length, 'caracteres');
console.log('🔑 Primeros 10 caracteres:', token.substring(0, 10) + '...');
console.log('🔌 Intentando conectar con Discord...');

client.login(token)
    .then(() => {
        console.log('🔌 Login exitoso, esperando evento ready...');
    })
    .catch(error => {
        console.error('❌ ERROR AL HACER LOGIN:');
        console.error('❌ Tipo de error:', error.name);
        console.error('❌ Mensaje:', error.message);
        console.error('❌ Código:', error.code);
        console.error('❌ Stack:', error.stack);
        
        if (error.code === 'TokenInvalid') {
            console.error('');
            console.error('🔧 SOLUCIÓN:');
            console.error('1. Ve a https://discord.com/developers/applications');
            console.error('2. Selecciona tu aplicación');
            console.error('3. Ve a la sección "Bot"');
            console.error('4. Haz clic en "Reset Token"');
            console.error('5. Copia el NUEVO token COMPLETO');
            console.error('6. Actualízalo en Render.com → Environment → DISCORD_TOKEN');
            console.error('7. Reinicia el servicio');
        }
        
        process.exit(1);
    });
