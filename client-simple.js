var io = require('socket.io-client');

var client = []; var nameSocket = 'simple';
client[0] = io('http://localhost:3000/', {forceNew: true, reconnection: true  });
console.log('Cliente conectado: '+client.length);

client[0].emit('send message simple', {message: 'Hello, I am socket '+nameSocket, name:nameSocket});

client[0].on('new message', function(data){
	console.log('New message: '+ data.data);
});



