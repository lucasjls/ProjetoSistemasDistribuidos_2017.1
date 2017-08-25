var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var timesyncServer = require('timesync/server');

var MongoClient = require('mongodb').MongoClient
	,format = require('util').format;
var url = 'mongodb://localhost:27017/teste';

users = [];
usersSalas = [];
socketlist = [];
connections =  [];
var rooms = [];
var cont = 0;
listaRespostas = [];
var lider = '';
listaLideres = [];
var entrouNewUser = false;

server.listen(3000, function(){
	console.log('Servidor rodando...');
});

app.get('/', function (req,res){ 
	res.sendFile(__dirname + '/indextest.html');	
});

var createSalaDB = function(nomeSala){
	MongoClient.connect(url, function(err, db) {
    if(err) throw err;

    var collection = db.collection('Salas');   
	
    collection.insert({id:++cont, nome:nomeSala }, function(err, docs) {
        collection.count(function(err, count) {
            	console.log(format("Quantidade de salas = %s", count));  
            	//TODO: 'cont' deve pegar a qtd de salas            	
        	});
    	});
	});
}

var findSalaByNameDB = function(nomeSala){
		return MongoClient.connect(url).then(function(db) {
	    var collection = db.collection('Salas');
	    
	    return Boolean(collection.find(nomeSala));
	}).then(function(items) {      
	    return items;
    });
}

var findSalasDB = function(){	
		return MongoClient.connect(url).then(function(db) {
	    var collection = db.collection('Salas');
	    
	    return collection.find().toArray();
	}).then(function(items) {      
	    return items;
    });
}

var findQtdSalasDB = function(){	
		return MongoClient.connect(url).then(function(db) {
	    var collection = db.collection('Salas');	    
	    return collection.count();
	}).then(function(items) {      
	    return items;
    });
}

var findQuestoesDB = function(nomeSala){
		return MongoClient.connect(url).then(function(db) {
	    var collection = db.collection('Questoes');
	    
	    return collection.find().toArray();
	}).then(function(items) {      
	    return items;
    });
}




