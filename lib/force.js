//var getUser = dummy_qurey.getDummyUser();
//Ti.API.info(getUser);
var query_lib = require('query_lib');
var log = require('log_lib');

//Global Configuration
var API_VERSION = 'v37.0'; //Currently hard-coded to Summer 2012 release

// var CONSUMER_KEY = Ti.App.Properties.getString('force.consumer.key');
// var CONSUMER_SECRET = Ti.App.Properties.getString('force.consumer.secret');
var CONSUMER_KEY = Alloy.CFG.consumerKey;
var CONSUMER_SECRET = Alloy.CFG.consumerSecret;

// var REDIRECT_URI = 'https://login.salesforce.com/services/oauth2/success';
// var LOGIN_URL = 'https://login.salesforce.com/services/oauth2/authorize?display=touch&response_type=token'
	// + '&client_id=' + Ti.Network.encodeURIComponent(CONSUMER_KEY)
	// + '&redirect_uri=' + REDIRECT_URI;

var REDIRECT_URI = 'https://thaiairways--devpm2.cs6.my.salesforce.com/services/oauth2/success';
var LOGIN_URL = 'https://thaiairways--devpm2.cs6.my.salesforce.com/services/oauth2/authorize?display=touch&response_type=token'
	+ '&client_id=' + Ti.Network.encodeURIComponent(CONSUMER_KEY)
	+ '&redirect_uri=' + REDIRECT_URI;
	
var LOGIN_URL_SSO = 'https://thaiairways--uat.cs6.my.salesforce.com';
	
//var REFRESH_TOKEN_URL = 'https://test.salesforce.com/services/oauth2/token';
	
//var LOGOUT_URL = 'https://test.salesforce.com/services/oauth2/revoke';

var REFRESH_TOKEN_URL = 'https://thaiairways--devpm2.cs6.my.salesforce.com/services/oauth2/token';
	
var LOGOUT_URL = 'https://thaiairways--devpm2.cs6.my.salesforce.com/services/oauth2/revoke';
	
var INSTANCE_URL = Alloy.Globals.instanceUrl;
var ACCESS_TOKEN = Alloy.Globals.accessToken;
var REFRESH_TOKEN = Alloy.Globals.refreshToken;

//internal helpers
function info(str) {
	Ti.API.info('[Force.com] '+str);
}

function error(str) {
	Ti.API.error('[Force.com] '+str);
}

