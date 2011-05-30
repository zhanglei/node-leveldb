var leveldb = require('../build/default/leveldb.node'),
    DB = leveldb.DB,
    Iterator = leveldb.Iterator,
    WriteBatch = leveldb.WriteBatch;
var net=require('net');

function Memcached(args){
    this.data='';
    this.server=null;
    this.path=args['path']||__dirname + "/testdb";
    this.db=new DB();
    this.cmd=null;
    this.cmdArgs=null;
    this.port=args['port']|| 11211;
    process.on('exit',function(db){
        db.close();
    },this.db);
}

function process_cmd(memcached,cmd,socket,tmps){
    switch(cmd){
    case 'get':
        memcached._handle_get(socket,tmps);
        break;
    case 'set':
        memcached._handle_set(socket,tmps);
        break;
    case 'delete':
        memcached._handle_delete(socket,tmps);
        break;
    case 'quit':
        socket.end();
        break;
    default:
        memcached._reset();
        socket.write("SERVER_ERROR unknow command:"+cmd);
    }
}
Memcached.prototype._reset=function(){
    this.cmd=null;
    this.cmdArgs=null;
}

Memcached.prototype.start=function(){
    console.log("Opening..."+this.path);
    var status = this.db.open({create_if_missing: true, paranoid_checks: true}, this.path);
    console.log("Open "+this.path+" "+status);

    var self=this;
    this.server=net.createServer(function(socket){
        socket.setEncoding("utf-8");
        socket.setNoDelay(true);
        socket.on('data',function(data){
            self.data+=data;
            if(self.cmd!=null){
                process_cmd(self,self.cmd,socket,self.cmdArgs);
                return;
            }
            var index=self.data.indexOf("\r\n");
            if(index>=0){
                var line=self.data.substring(0,index);
                self.data=self.data.substring(index+2);
                var tmps=line.split(" ");
                self.cmd=tmps[0];
                tmps.splice(0,1);
                self.cmdArgs=tmps;
                process_cmd(self,self.cmd,socket,tmps);
            }
        });
    });
    this.server.listen(this.port);
    console.log("Start levelDB-memcached at port "+this.port);
}
Memcached.prototype._handle_get=function(socket,keys){
    if(keys.length==0){
        this._reset();
        socket.write("CLIENT_ERROR invalid_keys\r\n");
        return;
    }
    var self=this;
    keys.forEach(function(key){
        var keyBuf=new Buffer(key);
        try{
            var value=self.db.get({},keyBuf);
            if(value){
                socket.write("VALUE "+key+" 0 "+value.length+"\r\n");
                socket.write(value);
                socket.write("\r\n");
            }

        }catch(error){
            //ignore
        }
    });
    socket.write("END\r\n");
    this._reset();
}

Memcached.prototype._handle_delete=function(socket,tmps){
    var key=new Buffer(tmps[0]);
    var status = this.db.del({}, key);
    if(status=='OK'){
        this._reset();
        socket.write("DELETED\r\n");
    }
}


Memcached.prototype._handle_set=function(socket,tmps){
    var key=new Buffer(tmps[0]);
    var len=Number(tmps[3]);
    if(this.data.length<len){
        return;
    }
    var index=this.data.indexOf("\r\n");
    if(index!=len){
        this._reset();
        this.data=this.data.substring(index+2);
        socket.write("CLIENT_ERROR invalid_value\r\n");
        return;
    }
    var value=new Buffer(this.data.substring(0,len));
    this.data=this.data.substring(len+2);
    var status=this.db.put({},key,value);
    if(status=='OK'){
        this._reset();
        socket.write("STORED\r\n");
    }else{
        this._reset();
        socket.write("SERVER_ERROR "+status+"\r\n");
    }
}


var m=new Memcached({});

m.start();