io.on('connection',function(socket){
	connections.push(socket);
	console.log('Conectou - Existem %s sockets conectados.', connections.length);

	//Disonnect
	socket.on('disconnect', function(){		
		users.splice(users.indexOf(socket.username), 1);
				
		var indexUserSalas = usersSalas.map(function(d) { return d['NomeUsuario']; }).indexOf(socket.username);			
		usersSalas.splice(indexUserSalas, 1);
		
		socketlist.splice(socketlist.indexOf(socket.username), 1);
		
		listaLideres.splice(listaLideres.indexOf(socket.username), 1);
		lider = listaLideres[0];
		
		updateLideres(lider,listaLideres);
		updateUserNames(listaLideres);
		connections.splice(connections.indexOf(socket), 1);		
		console.log('Desconectado - Existem %s sockets conectados', connections.length);	
	});

	function updateUserNames(){
		//io.emit('get users', users); //DEVE TROCAR PARA MULTCAST
		io.emit('get users', usersSalas);
	}

	function updateLideres(lider,listaLideres){	
		console.log('\n Lider: '+lider);
		console.log('ListaLideres: '+listaLideres+'\n');
		io.emit('atualizaLider', lider);				
	}
	//Send Message
	socket.on('send message',function(data){				
		io.emit('new message', {msg: data, user: socket.username});
	});
	socket.on('send message simple',function(data){	
		console.log('Client message: '+data.message);			
		socket.emit('new message', 'Hello! '+ {data: data.nameSocket});		
	});

	//New Room
	socket.on('new room',function(data){			
		console.log(data);
		rooms.push(data);
		createSalaDB(data);			
	});

	socket.on('get rooms', function(){		
		updateRoomsDB();
	});

	function updateRoomsDB(){
		
		console.log("Atualizando salas...");

		findSalasDB().then(function(items) {
			console.info(' *SALAS* A promisse retornou os items! \n ', items);		  	
		  	socket.emit('get rooms', items);
		}, function(err) {
		  console.error('*SALAS* A promise foi rejeitada!', err, err.stack);		  
		});	
		findQtdSalasDB().then(function(items) {
			console.info(' *QtdSALAS* A promisse retornou os items!', items);
			cont = items;
			console.log('Contador atualizado - Cont: '+ cont);		  	
  		}, function(err) {
		  console.error(' *QtdSALAS* A promise foi rejeitada!', err, err.stack);		  
		});			
	}

	//New User
	socket.on('new user',function(userName, nomeSala, callback){	
		callback(true);	
		socket.username = userName;
		socket.nomeSala = nomeSala;
		//console.log("-----------------------------New User Data: "+userName);
		//console.log("-----------------------------New User NomeSala: "+nomeSala);
		users.push(socket.username);		
		usersSalas.push({NomeUsuario:socket.username,NomeSala:socket.nomeSala});		
		socketlist.push({Socket:socket, SocketNome:socket.username});
		
		listaLideres.push(socket.username);
		lider = listaLideres[0];
		console.log('\n Lider: '+lider);
		console.log('ListaLideres: '+listaLideres+'\n');
		
		io.emit('atualizaLider', lider);

		console.log(" -> Lista usersSalas atualizada: ");		
		for (var i = 0; i < usersSalas.length; i++) {
		 	console.log(usersSalas[i].NomeUsuario +" | "+usersSalas[i].NomeSala);
		}
		if(usersSalas.length > 1){
			entrouNewUser = true;
		}
		socket.on('get questoes', function(){	
			getQuestoes();
		});

		updateUserNames();
	});		
	
	function getQuestoes(){
		findQuestoesDB().then(function(items) {
			//console.info(' *Questoes* A promisse retornou os items!', items);		  	
	  		socket.emit('get questoes rec', items);	
		}, function(err) {
		  console.error(' *Questoes* A promise foi rejeitada!', err, err.stack);		  
		});	
	}

	function updateRooms(){		
		io.emit('get rooms', rooms);
	}

	socket.on('get resposta',  function(item_correto){
		/*listaRespostas.push(resposta);
		console.log("Lista de respostas: "+listaRespostas);*/
		if(listaRespostas.length != 0){		
			var teste = 0;
			for(var i = 1; i < listaRespostas.length; i++){
				if(listaRespostas[0] != listaRespostas[i]){
					console.log("*Servidor: As respostas não coincidem");
					socket.emit('resposta servidor', "RespostasNaoCoincidem");
					teste = 1;
					break;
				}
			}	
			if(teste == 0){			
				if(listaRespostas[0] == item_correto){
					console.log("*Servidor: Acertou!");
					io.emit('resposta servidor', "Acertou");
				}else{
					console.log("*Servidor: Errou!");
					io.emit('resposta servidor', "Errou");
				}
			} 	
		}else{
			socket.emit('resposta servidor',"SemResposta");
		}

	});

	socket.on('mandar questao',function(resposta){
		listaRespostas.push(resposta);
		console.log("Lista de respostas: "+listaRespostas);	
		io.emit('getMandarRespostas', listaRespostas);	
	});

	socket.on('zerarLista', function(){
		listaRespostas = [];
		console.log("Lista de respostas: "+listaRespostas);
		io.emit('getMandarRespostas', listaRespostas);
	});
	
	socket.on('inciarCronometro', function(){	
		mudaTempo();
	});

	function mudaTempo(){					
		var i = 1;
		var looper = setInterval(function(){ 		
			//console.log("*****entrouNewUser: "+ entrouNewUser + " | Quantidade: "+usersSalas.length);
		    io.emit('mudaTempo', i++); 

		    if (i == 61	|| entrouNewUser == true)
		    {
		    	entrouNewUser = false;
		        clearInterval(looper);
		        io.emit('mudaTempo', 0); 
		    }

		}, 1000);	
	}	
});
 	