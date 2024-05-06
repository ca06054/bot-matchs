const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const {
    insertPartido,
    insertAsistente,
    getLastPartido,
    getAsistentesByPartidoId,
    deleteAsistenteById
} = require('./databaseUtils');

const client = new Client({
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2410.1.html',
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});


client.on('message', async message => {
    const { from, body } = message;
    const contact = await message.getContact();
    console.log(JSON.stringify(contact),JSON.stringify(from),JSON.stringify(body));
    if (body.startsWith('/crear')) {
        const descripcion = message.body.slice(7).trim();
        if(!descripcion) return;
        try {
            const partido = await insertPartido(descripcion);
            client.sendMessage(from, `🎉 Inicia la convocatoria para el partido del ${descripcion} 🎉`);
        } catch (error) {
            client.sendMessage(from, '❌ Error al insertar partido:' + error);
        }
    } else if (message.body.startsWith('/voy')) {
        try {
            const ultimoPartido = await getLastPartido();
            console.log(JSON.stringify(ultimoPartido));
            
            const asistente = await insertAsistente(contact.number, contact.name, ultimoPartido.id);
            const asistentes = await getAsistentesByPartidoId(ultimoPartido.id);
            client.sendMessage(from, listarAsistentesConNumeros(asistentes));
        } catch (error) {
            client.sendMessage(from, 'Error al agregar asistente: '+error);
        }
    } if (body.startsWith('/invitar')) {
        const descripcion = message.body.slice(8).trim();
        if(!descripcion) return;
        try {
            const ultimoPartido = await getLastPartido();
            const asistente = await insertAsistente(contact.number, descripcion, ultimoPartido.id);
            const asistentes = await getAsistentesByPartidoId(ultimoPartido.id);
            client.sendMessage(from, listarAsistentesConNumeros(asistentes));
        } catch (error) {
            client.sendMessage(from, '❌ Error al agregar asistente: '+error);
        }
    } else if (message.body.startsWith('/baja')) {
        const id = message.body.slice(6).trim();
        if(!id) return;
        try {
            const ultimoPartido = await getLastPartido();
            let asistentes = await getAsistentesByPartidoId(ultimoPartido.id);
            const asistente=asistentes[id-1];
            const resultadoEliminacion = await deleteAsistenteById(asistente.id); 
            asistentes = await getAsistentesByPartidoId(ultimoPartido.id);
            client.sendMessage(from, listarAsistentesConNumeros(asistentes));
        } catch (error) {
            client.sendMessage(from, '❌ Error al dar de baja asistente: '+error);
        } 
    } else if (message.body === '/listar') {
        try {
            const ultimoPartido = await getLastPartido();
            if(!ultimoPartido) return;
            const asistentes = await getAsistentesByPartidoId(ultimoPartido.id);
            client.sendMessage(from, listarAsistentesConNumeros(asistentes));
        } catch (error) {
            client.sendMessage(from, '❌ Error al listar asistentes: '+error);
        }
      
    }
});


 function listarAsistentesConNumeros(asistentes,partido) {
    return asistentes && asistentes.length > 0
      ? '📋 Asistentes del '+partido.descripcion +':\n' + asistentes.map((asistente, index) => `${index + 1}. ${asistente.descripcion}`).join("\n")
      : "No hay asistentes para este partido.";
  }
  
  
client.initialize();