//Authorize a Salesforce.com User Account
exports.authorize = function(callbacks) {
	
	//Authorization Window UI Constructor
	function AuthorizationWindow() {
		var self = Ti.UI.createWindow({
			modal:true,
			title:'Force.com Login'
		});
		
		var webView = Ti.UI.createWebView({
			height:Ti.UI.FILL,
			widht:Ti.UI.FILL,
			url:LOGIN_URL
		});
		self.add(webView);
		
		//cancel login action
		function cancel() {
			self.close();
			callbacks.cancel && callbacks.cancel();
		}
		
		//instument cancel behavior
		var ind;
		
		if (Ti.Platform.osname !== 'android') {
			var b = Ti.UI.createButton({
				title: 'Cancel',
				style: Ti.UI.iOS.SystemButtonStyle.PLAIN
			});
			self.setRightNavButton(b);
			b.addEventListener('click', cancel);
		}
		else {
			self.addEventListener('android:back',cancel);
			self.addEventListener('open', function() {
				//Also, do a special activity indicator for android
				ind = Ti.UI.createActivityIndicator({
					location: Ti.UI.ActivityIndicator.STATUS_BAR,
					type: Ti.UI.ActivityIndicator.DETERMINANT,
			    		message:'Loading...',
				});
				ind.show();
			});
		}
		
		//consumer of this window will want to take action based on URL
		webView.addEventListener('load', function(e) {
			ind && ind.hide();
			self.fireEvent('urlChanged', e);
		});
		
		return self;
	}
	
	Ti.API.info("In AuthorizationWindow");
	Ti.API.info("ACCESS_TOKEN: " + ACCESS_TOKEN);
	if (ACCESS_TOKEN) {
		//TODO: Check if token is still valid - if not, use refresh token if valid.  If not, reauthorize.
		callbacks.success();
	}
	else {
		var authWindow = new AuthorizationWindow();
		
		authWindow.addEventListener('urlChanged', function(e) {
			Ti.API.info('URL : ' + e.url);
			
			if (e.url.indexOf('/oauth2/success') !== -1) {
				var hash = e.url.split('#')[1];
				Ti.API.info('hash : ' + hash);
				if(!hash){
					var loginView = Alloy.createController("login").getView();
					loginView.open(); 
				}
				var elements = hash.split('&');
				for (var i = 0, l = elements.length; i<l; i++) {
					var element = elements[i].split('=');
					switch (element[0]) {
						case 'access_token':
							ACCESS_TOKEN = Ti.Network.decodeURIComponent(element[1]);
							//Ti.App.Properties.setString('force.accessToken', ACCESS_TOKEN);
							Ti.API.info('Force ACCESS_TOKEN ' + ACCESS_TOKEN);
							Alloy.Globals.accessToken = ACCESS_TOKEN;
							Ti.API.info("ACCESS_TOKEN " + ACCESS_TOKEN);
							break;
						case 'refresh_token':
							REFRESH_TOKEN = Ti.Network.decodeURIComponent(element[1]);
							//Ti.App.Properties.setString('force.refreshToken', REFRESH_TOKEN);
							Ti.API.info('Force REFRESH_TOKEN ' + REFRESH_TOKEN);
							Alloy.Globals.refreshToken = REFRESH_TOKEN;
							Ti.API.info("REFRESH_TOKEN " + REFRESH_TOKEN);
							break;
						case 'instance_url':
							INSTANCE_URL = Ti.Network.decodeURIComponent(element[1]);
							//Ti.App.Properties.setString('force.instanceURL', INSTANCE_URL);
							Ti.API.info('Force Instance ' + INSTANCE_URL);
							Alloy.Globals.instanceUrl = INSTANCE_URL;
							if(Alloy.Globals.instanceUrl.slice(-1) != "/")
							{
								Alloy.Globals.instanceUrl += "/";
							}
							Ti.API.info("INSTANCE_URL " + INSTANCE_URL);
							break;
						default: break;
					}
				}
				
				callbacks.success();
				authWindow.close();
			}
		});
		
		authWindow.open();
	}
};

