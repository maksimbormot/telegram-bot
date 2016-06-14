'use strict'

var tg          = require('telegram-node-bot')('226148020:AAFDlEy9_XNTtxCdSmw0RvgOr_8VUIAusog');
var mongoose    = require('mongoose');
var User        = require('./models/user');
var Item        = require('./models/item');
var fs          = require("fs");
var request     = require('request');

mongoose.connect('mongodb://localhost/telegramUsers');

tg.router.
	when(['/start'], 'StartCtrl').
	when(['/form'], 'FormCtrl').
	when(['/menu', '/fileMenu'], 'MenuCtrl').
	when(['/files', '/help', '/addMagnet', '/openFile'], 'MenuCommandsCtrl').
	when(['/download'], 'DownloadCtrl').
    otherwise('OtherCtrl')


tg.controller('StartCtrl', ($) => {

	tg.for('/start', ($) => {
		$.sendMessage("Hello, my dear user! Here, I'll help you to use our cloud service. But first, you have to be authorized.");
		var goToForm = () => {
			$.routeTo("/form")
		}
		setTimeout(goToForm, 500)
	})

})


tg.controller('FormCtrl', ($) => {

	tg.for('/form', ($) => {
    	var form = {
		    customerId: {
		        q: 'Please, enter your ID:',
		        error: 'Wrong input! Enter a valid data',
		        validator: (input, callback) => {
		            if(input['text'] == "/menu") {
		                callback(false)
		                return
		            } else if(input['text'] == "/help") {
		                callback(false)
		                return
		            } else if(input['text'] == "/start") {
		                callback(false)
		                return
		            } else if(input['text'] == "/form") {
		                callback(false)
		                return
		            } else
		            callback(true)
		        }
		    },
		    pin: {
		        q: 'Good job! And now enter your PIN:',
		        error: 'Wrong input! Enter a valid data',
		        validator: (input, callback) => {
		            if(input['text'] == "/menu") {
		                callback(false)
		                return
		            } else if(input['text'] == "/start") {
		                callback(false)
		                return
		            } else if(input['text'] == "/form") {
		                callback(false)
		                return
		            } else
		            callback(true)
		        }
		    }         
		}

		$.runForm(form, (result) => {
		    request('https://www.premiumize.me/api/folder/list?customer_id=' + result.customerId + '&pin=' + result.pin +'', 
		    	function (error, response, body) {
				  	if (!error && response.statusCode == 200) {
				  		var msgBody = JSON.parse(body)
				  		if (msgBody.status == 'success') {

				  			var goToMenu = () => {
								$.routeTo("/menu")
							}

				  			$.sendMessage("Congratulations! You're authorized. Now you can work with cloud.")
							User.findOne({chatId: $.chatId}, function(err, user) {
							  	if (err) throw err;

							  	if(!user) {
							  		var user = new User();
								    user.customerId = result.customerId;
								    user.pin = result.pin;
								    user.chatId = $.chatId;
								    user.save((err) => {
								    	if (err) throw err
								    })
							  	}
							})
							setTimeout(goToMenu, 500)
				  		} else {
				  			$.sendMessage("Oops! Your entered data are invalid. Try again:")
				  			var goToForm = () => {
								$.routeTo("/form")
							}
							setTimeout(goToForm, 500)
				  		}
				  	} else throw err
				}
			)
		})
    })

})

tg.controller('MenuCtrl', ($) => {

	tg.for('/menu', ($) => {
    	$.runMenu({
		    message: 'Please, choose a command:',
		    layout: [2, 2],
		    'Add Magnet': () => {
		    	$.routeTo("/addMagnet")
			}, 
		    'My Files': () => {
		    	$.routeTo("/files")
		    }, 
		    'Open file_id': () => {
		    	$.routeTo("/openFile")
		    }, 
		    'Help': () => {
		    	$.routeTo("/help")
		    }
		}) 
    })

    tg.for('/fileMenu', ($) => {
    	$.runMenu({
		    message: 'If you want to download some file, use menu below:',
		    layout: [2],
		    'Back': () => {
		    	$.routeTo("/menu")
			}, 
		    'Choose item': () => {
		    	$.routeTo("/openFile")
		    }
		})
    })

})

