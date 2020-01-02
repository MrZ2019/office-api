
var port = '9001'

function getIPAddress(){
	var interfaces = require('os').networkInterfaces();
	for(var devName in interfaces){
		var iface = interfaces[devName];
		for(var i=0;i<iface.length;i++){
			var alias = iface[i];
			if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
				return alias.address;
			}
		}
	}
  }
  
const LOCAL_IP = getIPAddress() || 'localhost'


var fs = require('fs')
var path = require('path')

const Koa = require('koa')
var serve = require('koa-static')
var koaBody = require('koa-body')
var logger = require('koa-logger')
var router = require('koa-router')()

let pathPublic = path.join(__dirname + '/public')
let pathUpload = path.join(pathPublic + '/uploads')


const app = new Koa()
app.use(logger())

app.use(koaBody({multipart: true}))


var SqliteDB = require('./sqlite3.js').SqliteDB;
 
 
 
var file = "office.db";
 
var sqliteDB = new SqliteDB(file, function(exist) {
	var db = this
	if (!exist) {

		db.createTable(`CREATE TABLE photo (
			id       INTEGER      PRIMARY KEY AUTOINCREMENT,
			album_id INTEGER      NOT NULL,
			file     VARCHAR (64) NOT NULL
		);
		`)

		db.createTable(`CREATE TABLE album (
			id       INTEGER      PRIMARY KEY AUTOINCREMENT,
			name     VARCHAR (64) NOT NULL
								  UNIQUE,
			cover_id INTEGER
		);
		`)
	}
});



function addHost(rows) {
	for (let index = 0; index < rows.length; index++) {
		const element = rows[index];
		element.path = `http://${LOCAL_IP}:${port}/uploads/` + element.file
	}
}
async function list() {

	return new Promise((resolve, reject)=> {

		let sql = "SELECT album.*,photo.file FROM album left join photo on album.cover_id=photo.id"
	
		sqliteDB.queryData(sql, (rows)=> {
			addHost(rows)
			resolve(JSON.stringify(rows))
		})
	})

}

async function getAlbum(id) {

	return new Promise((resolve, reject)=> {

		let sql = `SELECT * FROM photo WHERE album_id=${id}`
	
		sqliteDB.queryData(sql, (rows)=> {
			addHost(rows)
			resolve(JSON.stringify(rows))
		})
	})

}

 
router.get('/album/list', async(ctx)=> {
	ctx.type = 'application/json'
	ctx.body = await list()
})
router.get('/album/:id', async(ctx)=> {
	ctx.type = 'application/json'
	ctx.body = await getAlbum(ctx.params.id)
})
async function upload(id, file) {
	return new Promise((resolve, reject)=> {
		let sql = "INSERT INTO photo (album_id, file) VALUES(?,?)"
	
		sqliteDB.insertData(sql, [[id, file]])

		resolve('success')
	})
}
router.post('/upload', async (ctx, next)=> {
	

	var file = ctx.request.files.file
	var stream = fs.createReadStream(file.path)
	var filename = new Date() - 0 + '-' + file.name
	var write = fs.createWriteStream(path.join(pathUpload,filename))

	stream.pipe(write)

	ctx.body = await upload(ctx.request.body.albumId, filename)

	console.log("%s uploaded", filename)

	

})

async function setCover(albumId, photoId) {
	return new Promise((resolve, reject)=> {
		let sql = "UPDATE album SET cover_id=? WHERE id=?"
	
		sqliteDB.insertData(sql, [[photoId, albumId]])

		resolve('success')
	})
}
router.post('/album/setcover', async (ctx, next)=> {
	let body = ctx.request.body
	ctx.body = await setCover(body.albumId, body.photoId)
})

async function createAlbum(name) {
	return new Promise((resolve, reject)=> {
		let sql = "INSERT INTO album (name) VALUES(?)"
	
		sqliteDB.insertData(sql, [[name]])

		resolve('success')
	})
}
router.post('/album/create', async (ctx, next)=> {
	let body = ctx.request.body
	ctx.body = await createAlbum(body.name)
})

async function editAlbum(id, name) {
	return new Promise((resolve, reject)=> {
		let sql = "UPDATE album SET name=? WHERE ID=?"
	
		sqliteDB.insertData(sql, [[name, id]])

		resolve('success')
	})
}
router.post('/album/edit', async (ctx, next)=> {
	let body = ctx.request.body
	ctx.body = await editAlbum(body.id, body.name)
})

async function removePhoto(id) {
	return new Promise((resolve, reject)=> {
		let sql = "DELETE FROM photo WHERE id=?"
	
		sqliteDB.insertData(sql, [[id]])

		resolve('success')
	})
}
router.post('/photo/remove', async (ctx, next)=> {
	let body = ctx.request.body
	ctx.body = await removePhoto(body.photoId)
})


async function removeAlbum(id) {
	return new Promise((resolve, reject)=> {
		let sql = "DELETE FROM album WHERE id=?"
	
		sqliteDB.insertData(sql, [[id]])

		resolve('success')
	})
}
router.post('/album/remove', async (ctx, next)=> {
	let body = ctx.request.body
	ctx.body = await removeAlbum(body.albumId)
})

/** Blog */
async function getArtical(id) {

	return new Promise((resolve, reject)=> {

		let sql = `SELECT * FROM blog_artical`
	
		sqliteDB.queryData(sql, (rows)=> {
			resolve(JSON.stringify(rows))
		})
	})

}

 
router.get('/blog/list', async(ctx)=> {
	ctx.type = 'application/json'
	ctx.body = await getArtical()
})


async function createArtical(title, content, createTime) {
	return new Promise((resolve, reject)=> {
		let sql = "INSERT INTO blog_artical (title, content, create_time) VALUES(?, ?, ?)"
	
		sqliteDB.insertData(sql, [[title, content, createTime]])

		resolve('success')
	})
}

router.post('/blog/create', async (ctx, next)=> {
	let body = ctx.request.body
	ctx.body = await createArtical(body.title, body.content, body.createTime)
})

async function removeArtical(id) {
	return new Promise((resolve, reject)=> {
		let sql = "DELETE FROM blog_artical WHERE id=?"
	
		sqliteDB.insertData(sql, [[id]])

		resolve('success')
	})
}
router.post('/blog/remove', async (ctx, next)=> {
	let body = ctx.request.body
	ctx.body = await removeArtical(body.articalId)
})

async function updateArtical(id, title, content, modifyTime) {
	return new Promise((resolve, reject)=> {
		let sql = "UPDATE blog_artical SET title=?, content=?, modify_time=? WHERE ID=?"
	
		sqliteDB.insertData(sql, [[title, content, modifyTime, id]])

		resolve('success')
	})
}
router.post('/blog/update', async (ctx, next)=> {
	let body = ctx.request.body
	ctx.body = await updateArtical(body.id, body.title, body.content, body.modifyTime)
})


async function setConfig(newConfig) {
	return new Promise((resolve, reject)=> {

		let config = require('./config/default.json')

		Object.assign(config, newConfig)

		fs.writeFileSync('./config/default.json', JSON.stringify(config))

		resolve('success')
	})
}
router.post('/setconfig', async (ctx, next)=> {
	let body = ctx.request.body
	ctx.body = await setConfig(body)
})

router.get('/getconfig', async (ctx, next)=> {
	ctx.type = 'application/json'
	ctx.body = fs.readFileSync('./config/default.json')
})
app.use(router.routes())
app.use(serve(pathPublic))
app.listen(port)