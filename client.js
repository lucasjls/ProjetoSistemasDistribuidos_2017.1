var io = require('socket.io-client');

var clients = [];

var a = 0;
var nameSocket = '';
var qtdUsers = 9990;
var timer;
conectClients = function(){
	timer = setInterval(connectClient, 50);	
	return;	
};

connectClient = function (){

	if(a > qtdUsers) {clearInterval(timer); return;} 	

	clients[a] = io('http://localhost:3000', {forceNew: true, reconnection: true}); a++;		
	clients[a] = io('http://localhost:3000', {forceNew: true, reconnection: true}); a++;
	clients[a] = io('http://localhost:3000', {forceNew: true, reconnection: true}); a++;
	clients[a] = io('http://localhost:3000', {forceNew: true, reconnection: true}); a++;
	clients[a] = io('http://localhost:3000', {forceNew: true, reconnection: true}); a++;
	clients[a] = io('http://localhost:3000', {forceNew: true, reconnection: true}); a++;
	clients[a] = io('http://localhost:3000', {forceNew: true, reconnection: true}); a++;
	clients[a] = io('http://localhost:3000', {forceNew: true, reconnection: true}); a++;
	clients[a] = io('http://localhost:3000', {forceNew: true, reconnection: true}); a++;
	clients[a] = io('http://localhost:3000', {forceNew: true, reconnection: true}); a++;
	console.log('Clientes conectados: ' + clients.length);	  
}

clientsRequest = function(){
	for(var c = 10; c < qtdUsers; c+= 10){
		//nameSocket = 'Client '+ c;
		clients[c].emit('send message', {message: 'Hello, I am socket Client', name: c});
		clients[c].on('new message', function(data){
			console.log('Server message: '+ data);
		});
	}	
};

conectClients();