tg.controller('MenuCommandsCtrl', ($) => {

	tg.for('/files', ($) => {
		User.findOne({chatId: $.chatId}, function(err, user) {
    		if (err) throw err;

    		if (user) {
    			request('https://www.premiumize.me/api/folder/list?customer_id=' + user.customerId + '&pin=' + user.pin +'', 
    				function (error, response, body) {
    					if (!error && response.statusCode == 200) {
					  		var msgBody = JSON.parse(body)
					  		if (msgBody.status == 'success') {
					  			var files =[]
					  			for (var i = 0; i < msgBody.content.length; i++) {
					  				var item = {
					  					name: msgBody.content[i].name,
					  					type: msgBody.content[i].type,
					  					id: msgBody.content[i].id
					  				}
						  			files.push(item)
						  		}
						  		var massive =""
						  		for (var i = 0; i < files.length; i++) {
						  			massive +='<b>' + files[i].name + '</b>\n<i>' + files[i].type +'</i>\n<b>ID: </b>' + files[i].id + '\n\n' 
						  		}
					  			$.sendMessage(massive, {chat_id:$.chatId, parse_mode:'HTML'})
					  		}
					  	}
    				})
    		}
    	})
    	var goToMenu = () => {
    		$.routeTo("/fileMenu")
    	}
    	setTimeout(goToMenu, 800)
	})

	tg.for('/help', ($) => {
		$.sendMessage('<b>List of comands:</b>\n\n/form - authentication in service\n/menu - main menu', {chat_id:$.chatId, parse_mode:'HTML'})
		$.routeTo("/menu")
	})

	tg.for('/addMagnet', ($) => {
		$.sendMessage('Paste magnet link or torrent file below:')
    	$.waitForRequest(($) => {
         	User.findOne({chatId: $.chatId}, function(err, user) {   			
    			if (err) throw err;
    			if (user) { 
         			request('https://www.premiumize.me/api/transfer/create?type=torrent&src=' + $.message.text + '&customer_id=' + user.customerId + '&pin=' + user.pin,
    			 	function (error, response, body) {
    			 		$.sendMessage('Downloading started!')
    			 	})
         		} else {
         			$.sendMessage('User not logged in!')
         		}
       		})
        }) 
        $.routeTo("/menu")     
	})

	tg.for('/openFile', ($) => {
		var menu = () => {
			$.runMenu({
			    message: 'If you want to download this file, use menu below:',
			    layout: [2],
			    'Back': () => {
			    	$.routeTo("/menu")
				}, 
			    'Download zip': () => {
			    	$.routeTo("/download")
			    }
			})
		}

		$.sendMessage('Enter file id:')
    	$.waitForRequest(($) => {
    		User.findOne({chatId: $.chatId}, function(err, user) {
				if (err) throw err;

				if (user) {
					request('https://www.premiumize.me/api/folder/list?customer_id=' + user.customerId + '&pin=' + user.pin +'', 
						function (error, response, body) {
							if (!error && response.statusCode == 200) {

						  		var msgBody = JSON.parse(body)
						  		if (msgBody.status == 'success') {
						  			for (var i = 0; i < msgBody.content.length; i++) {
							  			if (msgBody.content[i].id == $.message.text) {
							  				var item = new Item();
							  				item.customerId = user.customerId;
						  					item.name = msgBody.content[i].name;
						  					item.type = msgBody.content[i].type;
						  					item.id = msgBody.content[i].id;
						  					item.hash = msgBody.content[i].hash;
						  					item.save((err) => {
										    	if (err) throw err
										    })	
							  				$.sendMessage('<b>' + msgBody.content[i].name + '</b>\n<i>' + msgBody.content[i].type +'</i>\n<b>ID: </b>' + msgBody.content[i].id, {parse_mode:'HTML'})
							  			} else continue
							  		}
						  		}
						  	}
						})
				}
			})
			setTimeout(menu, 500)
		})
	})

})

tg.controller('DownloadCtrl', ($) => {

	tg.for('/download', ($) => {
		User.findOne({chatId: $.chatId}, function(err, user) {
			if (err) throw err;

			if (user) {

				Item.findOne({customerId: user.customerId}, function(err, item) {
					if (err) throw err;

					if (item) {
						request('https://www.premiumize.me/api/torrent/browse?hash=' + item.hash + '&customer_id=' + user.customerId + '&pin=' + user.pin, 
							function (error, response, body) {
								var parseMsg = JSON.parse(body)
								$.sendMessage(parseMsg.zip)
								item.remove((err) => {
									if (err) throw err;
								})	
							})
					}

				})
			}
		})
	})

})

tg.controller('OtherCtrl', ($) => {
	$.sendMessage("I don't understand what you mean")
})