//Authorize a Salesforce.com User Account SSO
exports.authorizeSSO = function(callbacks) {
	
	//Authorization Window UI Constructor
	function AuthorizationWindow() {
		var self = Ti.UI.createWindow({
			modal:true,
			title:'Force.com Login'
		});
		
		var webView = Ti.UI.createWebView({
			height: Ti.UI.FILL,
			widht: Ti.UI.FILL,
			url: LOGIN_URL_SSO
		});
		self.add(webView);
		
		//cancel login action
		function cancel() {
			self.close();
			callbacks.cancel && callbacks.cancel();
		}
		
		//instument cancel behavior
		var ind;
		
		if (Ti.Platform.osname !== 'android') {
			var b = Ti.UI.createButton({
				title: 'Cancel',
				style: Ti.UI.iOS.SystemButtonStyle.PLAIN
			});
			self.setRightNavButton(b);
			b.addEventListener('click', cancel);
		}
		else {
			self.addEventListener('android:back',cancel);
			self.addEventListener('open', function() {
				//Also, do a special activity indicator for android
				ind = Ti.UI.createActivityIndicator({
					location: Ti.UI.ActivityIndicator.STATUS_BAR,
					type: Ti.UI.ActivityIndicator.DETERMINANT,
			    		message:'Loading...',
				});
				ind.show();
			});
		}
		
		//consumer of this window will want to take action based on URL
		webView.addEventListener('load', function(e) {
			ind && ind.hide();
			self.fireEvent('urlChanged', e);
		});
		
		return self;
	}
	
	Ti.API.info("In AuthorizationWindow");
	Ti.API.info("ACCESS_TOKEN: " + ACCESS_TOKEN);
	if (ACCESS_TOKEN) {
		//TODO: Check if token is still valid - if not, use refresh token if valid.  If not, reauthorize.
		callbacks.success();
	}
	else {
		var authWindow = new AuthorizationWindow();
		
		authWindow.addEventListener('urlChanged', function(e) {
			Ti.API.info('URL '+ e.url);
			
			if (e.url.indexOf('/oauth2/success') !== -1) {
				var hash = e.url.split('#')[1];
				Ti.API.info('hash '+ hash);
			
				if(!hash){
					var loginView = Alloy.createController("login").getView();
					loginView.open(); 
				}
				var elements = hash.split('&');
				for (var i = 0, l = elements.length; i<l; i++) {
					var element = elements[i].split('=');
					switch (element[0]) {
						case 'access_token':
							ACCESS_TOKEN = Ti.Network.decodeURIComponent(element[1]);
							//Ti.App.Properties.setString('force.accessToken', ACCESS_TOKEN);
							Alloy.CFG.accessToken = ACCESS_TOKEN;
							Ti.API.info("ACCESS_TOKEN " + ACCESS_TOKEN);
							break;
						case 'refresh_token':
							REFRESH_TOKEN = Ti.Network.decodeURIComponent(element[1]);
							//Ti.App.Properties.setString('force.refreshToken', REFRESH_TOKEN);
							Alloy.CFG.refreshToken = REFRESH_TOKEN;
							Ti.API.info("REFRESH_TOKEN " + REFRESH_TOKEN);
							break;
						case 'instance_url':
							INSTANCE_URL = Ti.Network.decodeURIComponent(element[1]);
							//Ti.App.Properties.setString('force.instanceURL', INSTANCE_URL);
							Alloy.CFG.instanceURL = INSTANCE_URL;
							Ti.API.info("INSTANCE_URL " + INSTANCE_URL);
							break;
						default: break;
					}
				}
				
				callbacks.success();
				authWindow.close();
			}
		});
		
		authWindow.open();
	}
};

//blank out session info
exports.logout = function(success, error) {
	
	if (Titanium.Network.networkType != Titanium.Network.NETWORK_NONE) {
		// Send POST to revoke access token
		var httpClient = Titanium.Network.createHTTPClient({
			timeout : 1000 * 30, // 30 seconds
			onerror : function(e) {
				Ti.API.error(this.responseText);
				log.logError(this.responseText, "POST Logout");
				if (error) {
					error();
				}
			},
			onload : function(e) {
				Ti.API.info(e);
				ACCESS_TOKEN = null;
				Alloy.CFG.accessToken = null;
				REFRESH_TOKEN = null;
				Alloy.CFG.refreshToken = null;
				INSTANCE_URL = null;
				Alloy.CFG.instanceURL = null;
				
				if (success) {
					success();
				}
			}
		});
	
		var params = "token=" + Alloy.CFG.accessToken;
	
		httpClient.open("POST", LOGOUT_URL);
		httpClient.setRequestHeader("content-type", "application/x-www-form-urlencoded");
		httpClient.send(params);
	}
	else {
		ACCESS_TOKEN = null;
		Alloy.CFG.accessToken = null;
		REFRESH_TOKEN = null;
		Alloy.CFG.refreshToken = null;
		INSTANCE_URL = null;
		Alloy.CFG.instanceURL = null;
		
		if (success) {
			success();
		}
	}
	
};

exports.refreshToken = function(refreshSuccess, refreshError) {
	var httpClient = Ti.Network.createHTTPClient({
		timeout : 1000 * 30, // 30 seconds
		onerror : function(e) {
			Ti.API.error(e);
			Ti.API.error(this.responseText);
			log.logError(this.responseText, "POST RefreshToken");
			
			refreshError();
		},
		onload : function(data) {
			Ti.API.info('refreshToken Success');
			var data = JSON.parse(this.responseText);
			Ti.API.info(data);
			if (data != null && data.access_token != null) {
				var accessToken = data.access_token;
				
				ACCESS_TOKEN = accessToken;
				Alloy.CFG.accessToken = accessToken;
				query_lib.updateAccessToken(accessToken);
			}
			
			refreshSuccess();
		}
	});
	
	var params = 'grant_type=refresh_token&' + 
				'client_id=' + CONSUMER_KEY + '&' +
				'client_secret=' + CONSUMER_SECRET + '&' + 
				'refresh_token=' + REFRESH_TOKEN;
	
	Ti.API.info('Access Token: ' + ACCESS_TOKEN);
	Ti.API.info("refresh token: " + params);
	httpClient.open("POST", REFRESH_TOKEN_URL);
	httpClient.setRequestHeader("content-type", "application/x-www-form-urlencoded");
	httpClient.setRequestHeader("Accept", "application/json");
	httpClient.send(params);
	
	
};

/**
 * Standard HTTP Request
 * @param {Object} opts
 * @description The following are valid options to pass through:
 * 	opts.timeout 	: int Timeout request
 * 	opts.type		: string GET/POST
 * 	opts.format     : json, etc.
 * 	opts.data		: mixed The data to pass
 * 	opts.url		: string The url source to call
 * 	opts.onerror	: funtion A function to execute when there is an XHR error
 * 	opts.callback   : function when successful
 */
 exports.request = function(opts) {
	// Setup the xhr object
	var xhr = Ti.Network.createHTTPClient();

	// Set the timeout or a default if one is not provided
	xhr.timeout = (opts.timeout) ? opts.timeout : 25000;

	/**
	 * When XHR request is loaded
	 */
	xhr.onload = function() {
		// If successful
		try {
			info(JSON.stringify(xhr));
			if (Number(xhr.status) >= 200 && Number(xhr.status) < 300) {
				opts.callback && opts.callback(JSON.parse(this.responseText));
			}
			else {
				if (opts.onerror) {
					opts.onerror();
				}
				else {
					error('Error during Force.com request');
					//TODO: srsly.  Need moar error handling.
				}
			}
		}
		// If not successful
		catch(e) {
        	xhr.onerror(e);
		};
	};

	if (opts.ondatastream) {
		xhr.ondatastream = function(e){
			opts.ondatastream && opts.ondatastream();
		};
    }

    /**
	 * Error handling
	 * @param {Object} e The callback object
	 */
	xhr.onerror = function(e) {
		if (xhr.status === 401) {
			alert('Session expired - please log in.');
			exports.logout();
			exports.authorize();
		}
		else {
			opts.onerror && opts.onerror();
			Ti.API.info(xhr.responseText);
		}
	};

	// Open the remote connection
	var fullURL = INSTANCE_URL+'/services/data/'+API_VERSION+opts.url;
	info(fullURL);
	if(opts.type) {
		xhr.open(opts.type, fullURL);	
	} 
	else {
		xhr.open('GET', fullURL);
	}

	Ti.API.info("Setting headers");
	Ti.API.info("Access Token: " + ACCESS_TOKEN);
	xhr.validatesSecureCertificate = true;
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.setRequestHeader('Authorization', 'OAuth ' + ACCESS_TOKEN );
	xhr.setRequestHeader('X-User-Agent', 'salesforce-toolkit-rest-javascript/' + API_VERSION);

    if(opts.headers) {
        for(var i = 0, j = opts.headers.length; i < j; i++) {
            xhr.setRequestHeader( opts.headers[i].name, opts.headers[i].value );
        }
    }

    if(opts.data) {
		// send the data
        xhr.send(JSON.stringify(opts.data));
	} 
	else {
		xhr.send(null);
	}
};
