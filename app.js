var express  = require('express'); //=== call express
var path  = require('path'); //=== call path libarary of node
var url1  = require('url');
var ejs  = require('ejs');
var session  = require('express-session'); //=== for session
var cookieParser = require('cookie-parser'); //== used for cookies
var bodyParser = require('body-parser'); //===used for get values of form elements
var contentType = require('content-type');
var getRawBody = require('raw-body');
var morgan = require('morgan'); //=== for upload purpose
var multer  = require('multer'); //=== for upload purpose
var fs = require('fs'); //=== for forms
var request = require('request');
var nodemailer = require('nodemailer'); //=== for sending emails
var generator = require('generate-password'); //== to generate random password 
var app      = express(); //=== initialize express app  
var port     = process.env.PORT || 8081; //=== set port number
var passport = require('passport'); //=== used to store session values
var flash    = require('connect-flash'); //=== used to display flash notifications
var mongoose = require('mongoose'); //=== used to connect with mongodb
var bcrypt = require('bcrypt-nodejs');
var Airtable = require('airtable');
var base = new Airtable({apiKey: 'keyZfI1DivCwGVUP9'}).base('app3nUEPcKtLpaTor'); //=== airtable api setting
var url = 'mongodb://localhost/goLocal';
var ObjectId = require('mongodb').ObjectID;
var pdf = require('html-pdf');
var userAgentInfo;
var moment = require('moment');
var cron = require('node-cron');
var currencyFormatter = require('currency-formatter');
var rimraf = require('rimraf');
var Simplify = require("simplify-commerce"),
    client = Simplify.getClient({
        publicKey: 'sbpb_OGVhYTQxMWMtMzRmMC00NmY2LWE3ZTMtNWRmODYxZWY4Y2I2',
		//publicKey: 'sbpb_ZGE0MGM3NWUtM2IyNy00Y2ZlLWJlYjItYjljMDdkYWY5ZWI2',
		//privateKey: 'OFGynBuj5bLa5YwP8M/5CHKqKWX3ZZWIHj9eZvJJ5IZ5YFFQL0ODSXAOkNtXTToq'
        privateKey: 'dE7VsMOSxhL3ZzbaJIKGbaOHZs7NmgyHUYwqTIaSzY95YFFQL0ODSXAOkNtXTToq'
    });  
	
var transporter = nodemailer.createTransport({ //=== mail setting == change also in passport file
  service: 'gmail',
  auth: {
    user: 'testmidriff@gmail.com',
    pass: 'midriffinfosolution'
  }
});	

var uploadcare = require('./lib/main.js')('adfb1551ed4998355dfa', 'f2a45df3e21903adc5ac');

/* const transporter = nodemailer.createTransport({
    host: 'mail.nextgendeveloper.com',
    port: 587,
    secure: false, // use TLS
    auth: {
        user: 'info@nextgendeveloper.com',
        pass: 'Livefor2018@#'
    },
    tls: {
        rejectUnauthorized: false
    }
});

transporter.verify(function(error, success) {
   if (error) {
        console.log(error);
   } else {
        console.log('Server is ready to take our messages');
   } 
}); */

require('./config/passport')(passport); // pass passport for configuration
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
// required for passport
app.use(session({
	secret: 'golocalscreeningportalusingmeanstack',
	resave: true,
	saveUninitialized: true
 })); // session secret
 
 var storage = multer.diskStorage({ // this is used for file uploading settings
  destination: function(req, file, callback) {
         callback(null, "./public/uploads");
     },
  filename: function (req, file, cb) {
    cb(null, file.originalname.replace(path.extname(file.originalname), "") + '-' + Date.now() + path.extname(file.originalname))
  }
});
var upload = multer({ storage: storage });

app.use(passport.initialize());  //== used for session
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

var requestData = {};
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "POST, GET");
  next();
});
app.use(bodyParser.json({ type: '/' }));
app.use(bodyParser.urlencoded({ extended: false }));
var customParser = bodyParser.json({ type: '/' });
var DefaultParser = bodyParser.json();

//=============================function to round of upto two numbers============//

function roundToTwo(num) {    
    return +(Math.round(num + "e+2")  + "e-2");
}

//=====================================================
function handler(method){
  return function(error, response) {
    if(error) {
      console.log('Error in ' + method);
      console.log('Error: ' + error);
      console.log('Response: ' + JSON.stringify(response));
    } else {
      console.log('Success: ' + method);
    }
  };
}
//===========  CARD EXPIRING MAIL CRON START ==============//
cron.schedule('* * */23 * * *', function(){ //=== FOLLOW UP EMAIL 
//cron.schedule('*/1 * * * *', function(){ //=== FOLLOW UP EMAIL 
	console.log('run after 23 hrs ');
	var d = new Date();
	//console.log( d );
	var month = moment(d).format("M");
	var year = moment(d).format("Y");
	mongoose.connect(url, function(err, db){
		db.collection('testCron').insertOne( {task : 'task at 2 AM', date : new Date().toISOString()}, function(err, responseCron){
			if(err) throw err;
			console.log('task at 2 AM');
		});
		
		//======== CARD EXPIRY REMINDER MAIL =======//
		db.collection('users').find({ card_expiry_month: { $eq: parseInt(month) }, card_expiry_year: { $eq: parseInt(year)}}).toArray(function(err, responseCard){
			if(err) throw err;
			console.log( responseCard );
			if(responseCard.length > 0){  
				for(var i = 0; i< responseCard.length; i++ ){
					var customer_name = responseCard[i].first_name +'  '+ responseCard[i].last_name;
					var customer_email = responseCard[i].email;
					var formated_message = '<div style="max-width: 600px; margin: auto;"><p>Hi '+ customer_name +',</p><p>Our systems tell us that your card will be expiring soon.<p>Don’t worry! To avoid any payment issues, please update your billing details via My Account at <a href="https://www.golocalpage.com.au/login"> https://www.golocalpage.com.au/login</a></p><p>Kind regards, </p><p>Anna</p><p>07 3062 6983 | anna@golocalpage.com.au</p><p>PO Box 2477 Graceville East Queensland 4075 |<a href="https://www.golocalpage.com.au/">www.golocalpage.com.au</a></p><p>The information contained in this email, including all attachments, is confidential and may be legally privileged. If you have received this email by mistake, please inform us and destroy all copies of the original message. Do not make any use of this email. We do not waive any privilege, confidentiality or copyright associated with it.</p></div>';
					
					var mailOptions1 = {
						from: 'testmidriff@gmail.com',
						to: customer_email,
						subject: 'GoLocal Page - Customer card expiry alert',
						html: formated_message
					};
					transporter.sendMail(mailOptions1, function(error, info){
						if (error) {
							console.log(error);
						} else {
							console.log('Email sent: ' + info.response);
						} 
					});
				}
			}
		});
		//====================================================//
		//======== MISSING DESIGN PACKAGE REMINDER ===========//
		db.collection('orders').find({designPaymentID : null, packageReminder: { $ne: 1 }}).toArray(function(err, MissingResponse){
			if(err) throw err;
			console.log( MissingResponse );
			if(MissingResponse.length > 0){
				for(var ii = 0; ii < MissingResponse.length; ii ++){
					var _id = MissingResponse[ii]._id;
					var _first_name = MissingResponse[ii].first_name;
					var _last_name = MissingResponse[ii].last_name;
					var _email = MissingResponse[ii].email;
					var customerName = _first_name +'  '+ _last_name;
					var formated_message = '<div style="max-width: 600px; margin: auto;"><p>Hi '+ customerName +',</p><p>Thank you for joining GoLocal Page and selecting a Design Package.</p> <p>Your account number is '+ MissingResponse[ii].user_id +'</p>  <p>To start designing your ad please click on the link below. You will need your account number to register.<p> <a href="http://www.golocaldesigns.com/register"> www.golocaldesigns.com/register</a></p><p>To log back in please go to: <a href="http://www.golocaldesigns.com"> www.golocaldesigns.com</a></p>  <p>Thank you, </p><p>Daniel</p><p>07 3062 6983 | harry@golocalpage.com.au</p><p>PO Box 2477 Graceville East Queensland 4075 |<a href="https://www.golocalpage.com.au/">www.golocalpage.com.au</a></p><p>The information contained in this email, including all attachments, is confidential and may be legally privileged. If you have received this email by mistake, please inform us and destroy all copies of the original message. Do not make any use of this email. We do not waive any privilege, confidentiality or copyright associated with it.</p></div>';
					
					var mailOptions1 = {
						from: 'testmidriff@gmail.com',
						to: _email,
						subject: 'GoLocal Design Registration',
						html: formated_message
					};
					transporter.sendMail(mailOptions1, function(error, info){
						if (error) {
							console.log(error);
						} else {
							console.log('Email sent: ' + info.response);
						} 
					});
					db.collection('orders').update({_id : new ObjectId(_id)}, {$set : {packageReminder : 1} }, function(err, updateMissingEmail){
						if(err) throw err;
						console.log('Missing Email sent');
					});
				}
			}
		});
		//======== MISSING DESIGN PACKAGE REMINDER ===========//
		//======== FUNCTION TO UPDATE SUBSCRIPTION YEAR COUNT START ======//
		db.collection('subscriptions').find({ status : 1, expiration_date : { $lte : new Date().toISOString()}}).toArray(function(err, subscriptionsList){
		//db.collection('subscriptions').find({email: 'archnaantwal08@gmail.com', status : 1, mailsend : { $ne : 1}}).toArray(function(err, subscriptionsList){
			if(err) throw err;
			console.log('data for year updation subscription'); 
			console.log( subscriptionsList );
			if( subscriptionsList.length > 0 ){
				for(var i=0; i< subscriptionsList.length; i++){
					//console.log( expiration_date );	
					//=======================================================//
					var orderData = subscriptionsList[i];
					var d = new Date(orderData.order_date);
					var currentSubscription = orderData._id;
					var order_date = moment(d).format("DD MMM YYYY");
					var description = orderData.description;
					
					var package_duration = orderData.package_duration;
					
					var expiration_date = orderData.expiration_date;
					expiration_date = moment(expiration_date);
					expiration_date.add({ months : package_duration });
					expiration__date = expiration_date;
					expiration_date = new Date( moment(expiration_date).format() ).toISOString();
					var expiration_date_formatted = expiration__date.format('DD MMM YYYY');
					var yearCount = orderData.yearCount;	
					var commecment_order_date = order_date;
					var adsSection = '';
					var monthlySection = '';
					var package_frequency = orderData.package_frequency;
					if(package_frequency =='month'){
						var monthlyDue = expiration__date.format('Do');
						adsSection =  orderData.description + '<br />'+  currencyFormatter.format(orderData.package_fullamount, { code: 'USD' })  + '/month <br />(total '+  currencyFormatter.format(orderData.package_fullamount * package_duration, { code: 'USD' }) +')';
						monthlySection = '<tr>   <th style="width:50%;font-weight:700;padding:2px;">Monthly Payment Amount :</th><td style="width:50%;padding:2px;">'+ currencyFormatter.format(orderData.package_fullamount, { code: 'USD' }) +'</td></tr><tr>  <th style="width:50%;font-weight:700;padding:2px;">Monthly Due Date : <span style="font-size: 9px; line-height: 11px; font-weight: normal; margin-nottom : 0px; display: block;"> Payment will automatically be deducted from the billing account you provided on this date every month <span></th>    <td style="width:50%;padding:2px;">'+ monthlyDue +' Day of the Month</td>   </tr>'
					}else{
						adsSection = orderData.description + '<br />(total amount '+  currencyFormatter.format(orderData.package_fullamount, { code: 'USD' })  + ')';
						monthlySection='';
					}
					//============table=======//
					 var formated_csa = '<link href="https://fonts.googleapis.com/css?family=Raleway:300,400,700" rel="stylesheet"><link href="https://fonts.googleapis.com/css?family=Lato:400,700,900" rel="stylesheet" /> <div id="pageHeader" style="padding:10px 40px;"><div style="padding-top:10px; max-width: 100%;"> <div style="width:60%; float:left; "> <img src="https://uploads-ssl.webflow.com/5ae87b768423ad2afbce8d09/5ae87b778423ad04fdce8e7a_Logo-Color.png" style="max-width: 130px;"> </div><div style="width:40%; float:left; text-align: left;font-size: 9px;font-weight:400; font-family: Raleway, sans-serif;color:#6B6D6D;"><div> <strong style=" font-size: 11px;color:#3752a6;font-weight:700;line-height:20px;">www.GoLocalpage.com.au</strong> </div><div>GoLocal Page Pty Ltd ABN 47 624 192 025</div><div>PO Box 2477 Graceville East QLD 4075</div><div>(07)3062 6983 | harry@golocalpage.com.au</div></div></div></div><div style="max-width: 100%;width:80%;clear:both; margin: auto; "><table style="clear: both;line-height:1.8;"><thead><th colspan="2" style="padding: 2px;"><h5 class="CSAHeadings text-center" style="margin-bottom: 0px; font-weight: bold;">Customer Sales Agreement</h5></th></thead>  <tbody style="text-align:right;font-size: 10px; font-family: Lato;text-align:left;"> <tr>  <th style="width:50%;font-weight:700;padding: 2px;">Reference Number :</th> <td style="width:50%;padding: 2px;">'+ orderData.arirtable_number +'</td>  </tr>     <tr>   <th style="width:50%;font-weight:700;padding: 2px;">Business Name :</th> <td style="width:50%;padding: 2px;">'+ orderData.business_name+'</td> </tr>	<tr>  <th style="width:50%;font-weight:700;padding: 2px;">Trading As :</th> <td style="width:50%;padding: 2px;">'+ orderData.trading_name +'</td>   </tr> <tr>   <th style="width:50%;font-weight:700;padding: 2px;">ABN :</th>  <td style="width:50%;padding: 2px;">'+ orderData.ABN +'</td> </tr>	<tr> <th style="width:50%;font-weight:700;padding: 2px;">Authorised Person :</th>  <td style="width:50%;padding: 2px;">'+ orderData.first_name +' '+ orderData.last_name +'</td>    </tr><tr> <th style="width:50%;font-weight:700;padding: 2px;">Address :</th><td style="width:50%;padding: 2px;">'+ orderData.billing_address +'</td> </tr><tr> <th style="width:50%;font-weight:700;padding: 2px;">Phone Number  :</th> <td style="width:50%;padding: 2px;">'+ orderData.phone +'</td> </tr><tr>  <th style="width:50%;font-weight:700;padding: 2px;">Mobile :</th>  <td style="width:50%;padding: 2px;">'+ orderData.mobile +'</td> </tr><tr><th style="width:50%;font-weight:700;padding: 2px;">Email :</th><td style="width:50%;padding: 2px;">'+ orderData.email +'</td></tr> <tr> <th style="width:50%;font-weight:700;padding: 2px;">Business Category :</th> <td style="width:50%;padding: 2px;">'+ orderData.business_category_name +'</td> </tr><tr> <th style="width:50%;font-weight:700;padding: 2px;">Host ID :</th> <td style="width:50%;padding: 2px;">'+ orderData.host_id +'</td> </tr><tr> <th style="width:50%;font-weight:700;padding: 2px;">Host Site Name :</th> <td style="width:50%;padding: 2px;">'+ orderData.Hostname +'</td> </tr><tr> <th style="width:50%;font-weight:700;padding: 2px;">Host Site Address :</th> <td style="width:50%;padding: 2px;">'+ orderData.HostAddress +'</td> </tr><tr><th style="width:50%;font-weight:700;padding: 2px;">Subscription Package :</th> <td style="width:50%;padding: 2px;">'+ adsSection +'</td> </tr><tr>  <th style="width:50%;font-weight:700;padding: 2px;">Expiration Date :</th> <td style="width:50%;padding: 2px;">'+ expiration_date_formatted +'</td>  </tr> '+ monthlySection +' <tr><th style="width:50%;font-weight:700;padding: 2px;">Commencement Date :</th>    <td style="width:50%;padding: 2px;">'+ commecment_order_date +'</td></tr><tr><th colspan="2" style="font-weight: 300; padding: 2px; text-align: justify; line-height: 12px; font-size: 10px;"><h5 class="CSADetailsText" style="font-weight: 700 !important; margin-bottom: 10px;font-size: 10px;">Commencement Date</h5>Your Commencement Date starts on the date your first payment was made. We have added an extra 15 days,	free of charge, to your Expiration Date. This ensures you receive the full term of your Subscription Package and allows you time to design an Ad. Either way you get an extra 2 weeks of advertising time for free. For example if you purchased the 12 Month Package and made payment on 1 January 2018, then your Commencement Date is 1 January 2018 and your 	Expiration Date is 16 January 2019 (1 January 2018 + 12 Months + 15 days Free).<br /><h5 style="font-weight: 700 !important; margin-bottom: 10px; font-size: 10px;">Automatic Renewal</h5><span style="line-height:15px;font-style:italic !important;font-size: 9px;">(see clause 5 of the Terms and Conditions)</span><br /> This Customer Sales Agreement will automatically renew and become a rolling contract after the Expiration Date, and will be for the same Subscription Package that you’re currently on. Please write to us 21 days before the Expiration Date if you do not wish to renew this Customer Sales Agreement. Don’t worry we will notify you when this time approaches to remind you of this. If you’re happy to renew, you don’t have to do anything.</th></tr></tbody></table> </div><div id="pageFooter" style="padding:0px;margin:0;"><div style="color:#525454;width:100%;clear:both;text-align: center;font-size: 11px;font-family: Raleway, sans-serif;padding:0px;margin:0;"> GoLocal Page Pty Ltd I (07) 3062 6983 I harry@golocalpage.com.au I www.golocalpage.com.au </div></div>';  
				
					var options = {
						//phantomPath: __dirname + "\node_modules\phantomjs-prebuilt\bin\phantomjs",
						format: 'A4'
					};  
					
					var csa = formated_csa;
						pdf.create(csa, options).toBuffer(function(err1, buffer1){ //== generate csa
						//res.end();
						var formated_message = '<div style="max-width: 600px; margin: auto;"><p>Hi '+ orderData.first_name +' ' + orderData.last_name +'</p><p>Thank you for purchasing our GoLocal Page Packages. We have enclosed your:</p><ul><li>Customer Sales Agreement</li><li>Tax Invoice</li><li>Terms and Conditions</li><li>Privacy Policy</li></ul><p>Please read these documents carefully and let us know of any changes or questions you might have.</p><p>Thank you,</p><p>Harry</p><p>07 3062 6983 | harry@golocalpage.com.au</p><p>PO Box 2477 Graceville East Queensland 4075 |<a href="https://www.golocalpage.com.au/">www.golocalpage.com.au</a></p><p>The information contained in this email, including all attachments, is confidential and may be legally privileged. If you have received this email by mistake, please inform us and destroy all copies of the original message. Do not make any use of this email. We do not waive any privilege, confidentiality or copyright associated with it.</p></div>';
						
						var mailOptions1 = {
							from: 'testmidriff@gmail.com',
							to: orderData.email ,
							//to: 'midriffdeveloper3@gmail.com',
							subject: 'GoLocal Page - Screen Ad Customer Sales Agreement',
							html: formated_message,
							attachments: [
								{   // file on disk as an attachment
									filename: 'PrivacyPolicy.pdf',
									path: __dirname+'/public/files/PrivacyPolicy.pdf' // stream this file
								},
								{   // file on disk as an attachment
									filename: 'TermsAndConditions.pdf',
									path: __dirname+'/public/files/TermsAndConditions.pdf' // stream this file
								},
								{   // utf-8 string as an attachment
									filename: 'CSA.pdf',
									content: buffer1,
									contentType: 'application/pdf'
								}
							]
						};
						transporter.sendMail(mailOptions1, function(error, info){
							if (error) {
								console.log(error);
							
							} else {
								console.log('Email sent: ' + info.response);
							} 
						});
					});
				//========================================================//
					db.collection('subscriptions').updateOne({ _id : new ObjectId(currentSubscription)}, {$inc : {yearCount : 1}, $set: { expiration_date : expiration_date, mailsend : 1}}, function(err, responseSub){
						if(err) throw err;
							console.log('subscription  Updated');
					});
				}
			}else{
				console.log('No data found to update for year count');
			}
		}); 
		
		//======== FUNCTION TO UPDATE SUBSCRIPTION YEAR COUNT END =======//
		db.collection('designPurchase').find({ status : 1, expirationDate : { $lte : new Date().toISOString()}}).toArray(function(err, subscriptionsList){
		//db.collection('designPurchase').find({ status : 1, email : 'archnaantwal08@gmail.com', mailsend : {$ne : 1}}).toArray(function(err, subscriptionsList){ 
			if(err) throw err;
			console.log('data for year updation design purchase'); 
			console.log( subscriptionsList );
			if( subscriptionsList.length > 0 ){
				for(var i=0; i< subscriptionsList.length; i++){
					var orderData = subscriptionsList[i];
					var d = new Date(orderData.order_date);
					//var order_date = d.toDateString("DD MMMM YYYY");
					var currentSubscription = orderData._id;
					var order_date = moment(d).format("DD MMM YYYY");
					var description = orderData.description;
					var expiration_date = orderData.expirationDate;
					var package_duration = orderData.addon_duration;
					expiration_date = moment(expiration_date);
					expiration_date.add({ months : package_duration });
					expiration__date = expiration_date;
					expiration_date = new Date( moment(expiration_date).format() ).toISOString();
					var expiration_date_formatted = expiration__date.format('DD MMM YYYY');
					
					var yearCount = orderData.yearCount;
					var addon_duration = orderData.addon_duration; 	
					var commecment_order_date = order_date;
					var designSection = '';
					var monthlySection = '';
					var package_frequency = orderData.addon_type;
					if(package_frequency =='month'){
						var monthlyDue = expiration__date.format('Do');
						designSection =  orderData.description + ''+  currencyFormatter.format(orderData.addon_fullamount, { code: 'USD' })  + '/month <br />(minimum payment period of 12 months required)';
						monthlySection = '<tr>   <th style="width:50%;font-weight:700;padding:2px;">Monthly Payment Amount :</th><td style="width:50%;padding:2px;">'+ currencyFormatter.format(orderData.addon_fullamount, { code: 'USD' }) +'</td></tr><tr>  <th style="width:50%;font-weight:700;padding:2px;">Monthly Due Date : <span style="font-size: 9px; line-height: 11px; font-weight: normal; margin-nottom : 0px; display: block;"> Payment will automatically be deducted from the billing account you provided on this date every month <span></th>    <td style="width:50%;padding:2px;">'+ monthlyDue +' Day of the Month</td>   </tr>'
					}else{
						designSection = orderData.description + '<br />('+  currencyFormatter.format(orderData.addon_fullamount, { code: 'USD' })  + ' Annual Payment)';
						monthlySection='';
					}
					
					//===================// 
					 var formated_csa = '<link href="https://fonts.googleapis.com/css?family=Raleway:300,400,700" rel="stylesheet"><link href="https://fonts.googleapis.com/css?family=Lato:400,700,900" rel="stylesheet" /> <div id="pageHeader" style="padding:10px 40px;"><div style="padding-top:10px; max-width: 100%;"> <div style="width:60%; float:left; "> <img src="https://uploads-ssl.webflow.com/5ae87b768423ad2afbce8d09/5ae87b778423ad04fdce8e7a_Logo-Color.png" style="max-width: 130px;"> </div><div style="width:40%; float:left; text-align: left;font-size: 9px;font-weight:400; font-family: Raleway, sans-serif;color:#6B6D6D;"><div> <strong style=" font-size: 11px;color:#3752a6;font-weight:700;line-height:20px;">www.GoLocalpage.com.au</strong> </div><div>GoLocal Page Pty Ltd ABN 47 624 192 025</div><div>PO Box 2477 Graceville East QLD 4075</div><div>(07)3062 6983 | harry@golocalpage.com.au</div></div></div></div><div style="max-width: 100%;width:80%;clear:both; margin: auto; "><table style="clear: both;line-height:1.8;"><thead><th colspan="2" style="padding: 2px;"><h5 class="CSAHeadings text-center" style="margin-bottom: 0px; font-weight: bold;">Customer Sales Agreement</h5></th></thead>  <tbody style="text-align:right;font-size: 10px; font-family: Lato;text-align:left;"> <tr>  <th style="width:50%;font-weight:700;padding: 2px;">Reference Number :</th> <td style="width:50%;padding: 2px;">'+ orderData.arirtable_number +'</td>  </tr>     <tr>   <th style="width:50%;font-weight:700;padding: 2px;">Business Name :</th> <td style="width:50%;padding: 2px;">'+ orderData.business_name +'</td> </tr>	<tr>  <th style="width:50%;font-weight:700;padding: 2px;">Trading As :</th> <td style="width:50%;padding: 2px;">'+  orderData.trading_name +'</td>   </tr> <tr>   <th style="width:50%;font-weight:700;padding: 2px;">ABN :</th>  <td style="width:50%;padding: 2px;">'+ orderData.ABN +'</td> </tr>	<tr> <th style="width:50%;font-weight:700;padding: 2px;">Authorised Person :</th>  <td style="width:50%;padding: 2px;">'+ orderData.first_name  +' '+ orderData.last_name +'</td>    </tr><tr> <th style="width:50%;font-weight:700;padding: 2px;">Address :</th><td style="width:50%;padding: 2px;">'+ orderData.billing_address +'</td> </tr><tr> <th style="width:50%;font-weight:700;padding: 2px;">Phone Number  :</th> <td style="width:50%;padding: 2px;">'+ orderData.phone +'</td> </tr><tr>  <th style="width:50%;font-weight:700;padding: 2px;">Mobile :</th>  <td style="width:50%;padding: 2px;">'+ orderData.mobile +'</td> </tr><tr><th style="width:50%;font-weight:700;padding: 2px;">Email :</th><td style="width:50%;padding: 2px;">'+ orderData.email +'</td></tr> <tr> <th style="width:50%;font-weight:700;padding: 2px;">Business Category :</th> <td style="width:50%;padding: 2px;">'+ orderData.business_category_name +'</td> </tr><tr><th style="width:50%;font-weight:700;padding: 2px;">Subscription Package :</th> <td style="width:50%;padding: 2px;">'+ designSection +'</td> </tr><tr>  <th style="width:50%;font-weight:700;padding: 2px;">Design Package Expires :</th> <td style="width:50%;padding: 2px;">'+ expiration_date_formatted +'</td>  </tr> '+ monthlySection +' <tr><th style="width:50%;font-weight:700;padding: 2px;">Commencement Date :</th>    <td style="width:50%;padding: 2px;">'+ commecment_order_date +'</td></tr><tr><th colspan="2" style="font-weight: 300; padding: 2px; text-align: justify; line-height: 12px; font-size: 10px;"><h5 class="CSADetailsText" style="font-weight: 700 !important; margin-bottom: 10px;font-size: 10px;">Commencement Date</h5>Your Commencement Date starts on the date your first payment was made. We have added an extra 15 days,	free of charge, to your Expiration Date. This ensures you receive the full term of your Subscription Package and allows you time to design an Ad. Either way you get an extra 2 weeks of advertising time for free. For example if you purchased the 12 Month Package and made payment on 1 January 2018, then your Commencement Date is 1 January 2018 and your 	Expiration Date is 16 January 2019 (1 January 2018 + 12 Months + 15 days Free).<br /><h5 style="font-weight: 700 !important; margin-bottom: 10px; font-size: 10px;">Automatic Renewal</h5><span style="line-height:15px;font-style:italic !important;font-size: 9px;">(see clause 5 of the Terms and Conditions)</span><br /> This Customer Sales Agreement will automatically renew and become a rolling contract after the Expiration Date, and will be for the same Subscription Package that you’re currently on. Please write to us 21 days before the Expiration Date if you do not wish to renew this Customer Sales Agreement. Don’t worry we will notify you when this time approaches to remind you of this. If you’re happy to renew, you don’t have to do anything.</th></tr></tbody></table> </div><div id="pageFooter" style="padding:0px;margin:0;"><div style="color:#525454;width:100%;clear:both;text-align: center;font-size: 11px;font-family: Raleway, sans-serif;padding:0px;margin:0;"> GoLocal Page Pty Ltd I (07) 3062 6983 I harry@golocalpage.com.au I www.golocalpage.com.au </div></div>';  
				
					var options = {
						//phantomPath: __dirname + "\node_modules\phantomjs-prebuilt\bin\phantomjs",
						format: 'A4'
					};  
					//var invoice = formated_invoice;
					var csa = formated_csa;
					//pdf.create(invoice, options).toBuffer(function(err, buffer){
						//console.log('This is a buffer:', Buffer.isBuffer(buffer));
						//console.log( buffer );
						pdf.create(csa, options).toBuffer(function(err1, buffer1){ //== generate csa
						//res.end();
						var formated_message = '<div style="max-width: 600px; margin: auto;"><p>Hi '+ orderData.first_name +' ' + orderData.last_name +'</p><p>Thank you for purchasing our GoLocal Page Packages. We have enclosed your:</p><ul><li>Customer Sales Agreement</li><li>Tax Invoice</li><li>Terms and Conditions</li><li>Privacy Policy</li></ul><p>Please read these documents carefully and let us know of any changes or questions you might have.</p><p>Thank you,</p><p>Harry</p><p>07 3062 6983 | harry@golocalpage.com.au</p><p>PO Box 2477 Graceville East Queensland 4075 |<a href="https://www.golocalpage.com.au/">www.golocalpage.com.au</a></p><p>The information contained in this email, including all attachments, is confidential and may be legally privileged. If you have received this email by mistake, please inform us and destroy all copies of the original message. Do not make any use of this email. We do not waive any privilege, confidentiality or copyright associated with it.</p></div>';
						
						var mailOptions1 = {
							from: 'testmidriff@gmail.com',
							to: orderData.email ,
							//to: 'midriffdeveloper3@gmail.com',
							subject: 'GoLocal Page - Design & Promote Customer Sales Agreement',
							html: formated_message,
							attachments: [
								{   // file on disk as an attachment
									filename: 'PrivacyPolicy.pdf',
									path: __dirname+'/public/files/PrivacyPolicy.pdf' // stream this file
								},
								{   // file on disk as an attachment
									filename: 'TermsAndConditions.pdf',
									path: __dirname+'/public/files/TermsAndConditions.pdf' // stream this file
								},
								{   // utf-8 string as an attachment
									filename: 'CSA.pdf',
									content: buffer1,
									contentType: 'application/pdf'
								}
							]
						};
						transporter.sendMail(mailOptions1, function(error, info){
							if (error) {
								console.log(error);
								res.redirect('/dashboardAdmin#/subscription');
								res.end();
							} else {
								console.log('Email sent: ' + info.response);
								res.redirect('/dashboardAdmin#/subscription');
								//res.send(formated_csa);
								res.end();
							} 
						});
					});
				//}) 
				//======================================================//
					db.collection('designPurchase').updateOne({ _id : new ObjectId(currentSubscription)}, {$inc : {yearCount : 1}, $set: { expirationDate : expiration_date , mailsend : 1}}, function(err, responseSub){
						if(err) throw err;
							console.log('subscription  Updated');
					});
				//======================================================//
				}
			}else{
				console.log('No data found to update for year count');
			}
		}); 
		//======== FUNCTION TO UPDATE SUBSCRIPTION YEAR COUNT END =======//
	})
});	
//===========  CARD EXPIRING MAIL CRON ENDS ==============//
//cron.schedule('*/5 * * * *', function(){ 
cron.schedule('*/59 * * * *', function(){ 
console.log('running a task every min');  
console.log(  new Date().toISOString() );
mongoose.connect(url, function(err, db){
	db.collection('testCron').insertOne({task_running : 'yes', cron_date : new Date().toISOString()}, function(err, response){
		if(err) throw err;
		
	});
});
function getNextInvoiceNumber(){
	return new Promise(function(resolve, reject) {
		mongoose.connect(url, function(err, db){
			db.collection('invoices').find().sort({ invoice_number: -1 }).limit(1).toArray( function(err, response){
			//console.log( response );
			if( response.length > 0 ){
				resolve( response[0].invoice_number );
			}else{
				resolve( 0 );
			}
		});
	})
	})
}
async function recurringPaymentProcess(){
	mongoose.connect(url, function(err, db){
	db.collection('invoices').find({invoice_status : 0, due_date : { $lte : new Date().toISOString()}}).toArray( async function(err, response){   
	//db.collection('invoices').find({invoice_status : 0}).toArray( async function(err, response){
		if(err) throw err;
		console.log(response);
		if( response.length > 0 ){
			for(var i = 0; i < response.length; i++){
				var invoiceData ='';
				var invoiceData = response[i];
				console.log(invoiceData);
				console.log('subsctiopn id================>', response[i].subscription_id );
				var NewinvoiceData = response[i];
				var invoiceID = response[i]._id;
				var subscription_id = response[i].subscription_id;
				
				var Invoicetype = response[i].type; 
				
				var description = response[i].description; 
				var invoive_display = response[i].invoive_display;
				var order_Amount = response[i].order_Amount;
				var package_Amount = response[i].package_Amount;
				var GST = response[i].GST;
				var packageAmountFinal = parseFloat(package_Amount) + parseFloat(GST);
				//packageAmountFinal = parseFloat( packageAmountFinal ).toFixed(2); 
				//packageAmountFinal = Math.round( packageAmountFinal * 100 )/100; 
				packageAmountFinal = roundToTwo( packageAmountFinal ); 
				//packageAmountFinal = Number(packageAmountFinal);
				var currency = response[i].currency;
				var simplify_id = response[i].simplify_id;
				var up_next_invoice_create = response[i].up_next_invoice_create;
				var email = response[i].email;
				var first_name = response[i].first_name;
				var last_name = response[i].last_name;
				var customer_name = first_name +'  '+ last_name;
				var invoice_number = await getNextInvoiceNumber();
				invoice_number = invoice_number + 1;
				var trading_name = response[i].trading_name;
				businessnamearray = trading_name.split(' ');
				var businessnamearray1 =[];
				var  invoicenameString = '';
				var discountTypeText='';
				if( businessnamearray.length > 0 ){
					for(var j =0; j< businessnamearray.length; j++ ){
						var name = 	businessnamearray[j];
						if( name !='' ){
							businessnamearray1.push(name);
							//businessnamearray1.push( name.substr(0, 3));
						}
					}
						invoicenameString = businessnamearray1.join('');
				}
				invoicenameString = invoicenameString +''+ invoice_number;
				var collectionName;
				if( Invoicetype == 'subscription'){
					collectionName = 'subscriptions';
				}else{
					collectionName = 'designPurchase';
				}
				
				//mongoose.connect(url, function(err, db){
				db.collection( collectionName ).findOne({ status : 1, subscription_id : subscription_id }, function(err , responseSub){
					if(err) throw err;
					if(responseSub){
						var AvaiableFreeMonths = responseSub.AvaiableFreeMonths;
						var free_months = responseSub.free_months;
						var currentSubscription = responseSub._id;
						var invoice_count = responseSub.invoice_count;
						var coupon_details = responseSub.coupon_details;
						var paymentAmount = 0;
						var orderDiscount = 0;
						var updateSubData;
						var discount_purchase = 0;
						var referral_purchase = 0;
						var package_duration='';
						var package_frequency='' ; 
						var package_durations='' ; 
						if(collectionName == 'subscriptions'){
							package_frequency = responseSub.package_frequency;
							package_durations = responseSub.package_duration;
						}else{
							package_frequency = responseSub.addon_type;
							package_durations = responseSub.addon_duration;
						}
						if( free_months <=6 && AvaiableFreeMonths > 0 ){ // discounted payment // referral payment
							if( coupon_details != null && coupon_details != undefined && coupon_details !='' ){
								var percentOff = coupon_details.percentOff;
								var numTimesApplied = coupon_details.numTimesApplied;
								invoiceData.invoice_counttest = invoice_count;
								invoiceData.numTimesAppliedtest = numTimesApplied;
								
								if( numTimesApplied >= invoice_count  ){
									paymentAmount = parseFloat(packageAmountFinal) - parseFloat((packageAmountFinal * percentOff / 100 ));
									//paymentAmount = paymentAmount.toFixed(2); 
									//paymentAmount = Number(paymentAmount);
									//paymentAmount = parseFloat(paymentAmount).toFixed(2);
									//paymentAmount = Math.round(paymentAmount);
									paymentAmount = roundToTwo(paymentAmount);
																
									orderDiscount = packageAmountFinal * percentOff / 100 ;
									//orderDiscount = orderDiscount.toFixed(2); 
									//orderDiscount = Number(orderDiscount);
									//orderDiscount = parseFloat(orderDiscount).toFixed(2);
									orderDiscount = roundToTwo(orderDiscount * 100 )/100;
									
									invoiceData.discount_purchase = 1;
									invoiceData.referral_purchase = 0;
									invoiceData.condition = 'discount purchase';
								}else{
									
										paymentAmount = 0;
										invoiceData.discount_purchase = 0;
										invoiceData.referral_purchase = 1;
										invoiceData.condition = 'referral purchase 1';
								}
							}else{//==without coupon 
									if(package_frequency == 'year'){	
										paymentAmount = parseFloat( packageAmountFinal ) - parseFloat( AvaiableFreeMonths *(packageAmountFinal / package_durations));
										paymentAmount = roundToTwo( paymentAmount );
									}
									else{
										paymentAmount = 0;
									}
									invoiceData.discount_purchase = 0;
									invoiceData.referral_purchase = 1;
									invoiceData.condition = 'referral purchase 2';
							}
							updateSubData = {$inc : {free_months : 1, AvaiableFreeMonths : -1 }};
							if(invoiceData.referral_purchase == 1){
								discountTypeText = '<tr><td style="color: red;">Ads Referral Discount : </td><td>100%</td></tr>';
							}else if(paymentAmount == 0 && discount_purchase == 1){
								discountTypeText = '<tr><td style="color: red;">Ads Discount : </td><td>100%</td></tr>';
							}else if(discount_purchase == 1 && paymentAmount > 0){
								discountTypeText = '<tr><td style="color: red;">Ads Discount : ('+ percentOff  +'%)</td><td>'+ orderDiscount +'</td></tr>';
							}
						}else{
							paymentAmount = packageAmountFinal * 100;
							//paymentAmount = paymentAmount.toFixed(2); 
							//paymentAmount = Number(paymentAmount);
							//paymentAmount = parseFloat(paymentAmount).toFixed(2);
							paymentAmount = roundToTwo(paymentAmount );
							
							
							invoiceData.discount_purchase = 0;
							invoiceData.referral_purchase = 0;
							invoiceData.condition = 'normal';
							invoiceData.order_Amount = packageAmountFinal * 100;
						}
						//============= CREATE PAYMENT GOES HERE ============//
						if( paymentAmount > 0  ){
							client.payment.create({
								amount : paymentAmount,
								description : description,
								customer : simplify_id,
								currency : "AUD"
							}, function(errData, data){
								if(errData){
									console.error("Error Message: " + errData.data.error.message);
									//res.end();
								}	
								else{
									console.log("Payment Status: " + data.paymentStatus);
									console.log( data );
									var paymentStatus =  data.paymentStatus;
									var paymentId =  data.id;
									var invoice_status;
									if( paymentStatus == 'APPROVED' ){
										invoice_status = 1;
										invoiceData.payment_complete_date = new Date().toISOString();
										
										var dueDate =invoiceData.due_date;
										//var date = new Date(invoiceDate*1000);
										var invoice_Date = moment(invoiceData.invoice_date).format("DD MMM YYYY");
										var due_Date = moment(dueDate).format("DD MMM YYYY");
										var customerName = invoiceData.first_name +'  '+ invoiceData.last_name;
										var customerEmail = invoiceData.email;
										var invoiceDataMonthly = '<link href="https://fonts.googleapis.com/css?family=Raleway:300,400,700" rel="stylesheet" /><link href="https://fonts.googleapis.com/css?family=Lato:400,700,900" rel="stylesheet" /> <div id="pageHeader" style="padding:10px 40px;"><div style="padding-top:10px; max-width: 100%;"> <div style="width:60%; float:left; "> <img src="https://uploads-ssl.webflow.com/5ae87b768423ad2afbce8d09/5ae87b778423ad04fdce8e7a_Logo-Color.png" style="max-width: 165px;"> </div><div style="width:40%; float:left; text-align: left;font-size: 9px;font-weight:400; font-family: Raleway, sans-serif;color:#6B6D6D;"><div> <strong style=" font-size: 11px;color:#3752a6;font-weight:700;line-height:20px;">www.GoLocalpage.com.au</strong> </div><div>GoLocal Page Pty Ltd ABN 47 624 192 025</div><div>PO Box 2477 Graceville East QLD 4075</div><div>(07)3062 6983 | harry@golocalpage.com.au</div></div></div></div> <div style="padding-bottom:60px; max-width: 100%; font-family: Lato, sans-serif;">  <div style="width:60%; float:left;font-size: 10px;padding-top:30px;line-height:16px;color: #000; "> <div style="padding-left:30px;padding-top:20px;font-weight:500; ">  <div>'+ invoiceData.first_name +' ' + invoiceData.last_name +'</div>  <div>'+ invoiceData.business_name +'</div>   <div>'+ invoiceData.streetName +' </div> <div>'+  invoiceData.city  +' '+ invoiceData.state +' '+  invoiceData.zipCode +'</div>  <div>'+  invoiceData.phone  +' | '+ invoiceData.email  +' </div>  </div> </div> <div style="width:40%; float:left;padding-top:30px;font-size: 10px;"> <h1 style="font-weight:bold;margin-block-start: 0;font-size: 13px;">Tax Invoice</h1> <table style="width: 100%;clear: both;line-height:15px;">  <tbody style="text-align:right;font-size: 10px; line-height:13px;font-weight:normal;">  <tr>  <td style="text-align:left;width:50%;">Invoice No :</td>  <td style="text-align:right;width:50%;">'+ invoiceData.invoive_display  +'</td>   </tr>  <tr>  <td style="text-align:left;width:50%;">Payment Date :</td>   <td style="text-align:right;width:50%;"> '+ invoice_Date +'</td>   </tr> <tr>  <td style="text-align:left;width:50%;">Due Date :</td>   <td style="text-align:right;width:50%;"> '+ due_Date +'</td>   </tr>   </tbody>  </table>  <div style="padding: 12px 10px;border: 2px solid #000;margin-top: 15px;margin-bottom: 15px; border-radius: 8px;"> Reference Number: <span style="float:right;"> '+ invoiceData.arirtable_number +' </span> </div>  <div style="padding: 12px 10px;border: 2px solid #000;margin-top: 15px;margin-bottom: 15px; border-radius: 8px;"> Total Amount: <span style="float:right;"> '+ currencyFormatter.format(invoiceData.order_Amount / 100, { code: 'USD' }) +' </span> </div>  <div style="padding: 12px 10px;border: 2px solid #000;margin-top: 15px;margin-bottom: 15px; border-radius: 8px;text-align:center"> Paid in Full Thank you.  </div>  </div> </div>   <div style="max-width: 100%;width:100%;clear:both; font-family: Lato, sans-serif;"> <hr style="border-top:1px solid #000;border-bottom:1px solid transparent;width:70%;float:right;margin-bottom:23px;"> <table style="text-align:right;float:right;">  <tbody style="text-align:right;font-size: 12px; line-height:1.0;font-weight:300;"><tr><td>'+ invoiceData.description +'</td><td>'+ currencyFormatter.format(invoiceData.package_Amount, { code: '' }) +'</td></tr> <tr>  <td style="vertical-align: top;">plus GST (10%)</td> <td style="vertical-align: top;width:40%;">'+  currencyFormatter.format(invoiceData.GST, { code: '' })  +' </td>  </tr>'+ discountTypeText +' <tr>  <td style="vertical-align: top; font-weight: bold;">TOTAL</td>  <td style="vertical-align: top;width:40%; font-weight: bold;">'+ currencyFormatter.format(invoiceData.order_Amount / 100, { code: 'USD' })  +' </td> </tr> </tbody>  </table> </div> <hr style="margin-top:23px;border-top:1px solid #000;border-bottom:1px solid transparent;  width:70%; float:right; margin-bottom:38px;"><div id="pageFooter" style="padding:0px;margin:0;"><div style="color:#525454;width:100%;clear:both;text-align: center;font-size: 11px;font-family: Raleway, sans-serif;padding:0px;margin:0;"> GoLocal Page Pty Ltd I (07) 3062 6983 I harry@golocalpage.com.au I www.golocalpage.com.au </div></div>';	
										
										var options = { format: 'A4' };  
										//var invoice = formated_invoice;
										pdf.create(invoiceDataMonthly, options).toBuffer(function(err, buffer){
										console.log('This is a buffer:', Buffer.isBuffer(buffer));
										console.log( buffer );
										//res.end();
											var formated_message = '<div style="max-width: 600px; margin: auto;"><p>Hi '+ customerName +'</p><p>We have attached your monthly invoice. You do not have to do anything as payment will be debited from your chosen account.<p>Have a lovely day.</p><p>Kind regards, </p><p>Anna</p><p>07 3062 6983 | anna@golocalpage.com.au</p><p>PO Box 2477 Graceville East Queensland 4075 |<a href="https://www.golocalpage.com.au/">www.golocalpage.com.au</a></p><p>The information contained in this email, including all attachments, is confidential and may be legally privileged. If you have received this email by mistake, please inform us and destroy all copies of the original message. Do not make any use of this email. We do not waive any privilege, confidentiality or copyright associated with it.</p></div>';
													
											var mailOptions1 = {
											from: 'testmidriff@gmail.com',
											to: customerEmail,
											subject: 'GoLocal Page Invoice',
											html: formated_message,
											attachments: [
												{   // utf-8 string as an attachment
													filename: 'INVOICE.pdf',
													content: buffer,
													contentType: 'application/pdf'
												}
												]
											};
											transporter.sendMail(mailOptions1, function(error, info){
												if (error) {
													console.log(error);
												} else {
													console.log('Email sent: ' + info.response);
												} 
											});
										});
									}else{
										invoice_status = 0;
										var formated_message = '<div style="max-width: 600px; margin: auto;"><p>Dear '+ customer_name +'</p> <p>Our systems tell us that your monthly payment did not process due to an issue with your card.</p><p>There are many reasons for this e.g. insufficient funds or expired card and subsequently we’ve paused the processing of payments.</p><p>To avoid any late fees, please check with your bank and update your billing details via My Account menu at <a href="https://www.golocalpage.com.au/login">https://www.golocalpage.com.au/login</a> </p><p>Let us know if you have any concerns. We are happy to help.</p><p>Kind regards,</p><p>Anna</p><p>07 3062 6983 | anna@golocalpage.com.au</p><p>PO Box 2477 Graceville East Queensland 4075 |<a href="https://www.golocalpage.com.au/">www.golocalpage.com.au</a></p><p>The information contained in this email, including all attachments, is confidential and may be legally privileged. If you have received this email by mistake, please inform us and destroy all copies of the original message. Do not make any use of this email. We do not waive any privilege, confidentiality or copyright associated with it.</p></div>';
										var mailOptions1 = {
											from: 'testmidriff@gmail.com',
											to: email ,
											subject: 'GoLocal Page - Monthly payment not processed',
											html : formated_message
										};
										transporter.sendMail(mailOptions1, function(error, info){
											if (error) {
												console.log(error);
												//res.end();
											} else {
												console.log('Email sent: ' + info.response);
												//res.end();
											} 
										});
									}
									delete invoiceData['_id'];
									invoiceData.paymentStatus  = paymentStatus;
									invoiceData.paymentId  = paymentId;
									invoiceData.invoice_status  = invoice_status;
									///========== UPDATE INVOICE DATA AFTER PAYMENT (APPROVED OR DECLINED) =====//
									db.collection('invoices').update({ _id : new ObjectId(invoiceID)}, {$set :  invoiceData }, function(err, responseUpdate){
										if(err) throw err;
										console.log( responseUpdate );
										if( up_next_invoice_create == 0 ){
											var invoice_date = new Date().toISOString();
											var due_date = NewinvoiceData.next_payment_date;
											var up_next_payment_date = due_date;
											up_next_payment_date = moment(up_next_payment_date);
											//up_next_payment_date.add({ months : 1 });
											if( Invoicetype == 'subscription'){
												var package_frequency = responseSub.package_frequency;
												package_duration = responseSub.package_duration;
												if( package_frequency =='month' ){
													up_next_payment_date.add({ months : 1 });
												}else{
													up_next_payment_date.add({ months : package_duration });
												}
											}else{
												up_next_payment_date.add({ days : 1 });
												//up_next_payment_date.add({ months : 1 });
											}
											up_next_payment_date = new Date( moment(up_next_payment_date).format() ).toISOString();
											delete NewinvoiceData['_id'];
											NewinvoiceData.invoice_date = invoice_date;
											NewinvoiceData.due_date = due_date;
											NewinvoiceData.next_payment_date = up_next_payment_date;
											NewinvoiceData.paymentStatus = 'UPCOMING';
											NewinvoiceData.invoice_status = 0;
											NewinvoiceData.paymentId = '';
											NewinvoiceData.invoice_number = invoice_number;
											NewinvoiceData.invoive_display = invoicenameString;
											
											db.collection('invoices').insertOne(NewinvoiceData, function(errr, response1){
												if(errr) throw errr;
												db.collection('invoices').update({ _id : new ObjectId(invoiceID) }, {$set : {up_next_invoice_create : 1}}, function(err, responseUp){
												if(err) throw err;
													console.log('invoice count Updated');
												});
												
												db.collection('subscriptions').update({ _id : new ObjectId(currentSubscription)}, {$inc : {invoice_count : 1}, $set: { next_payment_date : NewinvoiceData.next_payment_date }}, function(err, responseSub){
													if(err) throw err;
													console.log('subscription  Updated');
												});
											});
											
										}
									});
									///=========================================================================//
								}
							});
						}else{
							delete invoiceData['_id'];
									invoiceData.paymentStatus  = 'FREE';
									invoiceData.paymentId  = '';
									invoiceData.invoice_status  = 1;
									///========== UPDATE INVOICE DATA AFTER PAYMENT (APPROVED OR DECLINED) =====//
									db.collection('invoices').update({ _id : new ObjectId(invoiceID)}, {$set : invoiceData }, function(err, responseUpdate){
										var dueDate = invoiceData.due_date;
										//var date = new Date(invoiceDate*1000);
										var invoice_Date = moment(invoiceData.invoice_date).format("DD MMM YYYY");
										var due_Date = moment(dueDate).format("DD MMM YYYY");
										var customerName = invoiceData.first_name +'  '+invoiceData.last_name;
										var customerEmail = invoiceData.email;
										
										var invoiceDataMonthly = '<link href="https://fonts.googleapis.com/css?family=Raleway:300,400,700" rel="stylesheet"><style> @font-face {  font-family: "Arial";  src: url(http://45.76.124.120:8081/fonts/Arial.ttf); } @font-face { font-family: "Arial";  src: url(http://45.76.124.120:8081/fonts/ArialBold.ttf); font-weight: bold; }</style> <div id="pageHeader" style="padding:20px 40px;"><div style="padding-top:10px; max-width: 100%;"> <div style="width:60%; float:left; "> <img src="https://uploads-ssl.webflow.com/5ae87b768423ad2afbce8d09/5ae87b778423ad04fdce8e7a_Logo-Color.png" style="max-width: 130px;"> </div><div style="width:40%; float:left; text-align: left;font-size: 9px;font-weight:400; font-family: Raleway, sans-serif;color:#6B6D6D;"><div> <strong style=" font-size: 11px;color:#3752a6;font-weight:700;line-height:20px;">www.GoLocalpage.com.au</strong> </div><div>GoLocal Page Pty Ltd ABN 47 624 192 025</div><div>PO Box 2477 Graceville East Queensland 4075</div><div>(07)3062 6983 | harry@golocalpage.com.au</div></div></div></div><div style="padding-bottom:60px; max-width: 100%;">  <div style="width:60%; float:left;font-size: 11px;padding-top:30px;line-height:1.0;"> <div style="padding-left:30px;padding-top:20px;font-weight:300; ">  <div>'+ invoiceData.first_name +' '+ invoiceData.last_name +'<div>'+ invoiceData.business_name +'</div>   <div>'+ invoiceData.streetName +' </div> <div>'+  invoiceData.city  +' '+ invoiceData.state +' '+  invoiceData.zipCode +'</div>  <div>'+  invoiceData.phone  +' | '+  invoiceData.email  +' </div>  </div> </div> </div><div style="width:40%; float:left;padding-top:30px;font-size: 11px;"> <h1 style="font-weight:bold;margin-block-start: 0;font-size: 18px;">Tax Invoice</h1> <table style="width: 100%;clear: both;line-height:2.5;">  <tbody style="text-align:right;font-size: 11px; line-height:1.0;font-weight:normal;">  <tr>  <td style="text-align:left;width:50%;">Invoice No :</td>  <td style="text-align:right;width:50%;">'+ invoiceData.invoive_display  +'</td>   </tr>  <tr>  <td style="text-align:left;width:50%;">Payment Date :</td>   <td style="text-align:right;width:50%;"> '+ invoice_Date +'</td>   </tr> <tr>  <td style="text-align:left;width:50%;">Due Date :</td>   <td style="text-align:right;width:50%;"> '+ due_Date +'</td>   </tr>   </tbody>  </table>  <div style="padding: 12px 10px;border: 2px solid #000;margin-top: 15px;margin-bottom: 15px; border-radius: 8px;"> Reference Number: <span style="float:right;"> '+ invoiceData.arirtable_number +' </span> </div>  <div style="padding: 12px 10px;border: 2px solid #000;margin-top: 15px;margin-bottom: 15px; border-radius: 8px;"> Total Amount: <span style="float:right;"> '+ currencyFormatter.format(invoiceData.order_Amount / 100, { code: 'USD' }) +' </span> </div>  <div style="padding: 12px 10px;border: 2px solid #000;margin-top: 15px;margin-bottom: 15px; border-radius: 8px;text-align:center"> FREE </div>  </div> </div>   <div style="max-width: 100%;width:100%;clear:both;"> <hr style="border-top:1px solid #000;border-bottom:1px solid transparent;width:70%;float:right;margin-bottom:23px;"> <table style="text-align:right;width:70%;clear:both; float:right;">  <tbody style="text-align:right;font-size: 11px; line-height:1.0;font-weight:300;"><tr><td>'+  invoiceData.description+'</td><td>'+ currencyFormatter.format(invoiceData.order_Amount / 100, { code: 'USD' }) +'</td></tr><tr>  <td style="vertical-align: top;">plus GST (10%)</td> <td style="vertical-align: top;width:40%;"> '+ invoiceData.GST +'</td>  </tr>  <tr>  <td style="vertical-align: top;">Total</td>  <td style="vertical-align: top;width:40%;">'+ currencyFormatter.format(invoiceData.order_Amount / 100, { code: 'USD' })  +' </td> </tr> '+ discountTypeText +'</tbody>  </table> </div> <hr style="margin-top:23px;border-top:1px solid #000;border-bottom:1px solid transparent;width:70%;float:right; margin-bottom: 20px;"><div style="color:#525454;width:100%;clear:both;text-align: right;font-size: 11px;"><p style="margin-bottom: 38px;">Payment has been deducted from your nominated billing account.</p>	</div> 	<div id="pageFooter" style="padding:0px;margin:0;"><div style="color:#525454;width:100%;clear:both;text-align: center;font-size: 11px;font-family: Raleway, sans-serif;padding:0px;margin:0;"> GoLocal Page Pty Ltd I (07) 3062 6983 I harry@golocalpage.com.au I www.golocalpage.com.au </div></div></div>';	
				
										var options = {
											//phantomPath: __dirname + "\node_modules\phantomjs-prebuilt\bin\phantomjs",
											format: 'A4'
										};  
										//var invoice = formated_invoice;
										pdf.create(invoiceDataMonthly, options).toBuffer(function(err, buffer){
										console.log('This is a buffer:', Buffer.isBuffer(buffer));
										console.log( buffer );
										//res.end();
										var formated_message = '<div style="max-width: 600px; margin: auto;"><p>Hi '+ customerName +'</p><p>We have attached your monthly invoice. You do not have to do anything as payment will be debited from your chosen account.<p>Have a lovely day.</p><p>Kind regards, </p><p>Anna</p><p>07 3062 6983 | anna@golocalpage.com.au</p><p>PO Box 2477 Graceville East Queensland 4075 |<a href="https://www.golocalpage.com.au/">www.golocalpage.com.au</a></p><p>The information contained in this email, including all attachments, is confidential and may be legally privileged. If you have received this email by mistake, please inform us and destroy all copies of the original message. Do not make any use of this email. We do not waive any privilege, confidentiality or copyright associated with it.</p></div>';
													
										var mailOptions1 = {
											from: 'testmidriff@gmail.com',
											to: customerEmail,
											subject: 'GoLocal Page Invoice',
											html: formated_message,
											attachments: [
												{   // utf-8 string as an attachment
													filename: 'INVOICE.pdf',
													content: buffer,
													contentType: 'application/pdf'
												}
												
											]
										};
										transporter.sendMail(mailOptions1, function(error, info){
											if (error) {
													console.log(error);
											} else {
													console.log('Email sent: ' + info.response);
											} 
										});
									});
									if(err) throw err;
									console.log( responseUpdate );
									if( up_next_invoice_create == 0 ){
										var invoice_date = new Date().toISOString();
										var due_date = NewinvoiceData.next_payment_date;
										var up_next_payment_date = due_date;
										up_next_payment_date = moment(up_next_payment_date);
										//up_next_payment_date.add({ months : 1 });
										if( Invoicetype == 'subscription'){
											var package_frequency = responseSub.package_frequency;
											package_duration = responseSub.package_duration;
											if( package_frequency =='month' ){
												up_next_payment_date.add({ months : 1 });
											}else{
												up_next_payment_date.add({ months : package_duration });
											}
										}else{ 
											up_next_payment_date.add({ days : 1 });
											//up_next_payment_date.add({ months : 1 });
										}
										//up_next_payment_date.add({ days : 1 });
										up_next_payment_date = new Date( moment(up_next_payment_date).format() ).toISOString();
										delete NewinvoiceData['_id'];
										NewinvoiceData.invoice_date = invoice_date;
										NewinvoiceData.due_date = due_date;
										NewinvoiceData.next_payment_date = up_next_payment_date;
										NewinvoiceData.paymentStatus = 'UPCOMING';
										NewinvoiceData.invoice_status = 0;
										NewinvoiceData.paymentId = '';
										NewinvoiceData.invoice_number = invoice_number;
										NewinvoiceData.invoive_display = invoicenameString;
										
										db.collection('invoices').insertOne(NewinvoiceData, function(errr, response2){
											if(errr) throw errr;
											db.collection('invoices').update({ _id : new ObjectId(invoiceID) }, {$set : {up_next_invoice_create : 1}}, function(err, responseUp){
											if(err) throw err;
												console.log('Referral count Updated');
											});
											
											db.collection('subscriptions').update({ _id : new ObjectId(currentSubscription)}, {$inc : {invoice_count : 1}, $set: { next_payment_date : NewinvoiceData.next_payment_date }}, function(err, responseSub){
												if(err) throw err;
												console.log('Referral count Updated');
											});
										});
										
									}
									});
									///=========================================================================//
									if( updateSubData !='' && updateSubData != undefined && updateSubData != null ){
										db.collection('subscriptions').update({ _id : new ObjectId(currentSubscription)}, updateSubData , function(err, responseSub){
											if(err) throw err;
											console.log('referral and discount status updated');
										});
									}
						} 
						//============= CREATE PAYMENT CODE ENDS ===========//
					}
				});
				//});
			}
			
		}
	})
});

}	
recurringPaymentProcess();

}, {
   scheduled: true,
   timezone: "America/New_York"
 });	


// routes start here ===============//
app.get('/',  DefaultParser, function(req, res){ //== shoiw the default page while loading site
	sess = req.session;	
	userdata = sess.passport;	
	if( userdata ){		
	//=== check for session data
		role = userdata.role;		
		already_login = true;		
	}else{		
		role = '';		
		already_login = false;			
	}
	res.render('index', { packages : [], page_title : 'home', already_login : already_login  });
});

app.get('/get-product', DefaultParser, function(req, res){ //=== show the product purchase page
	var cart_store_id = req.cookies.cart_store_id; //=== get cart data id from cookies
	var referral_code = req.cookies.referral_code; //=== get cart data id from cookies
	console.log( cart_store_id );
	var cart_exists;
	sess = req.session; //=== get session values
	userdata = sess.passport;
	console.log( userdata );
	var already_login = false;
	if( userdata != undefined && userdata != null && userdata !='' ){
		already_login = true;
	}else{
		already_login = false;
	}
	
	if(cart_store_id !='' && cart_store_id != undefined  ){
		cart_exists = true;
	}else{
		cart_exists = false;
	}
	res.render('package-details', { cart_exists : cart_exists, already_login : already_login, page_title : 'package_purchase', referral_code : referral_code }); //== call the view and pass plan id to view
	res.end();
});
	
app.get('/get_package_details', DefaultParser, function(req, res){ //== get the packages details based on id passed in the function
	var query = url1.parse( req.url, true ).query;
	var plan_id = query.packege_id; //== get id from query string passed with http get request
	client.plan.find( plan_id , function(errData, data){
	if(errData){ //== run if there is an error in the request
        console.error("Error Message: " + errData.data.error.message);
        res.send('error');
    }
	res.send( data ); //== send the data to http response
	res.end();
});
});

app.get('/check_user_email', DefaultParser, function(req, res){ 
console.log(' function call ');
//=== function to chack if email is already registed during customer registration
var query = url1.parse( req.url, true ).query; //=== get all query request data
var email = query.email.toLowerCase();//== get email from http request and convert in lowercase
mongoose.connect(url, function(err, db){ //=== connect to database
	if( err ) throw err; //=== throw warning if there is an err in connectivity
	db.collection('users').findOne({email : email}, function( errr, response ){
		//==== find email in database
		if(errr) throw errr; //=== give err if found any err;
		console.log( response );
 		 if( response != null ){ //=== email exist in database
			console.log( 'exist' );
			res.send('exist'); //=== send response to http request
			res.end(); //=== close the request
		}else{ //=== email not exits
			console.log( 'valid' );
			res.send('valid'); //=== send response to http request
			res.end(); //=== close the request
		}  
	})
})
});
app.post('/update_cart_data', DefaultParser, function(req, res){
	//====== THIS FUNCTION IS USED TO UPDATE CART DATA IN DATABASE
	var cart_data = req.body.cart_data;
	var cart_store_id = req.cookies.cart_store_id;
	if( cart_store_id != '' && cart_store_id != undefined && cart_store_id != null ){
		mongoose.connect(url, function(err, db){
			db.collection('cart_meta').findOne({ _id :  new ObjectId(cart_store_id)}, function(err, responseCart){
				if(err) throw err;
				if(responseCart){
					db.collection('cart_meta').updateOne({ _id :  new ObjectId(cart_store_id)}, {$set :{ cart_details :  cart_data }}, function(errr, response){
					if(errr) throw errr;
						if(response){
							console.log('cart details updated');
							res.send(cart_store_id);
						}
					})
					}else{
					db.collection('cart_meta').insertOne({ cart_details :  cart_data, date : new Date().toISOString() }, function(errr, response){
					if( errr ) throw  errr;
					if( response.insertedId ){
					console.log( response.insertedId );
						//res.cookie('cart_store_id', response.insertedId );
						res.cookie('cart_store_id', response.insertedId );
						res.send(response.insertedId);
						res.end();
					}else{
						res.send('error');
						res.end();
					}
				})
					
				}
			});
			
		});
		
	}else{
	//var addon__details = req.body.addon__details;
	console.log( cart_data );
	//console.log( addon__details );
	mongoose.connect(url, function(err, db){
		db.collection('cart_meta').insertOne({ cart_details :  cart_data , date : new Date().toISOString()}, function(errr, response){
			if( errr ) throw  errr;
			if( response.insertedId ){
				console.log( response.insertedId );
				//res.cookie('cart_store_id', response.insertedId );
				res.cookie('cart_store_id', response.insertedId );
				res.send(response.insertedId);
				res.end();
			}else{
				res.send('error');
				res.end();
			}
		})
	})
	
	}
});

app.get('/get-cart-data',DefaultParser, function( req, res ){
	sess = req.session;
	userdata = sess.passport;
	//console.log( userdata.user );
	//var user_id  = userdata.user;
	var cart_store_id = req.cookies.cart_store_id;
	if( cart_store_id !='' && cart_store_id!= undefined ){
		mongoose.connect(url, function(err, db){
			db.collection('cart_meta').findOne({ _id : new ObjectId( cart_store_id ) },function(err, response){
				if( err ) throw err;
				if( response ){
					res.send( response );
					res.end();
				}else{
					console.log('No record found');
					res.end();
				}
			})
		})
	}else{
		res.send('error');
		res.end();
	}
	
});

//============ FUNCTION USED TO PROCESS LOGIN FORM ============//
app.post('/authentication', DefaultParser,  passport.authenticate('local-login', {
	//== This function is used for login process
	successRedirect : '/profile', // redirect to the secure login section
	failureRedirect : '/login', // redirect back to the signup page if there is an error
	failureFlash : true // allow flash messages
}));

app.post('/registration',DefaultParser, passport.authenticate('local-signup', {
	//=== This function is used for signup process
	successRedirect : '/login', // redirect to the secure login section
	failureRedirect : '/signup', // redirect back to the signup page if there is an error
	failureFlash : true // allow flash messages
}));

app.get('/logout',DefaultParser, function(req , res) {
	//==== This function is used to destroy session
	req.session.destroy();
	req.logout();
	res.redirect('/');
	res.end();
});

app.post('/create_account',DefaultParser, function( req, res ){
	//=== create account from purchasing page
	var email = req.body.email;
	var uname = email.toLowerCase();
	mongoose.connect(url , function(err, db){ 
	if( err ) throw err;
	db.collection('users').findOne({ email : uname }, function(err, response){
		//=== check if email already registered
		if(err) throw err; 
		if(response){
			res.send('existing_user');
			res.end();
		}else{
			
			//===================  AIRTABLOE REGISTRATION ==========================//
			base('Customer').create({
				"Email Address": uname
			}, function(err, record) {
				if (err) { console.error(err); return; }
				console.log(record.getId());
				var airtable_id = record.getId();
				var arirtable_number = record.get('Account Number');
				console.log('========== Airtable number');
				console.log( arirtable_number ); 
				
				//=== insert new user in database
			var user_status = req.body.status;
			var role = req.body.role;
			var _password = req.body.password;
			if( _password !='' && _password != undefined && _password != null){
				var	newPassword = _password;
				var formated_message = '<div style="max-width: 600px; margin: auto;"><p>Thanks for signing up to GoLocal Page .</p>We are delighted to have you onboard. You may now login with your email address to make purchases, upload ads, view and update your details. Click on the link button below to access your account. </p><p><a href="http://cp.golocalpage.com.au:8081/login" style="background-color: #6c757d; color: #fff; padding: 8px 15px; border-radius: 4px; text-decoration: none;">Click here to login</a></p><p> Thank you.</p><p>Harry</p><p>07 3062 6983 | harry@golocalpage.com.au</p><p>PO Box 2477 Graceville East Queensland 4075 |www.golocalpage.com.au </p><p> The information contained in this email, including all attachments, is confidential and may be legally privileged. If you have received this email by mistake, please inform us and destroy all copies of the original message. Do not make any use of this email. We do not waive any privilege, confidentiality or copyright associated with it.</p></div>' ;
				
			}else{  
				var	newPassword = generator.generate({
					length: 10,
					numbers: true  
				});
				var formated_message = '<div style="max-width: 600px; margin: auto;"><p>Thanks for signing up to GoLocal Page .</p>We are delighted to have you onboard. You may now login with your email address to make purchases, upload ads, view and update your details. Click on the link button below to access your account. <a href="http://cp.golocalpage.com.au:8081/login" style="background-color: #6c757d; color: #fff; padding: 8px 15px; border-radius: 4px; text-decoration: none;">Click here to login</a></p><p>Your Credentials for login in goLocal Account is </p><p>username : '+  uname + '</p><p>Password : '+ newPassword +' Thank you.</p><p>Harry</p><p>07 3062 6983 | harry@golocalpage.com.au</p><p>PO Box 2477 Graceville East Queensland 4075 |www.golocalpage.com.au </p><p> The information contained in this email, including all attachments, is confidential and may be legally privileged. If you have received this email by mistake, please inform us and destroy all copies of the original message. Do not make any use of this email. We do not waive any privilege, confidentiality or copyright associated with it.</p></div>';
				
			}
			console.log( _password );
			var Encryptpassword = bcrypt.hashSync(newPassword, null, null);
			var cart_store_id = req.cookies.cart_store_id; //=== get cart data id from cookies
			
			var newUserMysql = {
				username: uname,
				email: uname,
				password: Encryptpassword,
				role : role,
				status : user_status,
				registration_date : new Date().toISOString(),
				first_login : 0,
				airtable_id  : airtable_id,
				arirtable_number : arirtable_number,
				cart_id : cart_store_id
			}; 
			db.collection('users').insertOne(newUserMysql, function(errs, rows){
				if( errs ) throw errs;  
					if( rows ){
						var u__id = rows.insertedId;
						var cart_id = req.cookies.cart_store_id;
						//=========== update user details in cart start  ==========//
						db.collection('cart_meta').update({_id : new ObjectId(cart_id)}, { $set : {user_id : u__id }}, function(err, responseCart){
							if(err) throw err;
							if(responseCart){
								console.log('user deatils updated in cart');
							}
						});
						//=========== update user details in cart ends==========//
						
						//===================//
						var mailOptions = {
							from: 'midriffdeveloper3@gmail.com',
							to: uname,
							subject: 'Welcome to GoLocal Page.',
							html: formated_message
						};

						transporter.sendMail(mailOptions, function(error, info){
							if (error) {
								console.log(error);
							} else {
								console.log('Email sent: ' + info.response);
							}
						});
						newUserMysql.id = rows.insertedId;
						req.session.passport = {
							'email' : uname,
							'first_name' : rows.first_name,
							'last_name' : rows.last_name,
							'role' : rows.role,
							'user' : u__id
						}
						req.flash('msg', 'Your Account is Created Successfully. Check Your Email to Activate Your Account.');
						res.send('account_created');
						res.end();
					}else{
						res.send('error');
						res.end();
					}
				})
				
			});
			
			//=============================================//
			
			}
		}) 
	})	
});

app.post('/proceed_login', DefaultParser ,function( req, res  ){
	
	var cart_store_id = req.cookies.cart_store_id; //=== get cart data id from cookies
	var email = req.body.email;
	var password = req.body.password;
	mongoose.connect( url, function( err, db ){
		var uname = email.toLowerCase();
		console.log( 'Login function');
		db.collection('users').findOne({ username : uname, status :1 }, function(err, response){
			//==== check for email
			if(err) throw err;
				//console.log( response );
			if(!response){
				req.flash('msg', 'No User Found.');
				res.send('incorrect_email');
				res.end();
			}else{
				//console.log('user enterered password: '+ password );
				if (!bcrypt.compareSync( password, response.password )){
					//=== check for password
					req.flash('msg', 'Oops! Wrong password.');
					res.send('password_incorrect');
					res.end();
				}else{
					console.log( response );
					user_id = response._id;
					db.collection('users').update({ _id : new ObjectId(user_id) }, {$set : { cart_id :cart_store_id  }}, function(er, re){
						console.log('cart id updated'); 
					}); 
						var cart_id = req.cookies.cart_store_id;
						//=========== update user details in cart start  ==========//
						db.collection('cart_meta').update({_id : new ObjectId(cart_id)}, { $set : {user_id : user_id }}, function(err, responseCart){
							if(err) throw err;
							if(responseCart){
								console.log('user deatils updated in cart');
							}
						});
					
					
					
					req.session.passport = {
						'email' : response.username,
						'first_name' : response.first_name,
						'last_name' : response.last_name,
						'role' : response.role,
						'user' : user_id
					}
					req.flash('msg', 'Login Successfully.');
					res.send('login_success');
					res.end();
				}
			}
		})
	})
});

app.get('/activate-account', DefaultParser, function( req, res ){
	//==== for activation of user account
	var query = url1.parse( req.url, true ).query; //=== get all query request data
	var user_id = query.u;//== get user id from url
	//res.send( user_id );
	mongoose.connect(url, function(err, db){
		if( err ) throw err;
		db.collection('users').findOne({ _id : new ObjectId( user_id )}, function(errr, response){
			if( errr ) throw errr;
			if( response ){
				console.log( response );
				var status = response.status;
				//res.send(  );
				if( status == 0 ){
					//res.send('Not active account' + status);
					//res.end();
					db.collection('users').update({ _id : new ObjectId( user_id ) }, {  $set : { status : 1 }}, function(er, row){
						if( er ) throw er;
						if( row ){
							req.flash('msg', 'Your Email is Confirmed. Please Fill Your Login Details to Login in Your Account.')
							res.redirect('/login');
							res.end();
						}
					})
					
				}else{
					res.redirect('/login');
					res.end();
				}
			}else{
				res.send('<h4>Invalid activation url.</h4>');
				res.end();
			}
		})
	})
});
app.get('/get-categoried-airtable', DefaultParser, function(req, res){ 
//=== get categories from airtable
function getAllCategories(){
	var records_array = [];
	return new Promise(function(resolve, reject) {
		base('Business Category').select({
		view: "View - Customer Business Categories"
	}).eachPage(function page(records, fetchNextPage) {
		console.log( records.length );
		records.forEach(function(record) {
			//==== create array of values and send back to http request
			records_array.push({
				'BusinessRef' : record.get('Business Ref'),
				'BusinessType' : record.get('BusinessType')
			}); 
		});
		fetchNextPage();
		if( records_array.length > 100 ){
			resolve(records_array);
		}
	}, function done(err) {
		if (err) { console.error(err); return; }
	});
		 
	
	})
}
async function listAllCategories(){
	var records_array =  await getAllCategories();
	//console.log( records_array );
	res.send( records_array );
	res.end();
}
listAllCategories();

});

app.post('/save_user_basic_data',DefaultParser, function(req, res){ 
//=== function is used to save user data from Your Business Details section
	var _is_address = req.body._is_address;
	var _is_postal_address = req.body._is_postal_address;
	var _is_same_postal = req.body._is_same_postal;
	var postal_address = req.body.postal_address;
	var postal_streetNumber = req.body.postal_streetNumber;
	var postal_streetName = req.body.postal_streetName;
	var postal_city = req.body.postal_city;
	var postal_zipCode = req.body.postal_zipCode;
	var postal_country = req.body.postal_country;
	var postal_state = req.body.postal_state;
	
	var business_name = req.body.business_name;
	var trading_name = req.body.trading_name;
	var ABN = req.body.ABN;
	var business_category_text = req.body.business_category_text;
	var business_category_name = req.body.business_category_name;
	var business_category = req.body.business_category;
	var first_name = req.body.first_name;
	var last_name = req.body.last_name;
	var phone = req.body.phone;
	var mobile = req.body.mobile;
	var billing_address = req.body.billing_address;
	var streetNumber = req.body.streetNumber;
	var streetName = req.body.streetName;
	var city = req.body.city;
	var zipCode = req.body.zipCode;
	var country = req.body.country;
	var state = req.body.state;
	var code = req.body.code;
	var airtable_id = req.body.airtable_id;
	var email = req.body.email;
	if(airtable_id !='' && airtable_id != undefined){
		if( _is_address == true ){
			var data_update = {
			"Business Category": business_category,
			"Business Name": business_name,
			"Trading As": trading_name,
			"ABN": ABN,
			"First Name": first_name,
			"Last Name": last_name,
			"Phone Number": phone,
			"Mobile Number": mobile,
			"Email Address" : email,
			"Street Address": streetName,
			"Suburb": city,
			"Postal Street Address": "as above",
			"Postal Suburb": city,
			"Post Code" : parseInt(zipCode)
		}
		}else{
			var data_update = {
			"Business Category": business_category,
			"Business Name": business_name,
			"Trading As": trading_name,
			"ABN": ABN,
			"First Name": first_name,
			"Last Name": last_name,
			"Phone Number": phone,
			"Mobile Number": mobile,
			"Email Address" : email,
		}
			
		}
		base('Customer').update( airtable_id, data_update, function(err, record) {
			if (err) { console.error(err); return; }
			console.log(record.get('Suburb'));
		});
	}
	var user_id1 = req.body.user_id;
	if(user_id1 != undefined && user_id1 != null && user_id1 !=''){
		var user_id  = user_id1;
	}else{
		sess = req.session;
		userdata = sess.passport;
		console.log( userdata.user );
		var user_id  = userdata.user;
	}
			var user_updated_data = { //=== create json object of values
			'business_name': business_name,
			'trading_name': trading_name,
			'ABN': ABN,
			'business_category': business_category,
			'business_category_text': business_category_text,
			'business_category_name': business_category_name,
			'first_name': first_name,
			'last_name': last_name,
			'phone': phone,
			'mobile': mobile,
			'referral_code' : code
			}
		if(_is_postal_address == true){
			user_updated_data.postal_address = postal_address;
			user_updated_data.postal_streetNumber = postal_streetNumber;
			user_updated_data.postal_streetName = postal_streetName;
			user_updated_data.postal_city = postal_city;
			user_updated_data.postal_zipCode = postal_zipCode;
			user_updated_data.postal_country = postal_country;
			user_updated_data.postal_state = postal_state;
		}
		if( _is_address == true ){
			user_updated_data.billing_address = billing_address;
			user_updated_data.streetNumber = streetNumber;
			user_updated_data.streetName = streetName;
			user_updated_data.city = city;
			user_updated_data.zipCode = zipCode;
			user_updated_data.country = country;
			user_updated_data.state = state;
		}
		
		console.log( user_updated_data );
	//=========================================//
	mongoose.connect( url, function( err, db ){ //===used to update values in database
		db.collection('users').update({_id :  new ObjectId( user_id )}, { $set : user_updated_data } ,function(errs, response){	
			if(err) throw err;
			if(response){
				console.log('user updated=====');
				res.send('updated');
				res.end();
			}else{
				res.send('error');
				res.end();
			}
		})
	})
});

//==========================//
app.post('/save_payment_details',DefaultParser, function( req, res ){
	/* sess = req.session;
	userdata = sess.passport;
	console.log( userdata );
	var user_id  = userdata.user;
	var email  = userdata.email; */
	var user_id1 = req.body.user_id;
	if(user_id1 != undefined && user_id1 != null && user_id1 !=''){
		var user_id  = user_id1;
	}else{
		sess = req.session;
		userdata = sess.passport;
		console.log( userdata.user );
		var user_id  = userdata.user;
	}
	var email  = req.body.email;
	
	var payment_method = req.body.payment_method;
	var card_holder_name = req.body.card_holder_name;
	var card_number = req.body.card_number;
	var card_expiry_month = req.body.card_expiry_month;
	var card_expiry_year = req.body.card_expiry_year;
	var card_cvc = req.body.card_cvc;
	var year_last = card_expiry_year.toString().substr(2,2);
	var year_last_four = card_expiry_year.toString().substr(0,4);
	console.log(email);
	console.log(payment_method);
	console.log(card_holder_name);
	console.log(card_number);
	console.log(card_expiry_month);
	console.log(card_expiry_year);
	console.log(card_cvc);
	console.log(year_last); 
	
	client.customer.create({
		'email' : email,
		'name' : card_holder_name,
		'card' : {
			'name' : card_holder_name,
			'expMonth' : card_expiry_month,
			'expYear' : year_last,
			'cvc' : card_cvc,
			'number' : card_number,
		}	
	}, function(errData, data){ 
		if(errData){
			console.error("Error Message: " + errData.data.error.message);
			res.send('error');
			res.end();
		}else{
			//console.log("Success Response: " + JSON.stringify(data));
			/* console.log( data.card );
			console.log( data.card.customer.id ); */
			var user_simplify_id = data.card.customer.id;
			var last4 = data.card.last4;
			var type = data.card.type;
			var name_on_card = data.card.name;
			var card_id = data.card.id;
			//=========================================//
			var user_updated_data =  {
				'simplify_id' : user_simplify_id,
				'card_last_4_digits' : last4,
				'type' : type,
				'name_on_card' : name_on_card,
				'card_id' : card_id,
				'card_expiry_month' : parseInt(card_expiry_month),
				'card_expiry_year' : parseInt(year_last_four)
				
			}
			mongoose.connect( url, function( err, db ){ //===used to update values in database
				db.collection('users').update({ _id :  new ObjectId( user_id )}, { $set : user_updated_data } ,function(errs, response){	
				if(err) throw err;
				if(response){
					console.log('user updated=====');
					res.send('updated');
					res.end();
				}else{
					res.send('error');
					res.end();
				}
				})
			})
		}
	});
});
//==========================//
app.post('/update_payment_details',DefaultParser, function( req, res ){
	/* sess = req.session;
	userdata = sess.passport;
	console.log( userdata );
	var user_id  = userdata.user;
	var email  = userdata.email; */
	
	var user_id1 = req.body.user_id;
	if(user_id1 != undefined && user_id1 != null && user_id1 !=''){
		var user_id  = user_id1;
	}else{
		sess = req.session;
		userdata = sess.passport;
		console.log( userdata.user );
		var user_id  = userdata.user;
	}
	var email  = req.body.email;
	var simplify_id = req.body.simplify_id;
	var payment_method = req.body.payment_method;
	var card_holder_name = req.body.card_holder_name;
	var card_number = req.body.card_number;
	var card_expiry_month = req.body.card_expiry_month;
	var card_expiry_year = req.body.card_expiry_year;
	var card_cvc = req.body.card_cvc;
	var year_last = card_expiry_year.toString().substr(2,2);
	var year_last_four = card_expiry_year.toString().substr(0,4);
	client.customer.update({
		'id' : simplify_id,
		'email' : email,
		'name' : card_holder_name,
		'card' : {
			'name' : card_holder_name,
			'expMonth' : card_expiry_month,
			'expYear' : year_last,
			'cvc' : card_cvc,
			'number' : card_number,
		}	
	}, function(errData, data){ 
		if(errData){
			console.error("Error Message: " + errData.data.error.message);
			res.send('error');
			res.end();
		}else{
			//console.log("Success Response: " + JSON.stringify(data));
			/* console.log( data.card );
			console.log( data.card.customer.id ); */
			var user_simplify_id = data.card.customer.id;
			var last4 = data.card.last4;
			var type = data.card.type;
			var name_on_card = data.card.name;
			var card_id = data.card.id;
			//=========================================//
			var user_updated_data = {
				'simplify_id' : user_simplify_id,
				'card_last_4_digits' : last4,
				'type' : type,
				'name_on_card' : name_on_card,
				'card_id' : card_id,
				'card_expiry_month' : parseInt(card_expiry_month),
				'card_expiry_year' : parseInt(year_last_four)
			};
			mongoose.connect( url, function( err, db ){ //===used to update values in database
				db.collection('users').update({ _id :  new ObjectId( user_id )}, { $set : user_updated_data } ,function(errs, response){	
				if(err) throw err; 
				if(response){
					console.log('user updated=====');
					res.send('updated');
					res.end();
				}else{
					res.send('error');
					res.end();
				}
				})
			})
		}
	});
});


//==========================//
app.get('/get-customer-data',DefaultParser, function(req, res){
	/* sess = req.session;
	userdata = sess.passport;
	console.log( userdata.user );
	var user_id  = userdata.user; */	
	
	var query = url1.parse( req.url, true ).query;
	var user_id1 = query.user_id;
	if(user_id1 != undefined && user_id1 != null && user_id1 !=''){
		var user_id  = user_id1;
	}else{
		sess = req.session;
		userdata = sess.passport;
		console.log( userdata.user );
		var user_id  = userdata.user;
	}
	
	
	
	mongoose.connect(url, function(err, db){
		db.collection('users').findOne({_id : new ObjectId( user_id )}, function(errr, response){
			if(errr) throw errr;
			if(response){
				var simplify_id = response.simplify_id;
				if( simplify_id !=''  &&  simplify_id != undefined && simplify_id != null ){
				client.customer.find( simplify_id , function(errData, data){
					if(errData){
						console.error("Error Message: " + errData.data.error.message);
						// handle the error
						res.send('error');
						res.end();
					}else{
						//console.log( data );
						res.send( data );
						//console.log("Success Response: " + JSON.stringify(data));
						res.end();
					}
					
				});
				}else{
						res.send('error');
						res.end();
				}
			}
		});
	});
});


app.get('/get-user-data', function(req, res){
	//=== fetch user data 
	var query = url1.parse( req.url, true ).query;
	var user_id1 = query.user_id;
	if( user_id1 !='' && user_id1 != undefined && user_id1 != null ){
		var user_id  = user_id1;
	}else{
		sess = req.session;
		userdata = sess.passport;
		console.log( userdata.user );
		var user_id  = userdata.user;
	}
	
	
	
	mongoose.connect(url, function( err, db ){
		if( err ) throw err;
 		db.collection('users').findOne({_id : new ObjectId( user_id ) }, function(errr, response){
			if( errr ) throw errr;
			if( response ){
				res.send( response );
				res.end();
			}
		})
	})
});

app.get('/pending-account', DefaultParser, function(req, res){
	res.end();
});
app.get('/profile',DefaultParser,  function( req, res ){
	sess = req.session;
	userdata = sess.passport;
	console.log( userdata );
	//res.send( 'Welcome user' );
	//global.location_list;
	if( userdata ){
		mongoose.connect( url, function( err, db ){
		db.collection('users').findOne({ _id : new ObjectId( userdata.user )}, function(err, rows){
			//console.log('userdata profile page:');
			if(err) throw err;
			if( rows ){
				console.log( rows.role );
				var role = rows.role;
				var email = rows.username;
				var first_name = rows.first_name;
				var last_name = rows.last_name;
				req.session.passport.role = role;
				req.session.passport.email = email;
				req.session.passport.first_name = first_name;
				req.session.passport.last_name = last_name;
				if( role == 'admin' ){
					//res.render('adminDashboard', { pagadata : rows });
				res.redirect( '/dashboardAdmin' );
					res.end();
				}else if( role == 'user' ){
					console.log( rows );
					res.render('user-dashboard', {user__data : rows , page_title : 'dashboard'});
					res.end();
				}else{
					res.send('invalid');
					res.end();
				}
			}else{
				res.redirect( '/login' );
				console.log('No data found');
				res.end();
			}
		})
		})
	}else{
		res.redirect('/');
		res.end();
	}
});
app.get('/login',DefaultParser, function( req, res ){
	message =  req.flash('msg');
	sess = req.session;
	userdata = sess.passport;
	if( userdata ){
		res.redirect('/profile');
		res.end();	
	}else{
		res.render('login', { message : message , page_title : 'login', already_login : false });
		res.end();
	}
});
app.get('/signup', DefaultParser, function( req, res ){
	res.end();
});
app.get('/dashboardAdmin', DefaultParser, function(req, res){ 
console.log('admin dashboard');
	sess = req.session;
	userdata = sess.passport;  
	console.log( userdata );
	//res.send( 'Welcome user' );
	//global.location_list;
	if( userdata ){
		if(userdata.role =='admin'){
			res.render("staff_dashboard", { page_title : 'dashboard' });
		}else{
			res.redirect('/');
			res.end();
		}	
	}else{
		res.redirect('/');
		res.end();
	}	
});
 
app.get('/customers', DefaultParser, function(req, res){
	sess = req.session;
	userdata = sess.passport;
	console.log( userdata ); 
	//res.send( 'Welcome user' );
	//global.location_list;
	if( userdata ){
		if(userdata.role =='admin'){
		mongoose.connect(url, function( err, db ){
			db.collection('users').find({role : 'user'}).toArray( function(err, response){
				if(err) { throw err; console.log(err) }
				if(response) {
						//console.log(response);
						res.send( response ); 
						//res.render("customer_list", { customerdata : response , page_title : 'customers' } );
						res.end();
					};
				})
			})
		}else{
			res.redirect('/');
			res.end();
		}	
	}else{
		res.redirect('/');
		res.end();
	}
});

app.get('/subscriptions', function(req, res){
	var query = url1.parse( req.url, true ).query;
	var subscription_id = query._id;
	var user_id = query.user_id;
	var getQuery;
	console.log('subscription id'+ subscription_id);
	
	if( user_id !='' && user_id != undefined && user_id != null ){
		getQuery = {user_id : user_id};
		console.log('inside condition 1');
	}else if( subscription_id !='' && subscription_id != undefined && subscription_id != null ){
		getQuery = { _id : new ObjectId( subscription_id )}; 
		console.log('inside condition 2');
	}else{
		getQuery = '';
		console.log('inside condition 3');
	}	
	
	sess = req.session;
	userdata = sess.passport;
	if( userdata ){
		if(userdata.role =='admin'){ 
			function all_subscripitons(){
				return new Promise(function(resolve, reject) { 	
					/* client.subscription.list({max: 30}, function(errData, data){ //getting all the subscriptions from simplify api
					if(errData){
						console.error("Error Message: " + errData.data.error.message); //to show error on console
						return;
					}			
					resolve(data.list);
					}) */
					mongoose.connect(url, function(err, db){
						db.collection('subscriptions').find( getQuery ).sort( {_id : -1}).toArray(function(err, subscriptionData){
							if( err ) throw err;
							console.log( subscriptionData );
							resolve(subscriptionData);
						})
					});
				})
			}	
				//connection to airtable for fetching  categories
			function host_categories(){
				var host_ids = [];
				return new Promise(function(resolve, reject) { 				
					base('Business Category').select({
						view: "View - Customer Business Categories"
					}).eachPage(function page(records, fetchNextPage) {	
						
						records.forEach(function(record) {
							//==== create array of values and send back to http request
							host_ids.push({
								'BusinessRef' : record.get('Business Ref'),
								'BusinessType' : record.get('BusinessType')
							}); 
						});
						
						fetchNextPage();
						if( host_ids.length > 100 ){ 
							resolve(host_ids);
						}
						//resolve(host_ids);
						});						
					}, function done(err) {
						if (err) { console.error(err); return; }
							
					});				
			
			}
			function screen_ids(){
				return new Promise(function(resolve, reject){ 					
						base('Screen').select({
						// Selecting the first 3 records in Form - Register TV:
						view: "Form - Register TV"
					}).eachPage(function page(records, fetchNextPage) {
						// This function (`page`) will get called for each page of records.
						var screens = [];
						records.forEach(function(record) {
							var hostIDS = record.get('Host ID');
								screens.push({
										'screenRecordID' : record.getId(),
										'ScreenId': record.get('Screen ID'),
										'FreeAdSpaces': record.get('Free Ad Spaces'),
										'CurrentAds': record.get('Current Ads'),
										'host_screen':record.get('Host Screens'),
										'host_id':record.get('Host ID')});
							});
						resolve(screens);								
					})
				})
			}
			async function subscription_category(){
					var subscriptionData =  await all_subscripitons();
					var Category_data =  await host_categories(); 
					var screenIds = await screen_ids();console.log('screenIds',screenIds);
					res.send({ subscriptionlist : subscriptionData , hostCategories : Category_data ,screens_id: screenIds});
					res.end();
			}
			subscription_category();								 
		 }else{
			res.redirect('/');    //redirect to homepage if not admin login
			res.end();
		}	
		}else{
		res.redirect('/');
		res.end();
	}
	
});

app.post("/suspend_customer",DefaultParser, function(req,res)
{
	var email = req.body.email;
	mongoose.connect(url, function( err, db ){
		db.collection('users').findOne({ email : email },function(err, response){
				if(err) { throw err; console.log(err) }
				if(response) {
						var id = response._id;
						if(response.status == 1)
						{ 
					
							db.collection('users').updateOne({ _id : new ObjectId( id )},{$set : { status : 0 }},function(err, rows){
									if(err) throw err;
									if(rows){
										console.log("USER ACTIVATED ");
										res.end();
									}									
							});	 	  				
						}
						if(response.status == 0)
						{
							db.collection('users').updateOne({ _id : new ObjectId( id )},{$set : { status : 1 }},function(err, rows){
									if(err) throw err;
									if(response){
										console.log("USER SUSPENDED");
										res.end();
									}									
							}); 			
						}
						
						res.end();
				}
				else
				{
						console.log("error in status update");
						res.end();
				}
			})
	}) 
});

//===============================================================//
app.post("/suspend_subscription",DefaultParser, function(req,res)
{
	var id = req.body.id;
	var status = req.body.status;
	var collectionName = req.body.collectionName;
	if( id != undefined && id !='' && id != null ){
		mongoose.connect(url, function( err, db ){
			db.collection(collectionName).updateOne({ _id : new ObjectId( id )},{$set : { status : parseInt( status ) }},function(err, rows){
				if(err) throw err;
					if(rows){
						console.log("USER ACTIVATED ");
						res.end();
					}									
			});	 
		});
	}else{
		console.log("No id suplied ");
		res.end();
	}
	
});	
//================================================================//
//======function to update subsciptions from staff dashboard ====//
app.post('/update_subscription',DefaultParser, function(req,res)
{
	//subscription's details
		var objectId = req.body.objectId;
		var planName = req.body.planName;
		var planAmount = req.body.planAmount;
		var planFrequency = req.body.planFrequency;
		var billingCycleLimit = req.body.billingCycleLimit;
		var billingCycle = req.body.billingCycle;
		var renewalDays = req.body.renewalDays;
		var currency = req.body.currency;
		var frequencyPeriod = req.body.frequencyPeriod;
		client.subscription.update({    //update subsciption on simplify 
				id: objectId, 
				amount : planAmount,
				name : planName,
				frequency : planFrequency,
				frequencyPeriod : frequencyPeriod 
			}, function(errData, data){
			 
				if(errData){
					console.error("Error Message: " + errData.data.error.message );
					// handle the error
					return;
				}
			 
				console.log("Success Response: " + JSON.stringify(data));
			});
		res.redirect('/subscriptions'); //redirect to subsciptions page
	
});

//========= FUNCTION TO SAVE HOST DATA IN DATABASE ================//
app.post('/update_host_details', DefaultParser,  function(req, res){
	var customer_id = req.body.customer_id;
	var selected_subscriptionID = req.body.selected_subscriptionID;
	var host_location = req.body.host_location;
	var _selected_screenID = req.body._selected_screenID;
	var duration = req.body.duration;
	var selected_package_Amount = req.body.selected_package_Amount;
	var selected_subscriptionRecordID = req.body.selected_subscriptionRecordID;
	console.log('payment id'+ selected_subscriptionID);	
	var category = req.body.category;
	console.log('========== selected_subscriptionRecordID =========', selected_subscriptionRecordID);
	console.log('========== category =========', category);
	if( category !='' && category != null && category !=undefined ){
		var business_category_text = req.body.category;
		var category_array =   business_category_text.split(' @@name ');
		var category_value = category_array[0];
		var category_name = category_array[1];
		base('Customer').update(customer_id, {
			"Business Category": category_value,
		}, function(err, record) {
			if (err) { console.error(err); return; }
			else{
				console.log(record.get('SimplifyReference'));
				mongoose.connect(url, function(err, db){
					db.collection('users').update({ airtable_id  : customer_id }, {$set : { 'business_category': category_value, 'business_category_text': business_category_text, 'business_category_name': category_name, }}, function(err, response){
						if(err) throw err;
						//console.log( response ); 
					})
				})
			}
			
		});
	}
	if(selected_subscriptionRecordID !='' && selected_subscriptionRecordID != undefined && selected_subscriptionRecordID != null && selected_subscriptionRecordID != "undefined"){
		console.log('===========  Inside if ===========');
base('Subscriptions').update( selected_subscriptionRecordID, {
  "SubscriptionID": duration +' Month Package',
  "Screen ID": [
			_selected_screenID
		],
	"Time Date Accepted Terms": new Date().toISOString(),
	"Acoount Number": [
		customer_id
	],
	"Monthly": " "+ selected_package_Amount,
}, function(err, record) {
		if (err) { 
			console.error(err); 
			//return;
			res.send('error');
		}else{
			console.log(record.getId());
			//airtable_subscription_id = record.getId();
			var subscriptionRecordID = record.getId();
			var SubscriptionPackageID = record.get('SubscriptionPackageID');
			var ScreenID = record.get('Screen ID');
			console.log( record.get('Screen ID') );
			//var ScreenID = record.get('Screen ID');
			//var BusinessCategory = record.get('Business Category');
			var Screen = record.get('Screen');
			base('Screen').find( ScreenID, function(err, record) {
				if (err) { console.error(err); return; }
				console.log('======== screen records ========', Screen);
				console.log(record.get('Screen ID'));
				var _ScreenID = record.get('Screen ID');
				var _HostRcordID = record.get('Host ID');
				var HostAccount = record.get('HostAccount');
				//console.log('Host Record Id'+ _HostRcordID );
				//console.log( _HostRcordID );
				base('Host').find(_HostRcordID, function(err, record) {
					if (err) { console.error(err); return; }
					console.log(' Airtable host id : ', record.get('Host ID'));
					host_id = record.get('Host ID');
					Hostname = record.get('Hostname');
					HostBusinessName = record.get('Business Name');
					HostAddress = record.get('Address');
					HostSuburb = record.get('Suburb');
					HostState = record.get('State');
					HostPostcode = record.get('Postcode');
					HostEmailAddress = record.get('Email Address');
					HostAuthorisedPerson = record.get('Authorised Person');
				
			mongoose.connect(url, function(err, db ){
				console.log('inside update host details query');
				db.collection('subscriptions').update({ "subscription_id" : selected_subscriptionID }, {$set : {subscriptionRecordID : subscriptionRecordID,  SubscriptionPackageID : SubscriptionPackageID, ScreenID : ScreenID, Screen : Screen, HostAccount : HostAccount,host_id : host_id , HostRcordID : _HostRcordID, Hostname : Hostname, HostBusinessName : HostBusinessName, HostAddress : HostAddress, HostSuburb : HostSuburb, HostState :HostState, HostPostcode : HostPostcode , HostEmailAddress : HostEmailAddress, HostAuthorisedPerson : HostAuthorisedPerson }}, function(err, response){
					if(err) throw err;
					//console.log( response );
					db.collection('invoices').update({subscription_id :selected_subscriptionID }, {$set : { description : HostBusinessName }}, { multi: true} , function(errr, response1){
						if(errr) throw errr; 
					});
					
				})
				/* db.collection('orders').updateOne({ "subscriptionID" : selected_subscriptionID }, {$set : {subscriptionRecordID : subscriptionRecordID,  SubscriptionPackageID : SubscriptionPackageID, ScreenID : ScreenID, Screen : Screen, HostAccount : HostAccount , host_id : host_id , HostRcordID : _HostRcordID, Hostname : Hostname, HostBusinessName : HostBusinessName, HostAddress : HostAddress, HostSuburb : HostSuburb, HostState :HostState, HostPostcode : HostPostcode , HostEmailAddress : HostEmailAddress, HostAuthorisedPerson : HostAuthorisedPerson }}, function(err, response){
					if(err) throw err;
					//console.log( response );
				}) */
			})
			res.send('success');
		});
	});
}
});
}else{
		console.log('===========  Inside Else ===========');
	
	base('Subscriptions').create({
		"SubscriptionID": duration +' Month Package',
		"Screen ID": [
			_selected_screenID
		],
	"Time Date Accepted Terms": new Date().toISOString(),
	"Acoount Number": [
		customer_id
	],
	"Monthly": " "+ selected_package_Amount,
	}, function(err, record) {
		if (err) { 
			console.error(err); 
			//return;
			res.send('error');
		}else{
			console.log(record.getId());
			//airtable_subscription_id = record.getId();
			var subscriptionRecordID = record.getId();
			var SubscriptionPackageID = record.get('SubscriptionPackageID');
			var ScreenID = record.get('Screen ID');
			console.log( record.get('Screen ID') );
			//var ScreenID = record.get('Screen ID');
			//var BusinessCategory = record.get('Business Category');
			var Screen = record.get('Screen');
			var HostAccount = record.get('HostAccount');
			
			base('Screen').find( ScreenID, function(err, record) {
				if (err) { console.error(err); return; }
				console.log('======== screen records ========', Screen);
				console.log(record.get('Screen ID'));
				var _ScreenID = record.get('Screen ID');
				var _HostRcordID = record.get('Host ID');
				var HostAccount = record.get('HostAccount');
				//console.log('Host Record Id'+ _HostRcordID );
				//console.log( _HostRcordID );
				base('Host').find(_HostRcordID, function(err, record) {
					if (err) { console.error(err); return; }
					console.log(' Airtable host id : ', record.get('Host ID'));
					host_id = record.get('Host ID');
					Hostname = record.get('Hostname');
					HostBusinessName = record.get('Business Name');
					HostAddress = record.get('Address');
					HostSuburb = record.get('Suburb');
					HostState = record.get('State');
					HostPostcode = record.get('Postcode');
					HostEmailAddress = record.get('Email Address');
					HostAuthorisedPerson = record.get('Authorised Person');
				
			mongoose.connect(url, function(err, db ){
				db.collection('subscriptions').updateOne({ "subscription_id" : selected_subscriptionID }, { $set : {subscriptionRecordID : subscriptionRecordID,  SubscriptionPackageID : SubscriptionPackageID, ScreenID : ScreenID, Screen : Screen, HostAccount : HostAccount,host_id : host_id , HostRcordID : _HostRcordID, Hostname : Hostname, HostBusinessName : HostBusinessName, HostAddress : HostAddress, HostSuburb : HostSuburb, HostState :HostState, HostPostcode : HostPostcode , HostEmailAddress : HostEmailAddress, HostAuthorisedPerson : HostAuthorisedPerson }}, function(err, response){
					if(err) throw err;
					//console.log( response );
					db.collection('invoices').update({subscription_id :selected_subscriptionID }, {$set : { description : HostBusinessName }},{ multi: true}, function(errr, response1){
						if(errr) throw errr; 
					});
				})
				/* db.collection('orders').updateOne({ "subscriptionID" : selected_subscriptionID }, {$set : {subscriptionRecordID : subscriptionRecordID,  SubscriptionPackageID : SubscriptionPackageID, ScreenID : ScreenID, Screen : Screen, HostAccount : HostAccount , host_id : host_id , HostRcordID : _HostRcordID, Hostname : Hostname, HostBusinessName : HostBusinessName, HostAddress : HostAddress, HostSuburb : HostSuburb, HostState :HostState, HostPostcode : HostPostcode , HostEmailAddress : HostEmailAddress, HostAuthorisedPerson : HostAuthorisedPerson }}, function(err, response){
					if(err) throw err;
					//console.log( response );
				}) */
			})
			res.send('success');
		});
	});
}
}); //====== need
}
});

//===function to show invoice on staff dashboard =======//

app.get('/invoice_list',function(req,res)
 {
	var query = url1.parse( req.url, true ).query;
	//var query = url1.parse( req.url, true ).query;
	var subscription_id = query.subscription_id;
	var type = query.type;
	//var subscription_id = req.body.subscription_id;
	console.log( 'Subscription id staff===> '+subscription_id );
	
	
	mongoose.connect( url, function(err, db){
		if( err ) throw err;					
		db.collection('invoices').find({ subscription_id : subscription_id, type : type  }).toArray( function(errr, response){
			if( errr ) throw errr;
			res.send(response);	
		});
	});
});

app.get('/send_csa',function(req,res){
	var query = url1.parse( req.url, true ).query;
	var sub_id = query.id; 
	var CSAcount = query.count; 
	console.log(sub_id , '======= subscription id =======');
	mongoose.connect( url, function(err, db){
		if( err ) throw err;					
		db.collection('subscriptions').find({ subscription_id : sub_id }).toArray( function(errr, response){ console.log(response);
			if( errr ) throw errr;
			if( response.length > 0 ){ 
				var user_id = response[0].user_id;  
				var orderData = response[0];
				var d = new Date(orderData.order_date);
				var currentSubscription = orderData._id;
				var order_date = moment(d).format("DD MMM YYYY");
				var description = orderData.description;
				var package_duration = orderData.package_duration;
				var expiration_date = orderData.expiration_date;
				expiration_date = moment(expiration_date);
				//expiration_date.add({ months : package_duration });
				//expiration__date = expiration_date;
				//expiration_date = new Date( moment(expiration_date).format() ).toISOString();
				
				var yearCount = orderData.yearCount;	
					if( package_duration == 12 ){
						var differnceYearCount = yearCount - CSAcount;
						expiration_date.subtract({ years : differnceYearCount });
						expiration__date = expiration_date;
						expiration_date = new Date( moment(expiration_date).format() ).toISOString();
						var expiration_date_formatted = expiration__date.format('DD MMM YYYY');
					}else{
						var differnceYearCount = yearCount - CSAcount;
						expiration_date.subtract({ months : differnceYearCount * 6 });
						expiration__date = expiration_date;
						expiration_date = new Date( moment(expiration_date).format() ).toISOString();
						var expiration_date_formatted = expiration__date.format('DD MMM YYYY');
					}
				var commecment_order_date = order_date;
				var adsSection = '';
				var monthlySection = '';
				var package_frequency = orderData.package_frequency;
				if(package_frequency =='month'){
					var monthlyDue = expiration__date.format('Do');
					adsSection =  orderData.description + '<br />'+  currencyFormatter.format(orderData.package_fullamount, { code: 'USD' })  + '/month <br />(total '+  currencyFormatter.format(orderData.package_fullamount * package_duration, { code: 'USD' }) +')';
					monthlySection = '<tr>   <th style="width:50%;font-weight:700;padding:2px;">Monthly Payment Amount :</th><td style="width:50%;padding:2px;">'+ currencyFormatter.format(orderData.package_fullamount, { code: 'USD' }) +'</td></tr><tr>  <th style="width:50%;font-weight:700;padding:2px;">Monthly Due Date : <span style="font-size: 9px; line-height: 11px; font-weight: normal; margin-nottom : 0px; display: block;"> Payment will automatically be deducted from the billing account you provided on this date every month <span></th>    <td style="width:50%;padding:2px;">'+ monthlyDue +' Day of the Month</td>   </tr>'
				}else{
					adsSection = orderData.description + '<br />(total amount '+  currencyFormatter.format(orderData.package_fullamount, { code: 'USD' })  + ')';
					monthlySection='';
				}
				//============table=======//
				var formated_csa = '<link href="https://fonts.googleapis.com/css?family=Raleway:300,400,700" rel="stylesheet"><link href="https://fonts.googleapis.com/css?family=Lato:400,700,900" rel="stylesheet" /> <div id="pageHeader" style="padding:10px 40px;"><div style="padding-top:10px; max-width: 100%;"> <div style="width:60%; float:left; "> <img src="https://uploads-ssl.webflow.com/5ae87b768423ad2afbce8d09/5ae87b778423ad04fdce8e7a_Logo-Color.png" style="max-width: 130px;"> </div><div style="width:40%; float:left; text-align: left;font-size: 9px;font-weight:400; font-family: Raleway, sans-serif;color:#6B6D6D;"><div> <strong style=" font-size: 11px;color:#3752a6;font-weight:700;line-height:20px;">www.GoLocalpage.com.au</strong> </div><div>GoLocal Page Pty Ltd ABN 47 624 192 025</div><div>PO Box 2477 Graceville East QLD 4075</div><div>(07)3062 6983 | harry@golocalpage.com.au</div></div></div></div><div style="max-width: 100%;width:80%;clear:both; margin: auto; "><table style="clear: both;line-height:1.8;"><thead><th colspan="2" style="padding: 2px;"><h5 class="CSAHeadings text-center" style="margin-bottom: 0px; font-weight: bold;">Customer Sales Agreement</h5></th></thead>  <tbody style="text-align:right;font-size: 10px; font-family: Lato;text-align:left;"> <tr>  <th style="width:50%;font-weight:700;padding: 2px;">Reference Number :</th> <td style="width:50%;padding: 2px;">'+ orderData.arirtable_number +'</td>  </tr>     <tr>   <th style="width:50%;font-weight:700;padding: 2px;">Business Name :</th> <td style="width:50%;padding: 2px;">'+ orderData.business_name+'</td> </tr>	<tr>  <th style="width:50%;font-weight:700;padding: 2px;">Trading As :</th> <td style="width:50%;padding: 2px;">'+ orderData.trading_name +'</td>   </tr> <tr>   <th style="width:50%;font-weight:700;padding: 2px;">ABN :</th>  <td style="width:50%;padding: 2px;">'+ orderData.ABN +'</td> </tr>	<tr> <th style="width:50%;font-weight:700;padding: 2px;">Authorised Person :</th>  <td style="width:50%;padding: 2px;">'+ orderData.first_name +' '+ orderData.last_name +'</td>    </tr><tr> <th style="width:50%;font-weight:700;padding: 2px;">Address :</th><td style="width:50%;padding: 2px;">'+ orderData.billing_address +'</td> </tr><tr> <th style="width:50%;font-weight:700;padding: 2px;">Phone Number  :</th> <td style="width:50%;padding: 2px;">'+ orderData.phone +'</td> </tr><tr>  <th style="width:50%;font-weight:700;padding: 2px;">Mobile :</th>  <td style="width:50%;padding: 2px;">'+ orderData.mobile +'</td> </tr><tr><th style="width:50%;font-weight:700;padding: 2px;">Email :</th><td style="width:50%;padding: 2px;">'+ orderData.email +'</td></tr> <tr> <th style="width:50%;font-weight:700;padding: 2px;">Business Category :</th> <td style="width:50%;padding: 2px;">'+ orderData.business_category_name +'</td> </tr><tr> <th style="width:50%;font-weight:700;padding: 2px;">Host ID :</th> <td style="width:50%;padding: 2px;">'+ orderData.host_id +'</td> </tr><tr> <th style="width:50%;font-weight:700;padding: 2px;">Host Site Name :</th> <td style="width:50%;padding: 2px;">'+ orderData.Hostname +'</td> </tr><tr> <th style="width:50%;font-weight:700;padding: 2px;">Host Site Address :</th> <td style="width:50%;padding: 2px;">'+ orderData.HostAddress +'</td> </tr><tr><th style="width:50%;font-weight:700;padding: 2px;">Subscription Package :</th> <td style="width:50%;padding: 2px;">'+ adsSection +'</td> </tr><tr>  <th style="width:50%;font-weight:700;padding: 2px;">Expiration Date :</th> <td style="width:50%;padding: 2px;">'+ expiration_date_formatted +'</td>  </tr> '+ monthlySection +' <tr><th style="width:50%;font-weight:700;padding: 2px;">Commencement Date :</th>    <td style="width:50%;padding: 2px;">'+ commecment_order_date +'</td></tr><tr><th colspan="2" style="font-weight: 300; padding: 2px; text-align: justify; line-height: 12px; font-size: 10px;"><h5 class="CSADetailsText" style="font-weight: 700 !important; margin-bottom: 10px;font-size: 10px;">Commencement Date</h5>Your Commencement Date starts on the date your first payment was made. We have added an extra 15 days,	free of charge, to your Expiration Date. This ensures you receive the full term of your Subscription Package and allows you time to design an Ad. Either way you get an extra 2 weeks of advertising time for free. For example if you purchased the 12 Month Package and made payment on 1 January 2018, then your Commencement Date is 1 January 2018 and your 	Expiration Date is 16 January 2019 (1 January 2018 + 12 Months + 15 days Free).<br /><h5 style="font-weight: 700 !important; margin-bottom: 10px; font-size: 10px;">Automatic Renewal</h5><span style="line-height:15px;font-style:italic !important;font-size: 9px;">(see clause 5 of the Terms and Conditions)</span><br /> This Customer Sales Agreement will automatically renew and become a rolling contract after the Expiration Date, and will be for the same Subscription Package that you’re currently on. Please write to us 21 days before the Expiration Date if you do not wish to renew this Customer Sales Agreement. Don’t worry we will notify you when this time approaches to remind you of this. If you’re happy to renew, you don’t have to do anything.</th></tr></tbody></table> </div><div id="pageFooter" style="padding:0px;margin:0;"><div style="color:#525454;width:100%;clear:both;text-align: center;font-size: 11px;font-family: Raleway, sans-serif;padding:0px;margin:0;"> GoLocal Page Pty Ltd I (07) 3062 6983 I harry@golocalpage.com.au I www.golocalpage.com.au </div></div>';  
				
				var options = {
					//phantomPath: __dirname + "\node_modules\phantomjs-prebuilt\bin\phantomjs",
					format: 'A4'
				};  
				
				var csa = formated_csa;
					pdf.create(csa, options).toBuffer(function(err1, buffer1){ //== generate csa
					//res.end();
					var formated_message = '<div style="max-width: 600px; margin: auto;"><p>Hi '+ orderData.first_name +' ' + orderData.last_name +'</p><p>Thank you for purchasing our GoLocal Page Packages. We have enclosed your:</p><ul><li>Customer Sales Agreement</li><li>Tax Invoice</li><li>Terms and Conditions</li><li>Privacy Policy</li></ul><p>Please read these documents carefully and let us know of any changes or questions you might have.</p><p>Thank you,</p><p>Harry</p><p>07 3062 6983 | harry@golocalpage.com.au</p><p>PO Box 2477 Graceville East Queensland 4075 |<a href="https://www.golocalpage.com.au/">www.golocalpage.com.au</a></p><p>The information contained in this email, including all attachments, is confidential and may be legally privileged. If you have received this email by mistake, please inform us and destroy all copies of the original message. Do not make any use of this email. We do not waive any privilege, confidentiality or copyright associated with it.</p></div>';
					
					var mailOptions1 = {
						from: 'testmidriff@gmail.com',
						to: orderData.email ,
						//to: 'midriffdeveloper3@gmail.com',
						subject: 'GoLocal Page - Screen Ad Customer Sales Agreement',
						html: formated_message,
						attachments: [
							{   // file on disk as an attachment
								filename: 'PrivacyPolicy.pdf',
								path: __dirname+'/public/files/PrivacyPolicy.pdf' // stream this file
							},
							{   // file on disk as an attachment
								filename: 'TermsAndConditions.pdf',
								path: __dirname+'/public/files/TermsAndConditions.pdf' // stream this file
							},
							{   // utf-8 string as an attachment
								filename: 'CSA.pdf',
								content: buffer1,
								contentType: 'application/pdf'
							}
						]
					};
					transporter.sendMail(mailOptions1, function(error, info){
						if (error) {
							console.log(error);
							res.redirect('/dashboardAdmin#/subscription');
							res.end();
						
						} else {
							console.log('Email sent: ' + info.response);
							res.redirect('/dashboardAdmin#/subscription');
							//res.send(formated_csa);
							res.end();
						} 
						
					});
				});
			}	
		});
	});
});

app.get('/cart',DefaultParser, function( req, res ){
	var cart_store_id = req.cookies.cart_store_id;
	console.log( cart_store_id );
	if( cart_store_id != '' && cart_store_id != undefined ){
		mongoose.connect( url, function(err, db){
			if( err ) throw err;
			db.collection('cart_meta').findOne({ _id : new ObjectId( cart_store_id ) }, function(errr, response){
				if( errr ) throw errr;
				console.log( response );
				if( response ){
					//var cartdata = response;
					console.log( response.cart_details.product__name );
					var cart_details = response.cart_details ;
					var addon__details = response.addon__details ;
				}else{
					var cart_details = [];
					var addon__details = [];
				}
				
				res.render('cart', { cart_details : cart_details , addon__details : addon__details, page_title : 'cart' });
			});
		})
	}
	//res.end();
});
	
//============================//
app.post('/create_subscription_simplify', DefaultParser, function(req, res){
	var user_id1 = req.body.user_id;
	if(user_id1 != undefined && user_id1 != null && user_id1 !=''){
		var user_id  = user_id1;
	}else{
		sess = req.session;
		userdata = sess.passport;
		//console.log( userdata.user );
		var user_id  = userdata.user;
	}
	//======== GET USER DATA =========//
	function getUserDate(){
		return new Promise(function(resolve, reject) {
			mongoose.connect(url, function(err, db){
				db.collection('users').findOne({_id : new ObjectId( user_id )}, function(err, userResponse){
					if(err) throw err;
					resolve( userResponse );
				})
			});
		});	
	}
	
	function getNextInvoiceNumber(){
		return new Promise(function(resolve, reject) {
			mongoose.connect(url, function(err, db){
				db.collection('invoices').find().sort({ invoice_number: -1 }).limit(1).toArray( function(err, response){
				//console.log( response );
				if( response.length > 0 ){
					resolve( response[0].invoice_number );
				}else{
					resolve( 0 );
				}
			});
		})
		})
	}
	function getNextOrderNumber(){
		return new Promise(function(resolve, reject) {
			mongoose.connect(url, function(err, db){
				db.collection('orders').find().sort({ unique_order_number: -1 }).limit(1).toArray( function(err, response){
				//console.log( response );
				if( response.length > 0 ){
					resolve( response[0].unique_order_number );
				}else{
					resolve( 0 );
				}
			});
		})
		})
	}
	
	function getNextSubacriptionNumber(){
		return new Promise(function(resolve, reject) {
			mongoose.connect(url, function(err, db){
				db.collection('subscriptions').find().sort({ subscription_number: -1 }).limit(1).toArray( function(err, response){
				//console.log( response );
				if( response.length > 0 ){
					resolve( response[0].subscription_number );
				}else{
					resolve( 0 );
				}
			});
		})
		})
	} 
	//===============================//
	async function getReferralData(){
		var referral_code = req.body.referral_code;
		var userData = await getUserDate();
		var email = userData.email;
		return new Promise(function(resolve, reject) {
		var ref_email = req.cookies.referral_code_email;
		if( referral_code !='' && referral_code != undefined &&  ( ref_email !=  email && ref_email !='' )){
			mongoose.connect(url, function(err, db){
				db.collection('referral_purchase').findOne({ user_id : new ObjectId(user_id) , referral_subscription_id : referral_code},function(er, ressponse_ref){
					if(er) throw er;
					if(ressponse_ref){
						console.log('User already used the code');
						response = 2;
						resolve( response );
					}else{
						response = 1;
						resolve( response ); //=== valid referral
					}
				})
			});
		}else{
			response = 0;
			resolve( response ); //=== invalid referral
		}
	   });
	}
	
	//===============================//
	var get_cart__data = req.body.get_cart__data;
	var package_amount = get_cart__data.cart_details.package_amount;
	var package_fullamount = get_cart__data.cart_details.package_fullamount;
	
	
	var package_choosen = get_cart__data.cart_details.package_choosen;
	var package_duration = get_cart__data.cart_details.package_duration;
	var package_frequency = get_cart__data.cart_details.package_frequency;
	
	var addon_amount = get_cart__data.cart_details.addon_amount;
	var addon_fullamount = get_cart__data.cart_details.addon_fullamount;
	
	var number_of_ads = get_cart__data.cart_details.number_of_ads;
	var addon_type = get_cart__data.cart_details.addon_type;
	var addon_choosen = get_cart__data.cart_details.addon_choosen;
	var product_quantity = get_cart__data.cart_details.product_quantity;
	var addon_duration = get_cart__data.cart_details.addon_duration;
	var _location = get_cart__data.cart_details.location;
	var location_city1 = get_cart__data.cart_details.location_city1;
	var csa = req.body.csa;
	var csa_id;
	if(csa!='' && csa != undefined && csa != null && csa == true  ){
		csa_id = req.body.csa_id;
	}
	//============== DESIGN PAYMANTS CODE GOES HERE  ==========//
	async function createDesignPayment(){ 
		var userData = await getUserDate();
		//console.log( userData );
		var invoice_number = await getNextInvoiceNumber();
		var invoice_number = invoice_number + 1;
		var trading_name = userData.trading_name;
		businessnamearray = trading_name.split(' ');
		var businessnamearray1 =[];
		var  invoicenameString = '';
		if( businessnamearray.length > 0 ){
		for(var i =0; i< businessnamearray.length; i++ ){
			var name = 	businessnamearray[i];
			if( name !='' ){
				businessnamearray1.push(name);
				//businessnamearray1.push( name.substr(0, 3));
			}
		}
			invoicenameString = businessnamearray1.join('');
		}
		invoicenameString = invoicenameString +''+ invoice_number;
		
		//=================================//
		var simplify_id = userData.simplify_id;
		var business_category_name = userData.business_category_name;
		var first_name = userData.first_name;
		var last_name = userData.last_name;
		var phone = userData.phone;
		var mobile = userData.mobile;
		var email = userData.email;
		var streetName = userData.streetName;
		var city = userData.city;
		var state = userData.state;
		var zipCode = userData.zipCode;
		var airtable_id = userData.airtable_id;
		var arirtable_number = userData.arirtable_number;
		var card_type = userData.type;
		var business_name = userData.business_name;
		var ABN = userData.ABN;
		var billing_address = userData.billing_address;
		var postal_address = userData.postal_address;
		//=================================//
		var card_type = userData.type;
		var addon_GST =  addon_amount * 10 / 100;
		//addon_GST = addon_GST.toFixed(2); 
		//addon_GST = parseFloat(addon_GST).toFixed(2);
		
		//var addon_subtotal = parseFloat( addon_fullamount );
		//var addon_subtotal = parseFloat( addon_fullamount ).toFixed(2); 
		//var addon_subtotal = Math.round( addon_fullamount * 100 )/100; 
		var addon_subtotal = roundToTwo( addon_fullamount ); 
		var card_charges = 0;
		if( card_type == 'AMERICAN_EXPRESS' ){
			card_charges = addon_subtotal * 3.025 / 100;
			//card_charges = parseFloat(card_charges).toFixed(2);
		}
		var next_payment_date;
		if( addon_type =='month' ){
			var paymentDate = new Date().toISOString();
			var paymentDateFormatted = new Date().toISOString();
			var next_payment_date = new Date().toISOString();
			var expirationDate = new Date().toISOString();
			var paymentTypeDuration = 1;
			next_payment_date = moment(next_payment_date);
			next_payment_date.add({days : 1});
			//next_payment_date.add({months : 1, days : 15});
			next_payment_date = new Date( moment(next_payment_date).format() ).toISOString();
			expirationDate = moment(expirationDate);
			expirationDate.add({months : 12, days : 15});
			//next_payment_date.add({months : 12, days : 15});
			expirationDate = new Date( moment(expirationDate).format() ).toISOString();
			var paymentDateFormatted = moment(paymentDateFormatted).format("Do MMM YYYY");
			var monthlyDue = moment(next_payment_date).format("Do");
			var expirationDateFormatted = moment(expirationDate).format("Do MMM YYYY");
		}else{
			var paymentTypeDuration = 12;
			var paymentDate = new Date().toISOString();
			var paymentDateFormatted = new Date().toISOString();
			var next_payment_date = new Date().toISOString();
			var expirationDate = new Date().toISOString();
			next_payment_date = moment(next_payment_date);
			next_payment_date.add({days : 1});
			//next_payment_date.add({months : 12, days : 15});
			next_payment_date = new Date( moment(next_payment_date).format() ).toISOString();
			expirationDate = moment(expirationDate);
			expirationDate.add({months : 12, days : 15});
			//next_payment_date.add({months : 12, days : 15});
			expirationDate = new Date( moment(expirationDate).format() ).toISOString();
			var expirationDateFormatted = moment(expirationDate).format("Do MMM YYYY");
			var paymentDateFormatted = moment(paymentDateFormatted).format("Do MMM YYYY");
			var monthlyDue = moment(next_payment_date).format("Do");
		}
		
		addon_total = parseFloat(addon_subtotal) + parseFloat(card_charges);
		//addon_total = addon_total.toFixed(2); 
		//addon_total = parseFloat(addon_total).toFixed(2);
		//addon_total = Math.round(addon_total * 100 )/100;
		addon_total = roundToTwo(addon_total);
		
		//var addon_package_name = ""+ addon_duration +" Months Package - ("+ number_of_ads  +" Ads) ";
		var addon_package_name = "Design and Promote "+ addon_duration +" Month Package";
		return new Promise(function(resolve, reject) {
		client.payment.create({
			amount : addon_total * 100, 
			description : addon_package_name,
			customer : simplify_id,
			currency : "AUD"
		}, function(errData, data){
			if(errData){
			console.error("Error Message: " + errData.data.error.message);
			console.log(' Design package payment issue');
			var responseData = { 
				'status' : 'error',
				'data' : ''
			};
			resolve(responseData);
		}else{
			//console.log("Payment Status: " + data.paymentStatus);
			var paymentStatus =  data.paymentStatus;
			var paymentId =  data.id;
			var transactionData =  data.transactionData;
			var order_Amount =  data.transactionData.amount;
			//order_Amount = order_Amount.toFixed(2); 
			//order_Amount = Number(order_Amount);
			//order_Amount = parseFloat(order_Amount).toFixed(2);
			//order_Amount = Math.round(order_Amount * 100 )/100;
			order_Amount = roundToTwo(order_Amount );
			var currency =  data.transactionData.currency;
			var description =  data.transactionData.description;
			var invoice_status = '';
			if( paymentStatus == 'APPROVED' ){
				invoice_status = 1;
				mongoose.connect(url, function(err, db){
					db.collection('designPurchase').insertOne({ paymentStatus : paymentStatus, paymentId : paymentId, package_Amount : addon_amount, GST : addon_GST, order_Amount : order_Amount, currency : currency, description : description, number_of_ads : number_of_ads, addon_duration : addon_duration, addon_fullamount : addon_fullamount,  user_id : user_id, last_name: last_name, first_name: first_name  ,order_date : new Date().toISOString(),  business_category_name : business_category_name, airtable_id: airtable_id, arirtable_number : arirtable_number, phone : phone,  email : email, card_type : card_type, card_charges : card_charges, zipCode : zipCode, state : state, city : city, streetName : streetName , invoice_number : invoice_number, invoive_display : invoicenameString, csa_id : csa_id, simplify_id : simplify_id, invoice_status : invoice_status, invoice_count : 1, next_payment_date : next_payment_date , expirationDate : expirationDate, business_name : business_name, trading_name : trading_name, ABN : ABN, payment_complete_date : paymentDate, mobile : mobile, subscription_id : paymentId, paymentTypeDuration : paymentTypeDuration, AvaiableFreeMonths : 0, free_months : 0, yearCount : 1, status : 1, billing_address : billing_address, postal_address : postal_address  ,_location : _location ,location_city1 : location_city1, addon_type  : addon_type}, function(errr, response){
						console.log('design data stored');   
						//========== REGISTER USER ON GOLOCALDESIGN =========//
							request('https://www.golocaldesigns.com/register-api?email='+ email +'&design_limit=3&package_no=1&account_no='+ user_id +'&full_name='+ first_name +'  ' + last_name, function (error, response, body) { 
								if (!error && response.statusCode == 200) {
									console.log(body) // 
									userAgentInfo = body;
									var userAgentInfo = body;
									//console.log( userAgentInfo);
									//console.log( response);
								}else{
									console.log('Not connected');
									console.log( error );
									//console.log( response );
								}
							})
						//========== REGISTER USER ON GOLOCALDESIGN =========//
					});
					 
					db.collection('invoices').insertOne({ type : 'Design',paymentStatus : paymentStatus, paymentId : paymentId, package_Amount : addon_amount, GST : addon_GST, order_Amount : order_Amount, addon_fullamount : addon_fullamount, currency : currency, description : description, number_of_ads : number_of_ads, addon_duration : addon_duration,  user_id : user_id, last_name: last_name, first_name: first_name  ,order_date : new Date().toISOString(),  business_category_name : business_category_name, airtable_id: airtable_id, arirtable_number : arirtable_number, phone : phone,  email : email, card_type : card_type, card_charges : card_charges, zipCode : zipCode, state : state, city : city, streetName : streetName, invoice_number : invoice_number, invoive_display : invoicenameString, csa_id : csa_id, simplify_id : simplify_id , invoice_status : invoice_status, business_name : business_name, trading_name : trading_name, ABN : ABN, payment_complete_date : paymentDate, mobile : mobile, subscription_id : paymentId , paymentTypeDuration : paymentTypeDuration, status : 1, due_date : new Date().toISOString(), billing_address : billing_address, postal_address : postal_address}, function(errr, response){ 
						console.log('design invoice stored');
					});
				}); 
				var cardChargesSection ='';
				if( card_charges > 0 ){
					cardChargesSection = '<tr><td style="vertical-align: top; color: red;">Amex card surcharge 3.025%</td> <td style="vertical-align: top;width:40%; color: red;">'+  currencyFormatter.format(card_charges, { code: '' })  +' </td>  </tr>';
				}
				
				//====================================//
				var formated_invoice = '<link href="https://fonts.googleapis.com/css?family=Raleway:300,400,700" rel="stylesheet" /><link href="https://fonts.googleapis.com/css?family=Lato:400,700,900" rel="stylesheet" /> <div id="pageHeader" style="padding:10px 40px;"><div style="padding-top:10px; max-width: 100%;"> <div style="width:60%; float:left; "> <img src="https://uploads-ssl.webflow.com/5ae87b768423ad2afbce8d09/5ae87b778423ad04fdce8e7a_Logo-Color.png" style="max-width: 165px;"> </div><div style="width:40%; float:left; text-align: left;font-size: 9px;font-weight:400; font-family: Raleway, sans-serif;color:#6B6D6D;"><div> <strong style=" font-size: 11px;color:#3752a6;font-weight:700;line-height:20px;">www.GoLocalpage.com.au</strong> </div><div>GoLocal Page Pty Ltd ABN 47 624 192 025</div><div>PO Box 2477 Graceville East QLD 4075</div><div>(07)3062 6983 | harry@golocalpage.com.au</div></div></div></div> <div style="padding-bottom:60px; max-width: 100%; font-family: Lato, sans-serif;">  <div style="width:60%; float:left;font-size: 10px;padding-top:30px;line-height:16px;color: #000; "> <div style="padding-left:30px;padding-top:20px;font-weight:500; ">  <div>'+ first_name +' ' + last_name +'</div>  <div>'+ business_name +'</div>   <div>'+ streetName +' </div> <div>'+  city  +' '+ state +' '+  zipCode +'</div>  <div>'+  phone  +' | '+ email  +' </div>  </div> </div> <div style="width:40%; float:left;padding-top:30px;font-size: 10px;"> <h1 style="font-weight:bold;margin-block-start: 0;font-size: 13px;">Tax Invoice</h1> <table style="width: 100%;clear: both;line-height:15px;">  <tbody style="text-align:right;font-size: 10px; line-height:13px;font-weight:normal;">  <tr>  <td style="text-align:left;width:50%;">Invoice No :</td>  <td style="text-align:right;width:50%;">'+ invoicenameString  +'</td>   </tr>  <tr>  <td style="text-align:left;width:50%;">Payment Date :</td>   <td style="text-align:right;width:50%;"> '+ paymentDateFormatted +'</td>   </tr>   </tbody>  </table>  <div style="padding: 12px 10px;border: 2px solid #000;margin-top: 15px;margin-bottom: 15px; border-radius: 8px;"> Reference Number: <span style="float:right;"> '+ arirtable_number +' </span> </div>  <div style="padding: 12px 10px;border: 2px solid #000;margin-top: 15px;margin-bottom: 15px; border-radius: 8px;"> Total Amount: <span style="float:right;"> '+ currencyFormatter.format(order_Amount / 100, { code: 'USD' }) +' </span> </div>  <div style="padding: 12px 10px;border: 2px solid #000;margin-top: 15px;margin-bottom: 15px; border-radius: 8px;text-align:center"> Paid in Full Thank you.  </div>  </div> </div>   <div style="max-width: 100%;width:100%;clear:both; font-family: Lato, sans-serif;"> <hr style="border-top:1px solid #000;border-bottom:1px solid transparent;width:70%;float:right;margin-bottom:23px;"> <table style="text-align:right;float:right;">  <tbody style="text-align:right;font-size: 12px; line-height:1.0;font-weight:300;"><tr><td>'+ addon_package_name +'</td><td>'+ currencyFormatter.format(addon_amount, { code: '' }) +'</td></tr> <tr>  <td style="vertical-align: top;">plus GST (10%)</td> <td style="vertical-align: top;width:40%;">'+  currencyFormatter.format(addon_GST, { code: '' })  +' </td>  </tr> '+ cardChargesSection +' <tr>  <td style="vertical-align: top; font-weight: bold;">TOTAL</td>  <td style="vertical-align: top;width:40%; font-weight: bold;">'+ currencyFormatter.format(addon_total, { code: 'USD' })  +' </td> </tr> </tbody>  </table> </div> <hr style="margin-top:23px;border-top:1px solid #000;border-bottom:1px solid transparent;  width:70%; float:right; margin-bottom:38px;"><div id="pageFooter" style="padding:0px;margin:0;"><div style="color:#525454;width:100%;clear:both;text-align: center;font-size: 11px;font-family: Raleway, sans-serif;padding:0px;margin:0;"> GoLocal Page Pty Ltd I (07) 3062 6983 I harry@golocalpage.com.au I www.golocalpage.com.au </div></div>';

				var designSection = '';
				var monthlySection = '';
				if(addon_type =='month'){
					designSection =  description + ''+  currencyFormatter.format(addon_fullamount, { code: 'USD' })  + '/month <br />(minimum payment period of 12 months required)';
					monthlySection = '<tr>   <th style="width:50%;font-weight:700;padding:5px;">Monthly Payment Amount :</th><td style="width:50%;padding:5px;">'+ currencyFormatter.format(addon_fullamount, { code: 'USD' }) +'</td></tr><tr>  <th style="width:50%;font-weight:700;padding:5px;">Monthly Due Date : <span style="font-size: 9px; line-height: 11px; font-weight: normal; margin-nottom : 0px; display: block;"> Payment will automatically be deducted from the billing account you provided on this date every month <span></th>    <td style="width:50%;padding:5px;">'+ monthlyDue +' Day of the Month</td>   </tr>'
				}else{
					designSection = description + '<br />('+  currencyFormatter.format(addon_fullamount, { code: 'USD' })  + ' Annual Payment)';
					monthlySection='';
				}
				//============ Design CSA ========//
				var formated_csa = '<link href="https://fonts.googleapis.com/css?family=Raleway:300,400,700" rel="stylesheet"><link href="https://fonts.googleapis.com/css?family=Lato:400,700,900" rel="stylesheet" /> <div id="pageHeader" style="padding:10px 40px;"><div style="padding-top:10px; max-width: 100%;"> <div style="width:60%; float:left; "> <img src="https://uploads-ssl.webflow.com/5ae87b768423ad2afbce8d09/5ae87b778423ad04fdce8e7a_Logo-Color.png" style="max-width: 130px;"> </div><div style="width:40%; float:left; text-align: left;font-size: 9px;font-weight:400; font-family: Raleway, sans-serif;color:#6B6D6D;"><div> <strong style=" font-size: 11px;color:#3752a6;font-weight:700;line-height:20px;">www.GoLocalpage.com.au</strong> </div><div>GoLocal Page Pty Ltd ABN 47 624 192 025</div><div>PO Box 2477 Graceville East QLD 4075</div><div>(07)3062 6983 | harry@golocalpage.com.au</div></div></div></div><div style="max-width: 100%;width:80%;clear:both; margin: auto; "><table style="clear: both;line-height:1.8;"><thead><th colspan="2" style="padding: 2px;"><h5 class="CSAHeadings text-center" style="margin-bottom: 0px; font-weight: bold;">Customer Sales Agreement</h5></th></thead>  <tbody style="text-align:right;font-size: 10px; font-family: Lato;text-align:left;"> <tr>  <th style="width:50%;font-weight:700;padding: 2px;">Reference Number :</th> <td style="width:50%;padding: 2px;">'+ arirtable_number +'</td>  </tr>     <tr>   <th style="width:50%;font-weight:700;padding: 2px;">Business Name :</th> <td style="width:50%;padding: 2px;">'+ business_name+'</td> </tr>	<tr>  <th style="width:50%;font-weight:700;padding: 2px;">Trading As :</th> <td style="width:50%;padding: 2px;">'+ trading_name+'</td>   </tr> <tr>   <th style="width:50%;font-weight:700;padding: 2px;">ABN :</th>  <td style="width:50%;padding: 2px;">'+ ABN +'</td> </tr>	<tr> <th style="width:50%;font-weight:700;padding: 2px;">Authorised Person :</th>  <td style="width:50%;padding: 2px;">'+ first_name +' '+ last_name +'</td>    </tr><tr> <th style="width:50%;font-weight:700;padding: 2px;">Address :</th><td style="width:50%;padding: 2px;">'+ billing_address +'</td> </tr><tr> <th style="width:50%;font-weight:700;padding: 2px;">Phone Number  :</th> <td style="width:50%;padding: 2px;">'+ phone +'</td> </tr><tr>  <th style="width:50%;font-weight:700;padding: 2px;">Mobile :</th>  <td style="width:50%;padding: 2px;">'+ mobile +'</td> </tr><tr><th style="width:50%;font-weight:700;padding: 2px;">Email :</th><td style="width:50%;padding: 2px;">'+ email +'</td></tr> <tr> <th style="width:50%;font-weight:700;padding: 2px;">Business Category :</th> <td style="width:50%;padding: 2px;">'+ business_category_name +'</td> </tr><tr><th style="width:50%;font-weight:700;padding: 2px;">Subscription Package :</th> <td style="width:50%;padding: 2px;">'+ designSection +'</td> </tr><tr>  <th style="width:50%;font-weight:700;padding: 2px;">Design Package Expires :</th> <td style="width:50%;padding: 2px;">'+ expirationDateFormatted +'</td>  </tr> '+ monthlySection +' <tr><th style="width:50%;font-weight:700;padding: 2px;">Commencement Date :</th>    <td style="width:50%;padding: 2px;">'+ paymentDateFormatted +'</td></tr><tr><th colspan="2" style="font-weight: 300; padding: 2px; text-align: justify; line-height: 12px; font-size: 10px;"><h5 class="CSADetailsText" style="font-weight: 700 !important; margin-bottom: 10px;font-size: 10px;">Commencement Date</h5>Your Commencement Date starts on the date your first payment was made. We have added an extra 15 days,	free of charge, to your Expiration Date. This ensures you receive the full term of your Subscription Package and allows you time to design an Ad. Either way you get an extra 2 weeks of advertising time for free. For example if you purchased the 12 Month Package and made payment on 1 January 2018, then your Commencement Date is 1 January 2018 and your 	Expiration Date is 16 January 2019 (1 January 2018 + 12 Months + 15 days Free).<br /><h5 style="font-weight: 700 !important; margin-bottom: 10px; font-size: 10px;">Automatic Renewal</h5><span style="line-height:15px;font-style:italic !important;font-size: 9px;">(see clause 5 of the Terms and Conditions)</span><br /> This Customer Sales Agreement will automatically renew and become a rolling contract after the Expiration Date, and will be for the same Subscription Package that you’re currently on. Please write to us 21 days before the Expiration Date if you do not wish to renew this Customer Sales Agreement. Don’t worry we will notify you when this time approaches to remind you of this. If you’re happy to renew, you don’t have to do anything.</th></tr></tbody></table> </div><div id="pageFooter" style="padding:0px;margin:0;"><div style="color:#525454;width:100%;clear:both;text-align: center;font-size: 11px;font-family: Raleway, sans-serif;padding:0px;margin:0;"> GoLocal Page Pty Ltd I (07) 3062 6983 I harry@golocalpage.com.au I www.golocalpage.com.au </div></div>'; 
 
 
				var options = {
					//phantomPath: __dirname + "\node_modules\phantomjs-prebuilt\bin\phantomjs",
					format: 'A4'
				};  
				var invoice = formated_invoice;
				var csa = formated_csa;
				pdf.create(invoice, options).toBuffer(function(err, buffer){
				console.log('This is a buffer:', Buffer.isBuffer(buffer));
				console.log( buffer );
				pdf.create(csa, options).toBuffer(function(err1, buffer1){ //== generate csa
				//res.end();
				var formated_message = '<div style="max-width: 600px; margin: auto;"><p>Hi '+ first_name +' ' + last_name +'</p><p>Thank you for purchasing our GoLocal Page Packages. We have enclosed your:</p><ul><li>Customer Sales Agreement</li><li>Tax Invoice</li><li>Terms and Conditions</li><li>Privacy Policy</li></ul><p>Please read these documents carefully and let us know of any changes or questions you might have.</p><p>Thank you,</p><p>Harry</p><p>07 3062 6983 | harry@golocalpage.com.au</p><p>PO Box 2477 Graceville East Queensland 4075 |<a href="https://www.golocalpage.com.au/">www.golocalpage.com.au</a></p><p>The information contained in this email, including all attachments, is confidential and may be legally privileged. If you have received this email by mistake, please inform us and destroy all copies of the original message. Do not make any use of this email. We do not waive any privilege, confidentiality or copyright associated with it.</p></div>';
				
				var mailOptions1 = {
					from: 'testmidriff@gmail.com',
					to: email,
					subject: 'GoLocal Page - Design & Promote Customer Sales Agreement',
					html: formated_message,
					attachments: [
						{   // file on disk as an attachment
							filename: 'PrivacyPolicy.pdf',
							path: __dirname+'/public/files/PrivacyPolicy.pdf' // stream this file
						},
						{   // file on disk as an attachment
							filename: 'TermsAndConditions.pdf',
							path: __dirname+'/public/files/TermsAndConditions.pdf' // stream this file
						},
						{   // utf-8 string as an attachment
							filename: 'INVOICE.pdf',
							content: buffer,
							contentType: 'application/pdf'
						},
						{   // utf-8 string as an attachment
							filename: 'CSA.pdf',
							content: buffer1,
							contentType: 'application/pdf'
						}
					]
				};
				transporter.sendMail(mailOptions1, function(error, info){
					if (error) {
						console.log(error);
					} else {
						console.log('Email sent: ' + info.response);
					} 
				});
			});
			})
				
//====================================//
	var responseData = {
		'status' : 'success',
		'data' : data
	};
	resolve(responseData);
	}
	else{
				var responseData = {
					'status' : 'error',
					'data' : data
				};
				resolve(responseData);
			}
			//res.end();
		}
		})
		});
	}
	//============== DESIGN PAYMANTS CODE ENDS HERE  ==========//
	//============ SUBSCRIPTION CREATION CODE GOES HERE ===========//
	async function createReferralSubscription( subscriptionProcessData ){  
		var userData = await getUserDate();
		var simplify_id = userData.simplify_id;
		var business_category_name = userData.business_category_name;
		var first_name = userData.first_name;
		var last_name = userData.last_name;
		var phone = userData.phone;
		var mobile = userData.mobile;
		var email = userData.email;
		var streetName = userData.streetName;
		var city = userData.city;
		var state = userData.state;
		var zipCode = userData.zipCode;
		var airtable_id = userData.airtable_id;
		var arirtable_number = userData.arirtable_number;
		var card_type = userData.type;
		var business_name = userData.business_name;
		var trading_name = userData.trading_name;
		var billing_address = userData.billing_address;
		var postal_address = userData.postal_address;
		var ABN = userData.ABN;
		
		var subscription_number = await getNextSubacriptionNumber();
		subscription_number = subscription_number + 1;
		var invoice_number = await getNextInvoiceNumber();
		invoice_number = invoice_number + 1;
		businessnamearray = trading_name.split(' ');
		var businessnamearray1 =[];
		var invoicenameString = '';
		var invoicenameString1 = '';
		if( businessnamearray.length > 0 ){
		for(var i =0; i< businessnamearray.length; i++ ){
			var name = 	businessnamearray[i];
			if( name !='' ){
				businessnamearray1.push(name);
				//businessnamearray1.push( name.substr(0, 3));
			}
		}
			invoicenameString = businessnamearray1.join('');
			invoicenameString1 = businessnamearray1.join('');
		}
		invoicenameString = invoicenameString +''+ invoice_number;
		var subscription_id = "C9-"+subscription_number;
		
		return new Promise( function(resolve, reject) {
			var date = new Date().toISOString();
			var expiration_date = new Date().toISOString();
			var next_payment_date = new Date().toISOString();
			//due_date =  moment(date).format("DD MMM YYYY");
			next_payment_date = moment(next_payment_date);
			expiration_date = moment(expiration_date);
			//next_payment_date.add({days : 45}); //=== need to uncomment
			if( package_frequency =='month' ){
				//next_payment_date.add({days : 1});
				next_payment_date.add({months : 1, days : 15});
			}else{
				next_payment_date.add({months : package_duration, days : 15});
			}
			
			
			expiration_date.add({ days : 15, months : package_duration });
			next_payment_date = new Date( moment(next_payment_date).format() ).toISOString();
			expiration_date = new Date( moment(expiration_date).format() ).toISOString();
			if( package_frequency == 'year' ){
				var referralDiscount = ( subscriptionProcessData.subscriptionAmount) / package_duration ;
				//referralDiscount = Math.round(referralDiscount * 100 )/100;
				referralDiscount = roundToTwo(referralDiscount );
				var payableAmount = subscriptionProcessData.subscriptionAmount - referralDiscount;
				//payableAmount = Math.round(payableAmount * 100 )/100;
				payableAmount = roundToTwo(payableAmount );
				
				//========================================//
				client.payment.create({
					amount : payableAmount * 100,
					description : subscriptionProcessData.subscription_package_name,
					customer : simplify_id,
					currency : "AUD"
				}, function(errData, data){
					if(errData){
						console.error("Error Message: " + errData.data);
						console.log(' Ads package payment issue');
						var responseData = { 
							'status' : 'error',
							'data' : ''
						};
						resolve(responseData);
					}else{
				//console.log("Payment Status: " + data.paymentStatus);
				var paymentStatus =  data.paymentStatus;
				var paymentId =  data.id;
				var transactionData =  data.transactionData;
				var order_Amount =  data.transactionData.amount;
				var currency =  data.transactionData.currency;
				var description =  data.transactionData.description;
				var date = new Date().toISOString();
				var expiration_date = new Date().toISOString();
				var next_payment_date = new Date().toISOString();
				//due_date =  moment(date).format("DD MMM YYYY");
				next_payment_date = moment(next_payment_date);
				expiration_date = moment(expiration_date);
				if( package_frequency =='month' ){
					//next_payment_date.add({days : 1});
					next_payment_date.add({months : 1, days : 15});
				}else{
					next_payment_date.add({months : package_duration, days : 15});
				}
				expiration_date.add({ days : 15, months : package_duration });
				next_payment_date = new Date( moment(next_payment_date).format() ).toISOString();
				expiration_date = new Date( moment(expiration_date).format() ).toISOString();
				mongoose.connect(url, function(err, db){
					db.collection('subscriptions').insertOne({ paymentStatus : paymentStatus, paymentId : paymentId, package_Amount : package_amount, package_fullamount : package_fullamount, package_final_amount : subscriptionProcessData.subscriptionAmount, product_quantity : product_quantity, GST : subscriptionProcessData.package_GST, order_Amount : payableAmount * 100, currency : 'AUD', description : subscriptionProcessData.subscription_package_name, number_of_ads : number_of_ads, package_duration : package_duration,  user_id : user_id, last_name: last_name, first_name: first_name  ,order_date : new Date().toISOString(),  business_category_name : business_category_name, airtable_id: airtable_id, arirtable_number : arirtable_number, phone : phone,  email : email, card_type : card_type, card_charges : subscriptionProcessData.card_charges, zipCode : zipCode, state : state, city : city, streetName : streetName , invoice_number : invoice_number, invoive_display : invoicenameString, status : 1,subscription_number : subscription_number, expiration_date : expiration_date, next_payment_date :next_payment_date, invoice_count : 1, free_months : 1, AvaiableFreeMonths : 0, csa_id : csa_id, subscriptionDiscount : 0, referral_purchase : 1, discount_purchase : 0, coupon_details : '', subscription_id : subscription_id, trading_name : trading_name, simplify_id : simplify_id, business_name : business_name, uploadedAds : [], mobile : mobile, postal_address : postal_address, billing_address : billing_address, yearCount : 1, ABN : ABN, package_frequency : package_frequency ,_location : _location ,location_city1 : location_city1}, function(errr, response){
						console.log('Ads  data stored'); 
					}); 
					
					var invoice_status = '';
					if( paymentStatus == 'APPROVED' ){
						invoice_status = 1;
							
					}else{
						invoice_status = 0;
					} 
					
					//var packageGST = ( order_Amount/100 ) * 1/11; 
					//	packageGST = Math.round(packageGST * 100 )/100;
					var referral_code = req.body.referral_code;
					//var ref_email = req.cookies.referral_code_email;
					var ref_email = req.cookies.referral_code_email;
					db.collection('referral_purchase').insertOne({ subscriptionID : response.insertedId, purchase_date : new Date().toISOString(), subscription_id : subscription_id, user_id : user_id , last_name: last_name, first_name: first_name ,referral_subscription_id : new ObjectId( referral_code ), status : 1 }, function(errrr, resposeReferral1){
						console.log( resposeReferral1 );
						if( errrr ) throw errrr;
						
					db.collection('subscriptions').updateOne({ _id : ObjectId( referral_code )}, {$inc : {AvaiableFreeMonths : 1}}, function(errrr, responseSubUpdate){
						if( errrr ) throw errrr;
						console.log('AvaiableFreeMonths count updated');
					});
						
					//================== referral mail for old subscription =================//		
					var Referralformated_message = "<div style='max-width: 600px; margin: auto;'>Congratulations ,</p><p> Thanks for being part of GoLocal Page and participating in our referral program.As a reward, your first monthly Screen Ad will be free - you don’t have to do anything!Remember you can refer friends, family and associates and receive up to 6 months FREE! We've created a unique referral link just for you so you can share with others and be seen on GoLocal Page. Login to My account http://cp.golocalpage.com.au:8081/referral to start sharing.</p><p>If you have any questions let know.</p><p>Thank you </p><p> Harry</p></div>";
					var mailOptions1 = {
						from: 'testmidriff@gmail.com',
						to: ref_email,
						subject: 'GoLocal Page - Congratulations you have received 1 month FREE',
						html: Referralformated_message,
					};
					transporter.sendMail(mailOptions1, function(error, info){
						if (error) {
							console.log(error);
						} else {
							console.log('Email sent: ' + info.response);
						} 
					});
				//==================== referral mail for new subscription =================//		
				var Referralformated_message = "<div style='max-width: 600px; margin: auto;'>Congratulations ,</p><p> Thanks for being part of GoLocal Page and participating in our referral program.As a reward, your first monthly Screen Ad will be free - you don’t have to do anything!Remember you can refer friends, family and associates and receive up to 6 months FREE! We've created a unique referral link just for you so you can share with others and be seen on GoLocal Page. Login to My account http://cp.golocalpage.com.au:8081/referral to start sharing.</p><p>If you have any questions let know.</p><p>Thank you </p><p> Harry</p></div>";
				var mailOptions1 = {
					from: 'testmidriff@gmail.com',
					to: email,
					subject: 'GoLocal Page - Congratulations you have received 1 month FREE',
					html: Referralformated_message,
				};
				transporter.sendMail(mailOptions1, function(error, info){
					if (error) {
						console.log(error);
					} else {
						console.log('Email sent: ' + info.response);
					} 
				});

				//=====================================//
				});	
					
					
					
					db.collection('invoices').insertOne({ type : 'subscription',paymentStatus : paymentStatus, paymentId : paymentId, package_Amount : package_amount, package_fullamount : package_fullamount, product_quantity : product_quantity , GST : subscriptionProcessData.package_GST, order_Amount : order_Amount, currency : currency, description : description, number_of_ads : number_of_ads, package_duration : package_duration,  user_id : user_id, last_name: last_name, first_name: first_name, invoice_date : new Date().toISOString(),  business_category_name : business_category_name, airtable_id: airtable_id, arirtable_number : arirtable_number, phone : phone,  email : email, card_type : card_type, card_charges : subscriptionProcessData.card_charges, zipCode : zipCode, state : state, city : city, streetName : streetName, invoice_number : invoice_number, invoive_display : invoicenameString, subscription_number : subscription_number, invoice_status : invoice_status, due_date: new Date().toISOString(), referral_purchase : 1, discount_purchase : 0, next_payment_date :next_payment_date, csa_id : csa_id, subscription_id : subscription_id, trading_name : trading_name, simplify_id : simplify_id, business_name : business_name, coupon_details : subscriptionProcessData.coupon_details, mobile : mobile, postal_address : postal_address, billing_address : billing_address, ABN : ABN, package_frequency : package_frequency }, function(errr, response){
						console.log('design invoice stored');
					});
				}); 
				var responseData = {
					'status' : 'success',
					'data' : data,
					'subscription_id' : subscription_id
				};
				resolve(responseData);
				} 
			})
			//========================================//
				
			}else{
			//================//
			mongoose.connect(url, function(err, db){
				db.collection('subscriptions').insertOne({ paymentStatus : 'FREE', paymentId : '', package_Amount : package_amount, package_fullamount : package_fullamount, package_final_amount : subscriptionProcessData.subscriptionAmount, product_quantity : product_quantity, GST : subscriptionProcessData.package_GST, order_Amount : 0, currency : 'AUD', description : subscriptionProcessData.subscription_package_name, number_of_ads : number_of_ads, package_duration : package_duration,  user_id : user_id, last_name: last_name, first_name: first_name  ,order_date : new Date().toISOString(),  business_category_name : business_category_name, airtable_id: airtable_id, arirtable_number : arirtable_number, phone : phone,  email : email, card_type : card_type, card_charges : subscriptionProcessData.card_charges, zipCode : zipCode, state : state, city : city, streetName : streetName , invoice_number : invoice_number, invoive_display : invoicenameString, status : 1,subscription_number : subscription_number, expiration_date : expiration_date, next_payment_date :next_payment_date, invoice_count : 2, free_months : 1, AvaiableFreeMonths : 0, csa_id : csa_id, subscriptionDiscount : 0, referral_purchase : 1, discount_purchase : 0, coupon_details : '', subscription_id : subscription_id, trading_name : trading_name, simplify_id : simplify_id, business_name : business_name, uploadedAds : [], mobile : mobile, postal_address : postal_address, billing_address : billing_address, yearCount : 1, ABN : ABN, package_frequency : package_frequency ,_location : _location ,location_city1 : location_city1}, function(errr, response){ 
				console.log('Ads Data stored'); 
				console.log('data stord in subscriptions table ');
				var referral_code = req.body.referral_code;
				//var ref_email = req.cookies.referral_code_email;
				var ref_email = req.cookies.referral_code_email;
					db.collection('referral_purchase').insertOne({ subscriptionID : response.insertedId, purchase_date : new Date().toISOString(), subscription_id : subscription_id, user_id : user_id , last_name: last_name, first_name: first_name ,referral_subscription_id : new ObjectId( referral_code ), status : 1 }, function(errrr, resposeReferral1){
						console.log( resposeReferral1 );
						if( errrr ) throw errrr;
						
					db.collection('subscriptions').updateOne({ _id : ObjectId( referral_code )}, {$inc : {AvaiableFreeMonths : 1}}, function(errrr, responseSubUpdate){
						if( errrr ) throw errrr;
						console.log('AvaiableFreeMonths count updated');
					});
						
				//================== referral mail for old subscription =================//		
				var Referralformated_message = "<div style='max-width: 600px; margin: auto;'>Congratulations ,</p><p> Thanks for being part of GoLocal Page and participating in our referral program.As a reward, your first monthly Screen Ad will be free - you don’t have to do anything!Remember you can refer friends, family and associates and receive up to 6 months FREE! We've created a unique referral link just for you so you can share with others and be seen on GoLocal Page. Login to My account http://cp.golocalpage.com.au:8081/referral to start sharing.</p><p>If you have any questions let know.</p><p>Thank you </p><p> Harry</p></div>";
				var mailOptions1 = {
					from: 'testmidriff@gmail.com',
					to: ref_email,
					subject: 'GoLocal Page - Congratulations you have received 1 month FREE',
					html: Referralformated_message,
				};
				transporter.sendMail(mailOptions1, function(error, info){
					if (error) {
						console.log(error);
					} else {
						console.log('Email sent: ' + info.response);
					} 
				});
				//==================== referral mail for new subscription =================//		
				var Referralformated_message = "<div style='max-width: 600px; margin: auto;'>Congratulations ,</p><p> Thanks for being part of GoLocal Page and participating in our referral program.As a reward, your first monthly Screen Ad will be free - you don’t have to do anything!Remember you can refer friends, family and associates and receive up to 6 months FREE! We've created a unique referral link just for you so you can share with others and be seen on GoLocal Page. Login to My account http://cp.golocalpage.com.au:8081/referral to start sharing.</p><p>If you have any questions let know.</p><p>Thank you </p><p> Harry</p></div>";
				var mailOptions1 = {
					from: 'testmidriff@gmail.com',
					to: email,
					subject: 'GoLocal Page - Congratulations you have received 1 month FREE',
					html: Referralformated_message,
				};
				transporter.sendMail(mailOptions1, function(error, info){
					if (error) {
						console.log(error);
					} else {
						console.log('Email sent: ' + info.response);
					} 
				});

				//=====================================//
				});	
				var invoice_status = '';
				invoice_status = 1;
				db.collection('invoices').insertOne({ type : 'subscription',paymentStatus : 'FREE', paymentId : '', package_Amount : package_amount, package_fullamount : package_fullamount, product_quantity : product_quantity , GST : subscriptionProcessData.package_GST, order_Amount : 0, currency : 'AUD', description : subscriptionProcessData.subscription_package_name, number_of_ads : number_of_ads, package_duration : package_duration,  user_id : user_id, last_name: last_name, first_name: first_name, invoice_date : new Date().toISOString(),  business_category_name : business_category_name, airtable_id: airtable_id, arirtable_number : arirtable_number, phone : phone,  email : email, card_type : card_type, card_charges : subscriptionProcessData.card_charges, zipCode : zipCode, state : state, city : city, streetName : streetName, invoice_number : invoice_number, invoive_display : invoicenameString, subscription_number : subscription_number, invoice_status : invoice_status, due_date: new Date().toISOString(), referral_purchase : 1, discount_purchase : 0, next_payment_date :next_payment_date, csa_id : csa_id, coupon_details : '', subscription_id : subscription_id, trading_name : trading_name, simplify_id : simplify_id, business_name : business_name, mobile : mobile , postal_address : postal_address, billing_address : billing_address, ABN : ABN, package_frequency : package_frequency}, function(errr, subResponse){
					console.log('REFERRAL invoice stored');
					//====================//
					var up_next_payment_date = next_payment_date;
					up_next_payment_date = moment(up_next_payment_date);
					//up_next_payment_date.add({ months : 1 }); //=== need to uncomment
					//up_next_payment_date.add({ days : 1 });
					if( package_frequency =='month' ){
						//next_payment_date.add({days : 1});
						up_next_payment_date.add({ months : 1 });
					}else{
						up_next_payment_date.add({ months : package_duration });
					}
					
					
					upinvoice_number = invoice_number + 1;
					upinvoicenameString = invoicenameString1 +''+ upinvoice_number;
					up_next_payment_date = new Date( moment(up_next_payment_date).format()).toISOString();
					
					db.collection('invoices').insertOne({ type : 'subscription',paymentStatus : 'UPCOMING', paymentId : '', package_Amount : package_amount, package_fullamount : package_fullamount,  product_quantity : product_quantity , GST : subscriptionProcessData.package_GST, order_Amount : subscriptionProcessData.subscriptionAmount * 100, currency : 'AUD', description : subscriptionProcessData.subscription_package_name, number_of_ads : number_of_ads, package_duration : package_duration,  user_id : user_id, last_name: last_name, first_name: first_name, invoice_date : new Date().toISOString(),  business_category_name : business_category_name, airtable_id: airtable_id, arirtable_number : arirtable_number, phone : phone,  email : email, card_type : card_type, card_charges : subscriptionProcessData.card_charges, zipCode : zipCode, state : state, city : city, streetName : streetName, invoice_number : upinvoice_number, invoive_display : upinvoicenameString, subscription_number : subscription_number, invoice_status : 0, due_date: next_payment_date, referral_purchase : 0, discount_purchase : 0, next_payment_date : up_next_payment_date, subscription_id : subscription_id, trading_name : trading_name, simplify_id : simplify_id, up_next_invoice_create : 0, business_name : business_name , mobile : mobile, postal_address : postal_address, billing_address : billing_address, ABN : ABN, package_frequency : package_frequency}, function(errr, response){
							console.log('REFERRAL Invoice stored');
					});
					//====================//
				});
				//=========================== REFERRAL PAYMENT TWO INVOICES ================================//
			});
			//=======================//
			var responseData = {
				'status' : 'success',
				'data' : 'FREE',
				'subscription_id' : subscription_id
			};
			resolve(responseData);
			//======================//
			});
			//=================//	
			}
		});
	}
	async function createNormalSubscription( subscriptionProcessData ){
		
		var userData = await getUserDate();
		var simplify_id = userData.simplify_id;
		var business_category_name = userData.business_category_name;
		var first_name = userData.first_name;
		var last_name = userData.last_name;
		var phone = userData.phone;
		var mobile = userData.mobile;
		var email = userData.email;
		var streetName = userData.streetName;
		var city = userData.city;
		var state = userData.state;
		var zipCode = userData.zipCode;
		var airtable_id = userData.airtable_id;
		var arirtable_number = userData.arirtable_number;
		var card_type = userData.type;
		var business_name = userData.business_name;
		var trading_name = userData.trading_name;
		var billing_address = userData.billing_address;
		var postal_address = userData.postal_address;
		var ABN = userData.ABN;
		
		var subscription_number = await getNextSubacriptionNumber();
		subscription_number = subscription_number + 1;
		var invoice_number = await getNextInvoiceNumber();
		invoice_number = invoice_number + 1;
		businessnamearray = trading_name.split(' ');
		var businessnamearray1 =[];
		var invoicenameString = '';
		var invoicenameString1 = '';
		if( businessnamearray.length > 0 ){
		for(var i =0; i< businessnamearray.length; i++ ){
			var name = 	businessnamearray[i];
			if( name !='' ){
				businessnamearray1.push(name);
				//businessnamearray1.push( name.substr(0, 3));
			}
		}
			invoicenameString = businessnamearray1.join('');
			invoicenameString1 = businessnamearray1.join('');
		}
		invoicenameString = invoicenameString +''+ invoice_number;
		var subscription_id = "C9-"+subscription_number;
		return new Promise(function(resolve, reject) {
			client.payment.create({
				amount : subscriptionProcessData.subscriptionAmount * 100,
				description : subscriptionProcessData.subscription_package_name,
				customer : simplify_id,
				currency : "AUD"
			}, function(errData, data){
			if(errData){
				console.error("Error Message: " + errData.data);
				console.log(' Ads package payment issue');
				var responseData = { 
					'status' : 'error',
					'data' : ''
				};
				resolve(responseData);
			}else{
			//console.log("Payment Status: " + data.paymentStatus);
			var paymentStatus =  data.paymentStatus;
			var paymentId =  data.id;
			var transactionData =  data.transactionData;
			var order_Amount =  data.transactionData.amount;
			var currency =  data.transactionData.currency;
			var description =  data.transactionData.description;
			var date = new Date().toISOString();
			var expiration_date = new Date().toISOString();
			var next_payment_date = new Date().toISOString();
			//due_date =  moment(date).format("DD MMM YYYY");
			next_payment_date = moment(next_payment_date);
			if( package_frequency =='month' ){
				//next_payment_date.add({days : 1});
				next_payment_date.add({months : 1, days : 15});
			}else{
				next_payment_date.add({months : package_duration, days : 15});
			}
			expiration_date = moment(expiration_date);
			expiration_date.add({ days : 15, months : package_duration });
			next_payment_date = new Date( moment(next_payment_date).format() ).toISOString();
			expiration_date = new Date( moment(expiration_date).format() ).toISOString();
			
			mongoose.connect(url, function(err, db){
				db.collection('subscriptions').insertOne({ paymentStatus : paymentStatus, paymentId : paymentId, package_Amount : package_amount, package_fullamount : package_fullamount, product_quantity : product_quantity, GST : subscriptionProcessData.package_GST, package_final_amount : order_Amount / 100, order_Amount : order_Amount, currency : currency, description : description, number_of_ads : number_of_ads, package_duration : package_duration,  user_id : user_id, last_name: last_name, first_name: first_name  ,order_date : new Date().toISOString(),  business_category_name : business_category_name, airtable_id: airtable_id, arirtable_number : arirtable_number, phone : phone,  email : email, card_type : card_type, card_charges : subscriptionProcessData.card_charges, zipCode : zipCode, state : state, city : city, streetName : streetName , invoice_number : invoice_number, invoive_display : invoicenameString, status : 1,subscription_number : subscription_number, expiration_date : expiration_date, next_payment_date :next_payment_date, invoice_count : 1, free_months : 0 , referral_purchase : 0, discount_purchase : 0, csa_id : csa_id, AvaiableFreeMonths : 0, subscription_id : subscription_id, trading_name : trading_name, simplify_id : simplify_id, business_name : business_name, uploadedAds : [], mobile : mobile, postal_address : postal_address, billing_address : billing_address, yearCount : 1, ABN : ABN, package_frequency : package_frequency, _location : _location ,location_city1 : location_city1}, function(errr, response){
					console.log('design data stored'); 
				});
				var invoice_status = '';
				if( paymentStatus == 'APPROVED' ){
					invoice_status = 1;
						
				}else{
					invoice_status = 0;
				}
				
				db.collection('invoices').insertOne({ type : 'subscription',paymentStatus : paymentStatus, paymentId : paymentId, package_Amount : package_amount, package_fullamount : package_fullamount, product_quantity : product_quantity , GST : subscriptionProcessData.package_GST, order_Amount : order_Amount, currency : currency, description : description, number_of_ads : number_of_ads, package_duration : package_duration,  user_id : user_id, last_name: last_name, first_name: first_name, invoice_date : new Date().toISOString(),  business_category_name : business_category_name, airtable_id: airtable_id, arirtable_number : arirtable_number, phone : phone,  email : email, card_type : card_type, card_charges : subscriptionProcessData.card_charges, zipCode : zipCode, state : state, city : city, streetName : streetName, invoice_number : invoice_number, invoive_display : invoicenameString, subscription_number : subscription_number, invoice_status : invoice_status, due_date: new Date().toISOString(), referral_purchase : 0, discount_purchase : 0, next_payment_date :next_payment_date, csa_id : csa_id, subscription_id : subscription_id, trading_name : trading_name, simplify_id : simplify_id, business_name : business_name , mobile : mobile, postal_address : postal_address, billing_address : billing_address, ABN : ABN, package_frequency : package_frequency }, function(errr, response){
					console.log('design invoice stored');
				});
			}); 
			var responseData = {
				'status' : 'success',
				'data' : data,
				'subscription_id' : subscription_id
			};
			resolve(responseData);
			//res.end();
		}
		})
		});
	}
	async function createDISCOUNTSubscription( subscriptionProcessData ){
		var userData = await getUserDate();
		var simplify_id = userData.simplify_id;
		var business_category_name = userData.business_category_name;
		var first_name = userData.first_name;
		var last_name = userData.last_name;
		var phone = userData.phone;
		var mobile = userData.mobile;
		var email = userData.email;
		var streetName = userData.streetName;
		var city = userData.city;
		var state = userData.state;
		var zipCode = userData.zipCode;
		var airtable_id = userData.airtable_id;
		var arirtable_number = userData.arirtable_number;
		var card_type = userData.type;
		var business_name = userData.business_name;
		var trading_name = userData.trading_name;
		var billing_address = userData.billing_address;
		var postal_address = userData.postal_address;
		var ABN = userData.ABN;
		
		var subscription_number = await getNextSubacriptionNumber();
		subscription_number = subscription_number + 1;
		var invoice_number = await getNextInvoiceNumber();
		invoice_number = invoice_number + 1;
		businessnamearray = trading_name.split(' ');
		var businessnamearray1 =[];
		var invoicenameString = '';
		var invoicenameString1 = '';
		if( businessnamearray.length > 0 ){
		for(var i =0; i< businessnamearray.length; i++ ){
			var name = 	businessnamearray[i];
			if( name !='' ){
				businessnamearray1.push(name);
				//businessnamearray1.push( name.substr(0, 3));
			}
		}
			invoicenameString = businessnamearray1.join('');
			invoicenameString1 = businessnamearray1.join('');
		}
		invoicenameString = invoicenameString +''+ invoice_number;
		var subscription_id = "C9-"+subscription_number;
		return new Promise(function(resolve, reject) {
			client.payment.create({
				amount : subscriptionProcessData.subscriptionDiscountAmount * 100,
				description : subscriptionProcessData.subscription_package_name,
				customer : simplify_id,
				currency : "AUD"
			}, function(errData, data){
			if(errData){
				console.error("Error Message: " + errData.data);
				console.log(' Ads package payment issue');
				var responseData = { 
					'status' : 'error',
					'data' : ''
				};
				resolve(responseData);
			}else{
			//console.log("Payment Status: " + data.paymentStatus);
			var paymentStatus =  data.paymentStatus;
			var paymentId =  data.id;
			var transactionData =  data.transactionData;
			var order_Amount =  data.transactionData.amount;
			var currency =  data.transactionData.currency;
			var description =  data.transactionData.description;
			var date = new Date().toISOString();
			var expiration_date = new Date().toISOString();
			var next_payment_date = new Date().toISOString();
			//due_date =  moment(date).format("DD MMM YYYY");
			next_payment_date = moment(next_payment_date);
			expiration_date = moment(expiration_date);
			if( package_frequency =='month' ){
				//next_payment_date.add({days : 1});
				next_payment_date.add({months : 1, days : 15});
			}else{
				next_payment_date.add({months : package_duration, days : 15});
			}
			expiration_date.add({ days : 15, months : package_duration });
			next_payment_date = new Date( moment(next_payment_date).format() ).toISOString();
			expiration_date = new Date( moment(expiration_date).format() ).toISOString();
			mongoose.connect(url, function(err, db){
				db.collection('subscriptions').insertOne({ paymentStatus : paymentStatus, paymentId : paymentId, package_Amount : package_amount, package_fullamount : package_fullamount, product_quantity : product_quantity, GST : subscriptionProcessData.package_GST, order_Amount : order_Amount, currency : currency, description : description, subscriptionAmount : subscriptionProcessData.subscriptionAmount,  subscriptionDiscountAmount : subscriptionProcessData.subscriptionDiscountAmount, number_of_ads : number_of_ads, package_duration : package_duration,  user_id : user_id, last_name: last_name, first_name: first_name  ,order_date : new Date().toISOString(),  business_category_name : business_category_name, airtable_id: airtable_id, arirtable_number : arirtable_number, phone : phone,  email : email, card_type : card_type, card_charges : subscriptionProcessData.card_charges, zipCode : zipCode, state : state, city : city, streetName : streetName , invoice_number : invoice_number, invoive_display : invoicenameString, status : 1, subscription_number : subscription_number, expiration_date : expiration_date, next_payment_date :next_payment_date, referral_purchase : 0, invoice_count : 1, free_months : 1, csa_id : csa_id, AvaiableFreeMonths : Number(subscriptionProcessData.couponnumTimesApplied) - 1,  discount_purchase : 1, subscription_id : subscription_id, trading_name : trading_name, simplify_id : simplify_id, business_name : business_name, uploadedAds : [], coupon_details : subscriptionProcessData.coupon_details , mobile : mobile , postal_address : postal_address, billing_address : billing_address, yearCount : 1, ABN : ABN, package_frequency : package_frequency, _location : _location ,location_city1 : location_city1}, function(errr, response){
					console.log('Ads  data stored'); 
				}); 
				
				var invoice_status = '';
				if( paymentStatus == 'APPROVED' ){
					invoice_status = 1;
						
				}else{
					invoice_status = 0;
				} 
				 
				db.collection('invoices').insertOne({ type : 'subscription',paymentStatus : paymentStatus, paymentId : paymentId, package_Amount : package_amount, package_fullamount : package_fullamount, product_quantity : product_quantity , GST : subscriptionProcessData.package_GST, order_Amount : order_Amount, currency : currency, description : description, number_of_ads : number_of_ads, package_duration : package_duration,  user_id : user_id, last_name: last_name, first_name: first_name, invoice_date : new Date().toISOString(),  business_category_name : business_category_name, airtable_id: airtable_id, arirtable_number : arirtable_number, phone : phone,  email : email, card_type : card_type, card_charges : subscriptionProcessData.card_charges, zipCode : zipCode, state : state, city : city, streetName : streetName, invoice_number : invoice_number, invoive_display : invoicenameString, subscription_number : subscription_number, invoice_status : invoice_status, due_date: new Date().toISOString(), referral_purchase : 0, discount_purchase : 1, next_payment_date :next_payment_date, csa_id : csa_id, subscription_id : subscription_id, trading_name : trading_name, simplify_id : simplify_id, business_name : business_name, coupon_details : subscriptionProcessData.coupon_details, mobile : mobile, postal_address : postal_address, billing_address : billing_address, ABN : ABN, package_frequency : package_frequency }, function(errr, response){
					console.log('design invoice stored');
				});
			}); 
			var responseData = {
				'status' : 'success',
				'data' : data,
				'subscription_id' : subscription_id
			};
			resolve(responseData);
			//res.end();
		}
		})
		});
	} 
	async function createFREESubscription( subscriptionProcessData ){
		var userData = await getUserDate();
		var simplify_id = userData.simplify_id;
		var business_category_name = userData.business_category_name;
		var first_name = userData.first_name;
		var last_name = userData.last_name;
		var phone = userData.phone;
		var mobile = userData.mobile;
		var email = userData.email;
		var streetName = userData.streetName;
		var city = userData.city;
		var state = userData.state;
		var zipCode = userData.zipCode;
		var airtable_id = userData.airtable_id;
		var arirtable_number = userData.arirtable_number;
		var card_type = userData.type;
		var business_name = userData.business_name;
		var trading_name = userData.trading_name;
		var billing_address = userData.billing_address;
		var postal_address = userData.postal_address;
		var ABN = userData.ABN;
		
		var subscription_number = await getNextSubacriptionNumber();
		subscription_number = subscription_number + 1;
		var invoice_number = await getNextInvoiceNumber();
		invoice_number = invoice_number + 1;
		businessnamearray = trading_name.split(' ');
		var businessnamearray1 =[];
		var invoicenameString = '';
		var invoicenameString1 = '';
		if( businessnamearray.length > 0 ){
		for(var i =0; i< businessnamearray.length; i++ ){
			var name = 	businessnamearray[i];
			if( name !='' ){
				businessnamearray1.push(name);
				//businessnamearray1.push( name.substr(0, 3));
			}
		}
			invoicenameString = businessnamearray1.join('');
			invoicenameString1 = businessnamearray1.join('');
		}
		invoicenameString = invoicenameString +''+ invoice_number;
		var subscription_id = "C9-"+subscription_number;
		
		return new Promise( function(resolve, reject) {
			var date = new Date().toISOString();
			var expiration_date = new Date().toISOString();
			var next_payment_date = new Date().toISOString();
			//due_date =  moment(date).format("DD MMM YYYY");
			next_payment_date = moment(next_payment_date);
			expiration_date = moment(expiration_date);
			if( package_frequency =='month' ){
				//next_payment_date.add({days : 1});
				next_payment_date.add({months : 1, days : 15});
			}else{
				next_payment_date.add({months : package_duration, days : 15});
			}
			expiration_date.add({ days : 15, months : package_duration });
			next_payment_date = new Date( moment(next_payment_date).format() ).toISOString();
			expiration_date = new Date( moment(expiration_date).format() ).toISOString();
			
		//================//
			mongoose.connect(url, function(err, db){
				db.collection('subscriptions').insertOne({ paymentStatus : 'FREE', paymentId : '', package_Amount : package_amount, package_fullamount : package_fullamount,  package_final_amount : subscriptionProcessData.subscriptionAmount, product_quantity : product_quantity, GST : subscriptionProcessData.package_GST, order_Amount : 0, currency : 'AUD', description : subscriptionProcessData.subscription_package_name, number_of_ads : number_of_ads, package_duration : package_duration,  user_id : user_id, last_name: last_name, first_name: first_name  ,order_date : new Date().toISOString(),  business_category_name : business_category_name, airtable_id: airtable_id, arirtable_number : arirtable_number, phone : phone,  email : email, card_type : card_type, card_charges : subscriptionProcessData.card_charges, zipCode : zipCode, state : state, city : city, streetName : streetName , invoice_number : invoice_number, invoive_display : invoicenameString, status : 1, referral_purchase : 0, subscription_number : subscription_number, expiration_date : expiration_date, next_payment_date :next_payment_date, invoice_count : 2, free_months : 1, AvaiableFreeMonths : Number(subscriptionProcessData.couponnumTimesApplied) - 1 , csa_id : csa_id, subscriptionDiscount : 0, coupon_details : '', subscription_id : subscription_id, trading_name : trading_name, simplify_id : simplify_id, business_name : business_name, uploadedAds : [], coupon_details : subscriptionProcessData.coupon_details, mobile : mobile , postal_address : postal_address, billing_address : billing_address, yearCount : 1, ABN : ABN, package_frequency : package_frequency, _location : _location ,location_city1 : location_city1, discount_purchase : 1}, function(errr, response){
				console.log('Ads Data stored'); 
				
				var invoice_status = '';
				invoice_status = 1;
				db.collection('invoices').insertOne({ type : 'subscription',paymentStatus : 'FREE', paymentId : '', package_Amount : package_amount, package_fullamount: package_fullamount, product_quantity : product_quantity , GST : subscriptionProcessData.package_GST, order_Amount : 0, currency : 'AUD', description : subscriptionProcessData.subscription_package_name, number_of_ads : number_of_ads, package_duration : package_duration,  user_id : user_id, last_name: last_name, first_name: first_name, invoice_date : new Date().toISOString(),  business_category_name : business_category_name, airtable_id: airtable_id, arirtable_number : arirtable_number, phone : phone,  email : email, card_type : card_type, card_charges : subscriptionProcessData.card_charges, zipCode : zipCode, state : state, city : city, streetName : streetName, invoice_number : invoice_number, invoive_display : invoicenameString, subscription_number : subscription_number, invoice_status : invoice_status, due_date: new Date().toISOString(), referral_purchase : 0, discount_purchase : 1, next_payment_date :next_payment_date, csa_id : csa_id, coupon_details : '', subscription_id : subscription_id, trading_name : trading_name, simplify_id : simplify_id, business_name : business_name, coupon_details : subscriptionProcessData.coupon_details, mobile : mobile , postal_address : postal_address, billing_address : billing_address, ABN : ABN, package_frequency : package_frequency}, function(errr, subResponse){
					console.log('REFERRAL invoice stored');
					//====================//
					var up_next_payment_date = next_payment_date;
					up_next_payment_date = moment(up_next_payment_date);
					if( package_frequency =='month' ){
						//next_payment_date.add({days : 1});
						up_next_payment_date.add({ months : 1 });
					}else{
						up_next_payment_date.add({ months : package_duration });
					}
					
					upinvoice_number = invoice_number + 1;
					upinvoicenameString = invoicenameString1 +''+ upinvoice_number;
					up_next_payment_date = new Date( moment(up_next_payment_date).format()).toISOString();
					
					db.collection('invoices').insertOne({ type : 'subscription',paymentStatus : 'UPCOMING', paymentId : '', package_Amount : package_amount, package_fullamount : package_fullamount, product_quantity : product_quantity , GST : subscriptionProcessData.package_GST, order_Amount : subscriptionProcessData.subscriptionAmount * 100, currency : 'AUD', description : subscriptionProcessData.subscription_package_name, number_of_ads : number_of_ads, package_duration : package_duration,  user_id : user_id, last_name: last_name, first_name: first_name, invoice_date : new Date().toISOString(),  business_category_name : business_category_name, airtable_id: airtable_id, arirtable_number : arirtable_number, phone : phone,  email : email, card_type : card_type, card_charges : subscriptionProcessData.card_charges, zipCode : zipCode, state : state, city : city, streetName : streetName, invoice_number : upinvoice_number, invoive_display : upinvoicenameString, subscription_number : subscription_number, invoice_status : 0, due_date: next_payment_date, referral_purchase : 0, discount_purchase : 0, next_payment_date : up_next_payment_date, subscription_id : subscription_id, trading_name : trading_name, simplify_id : simplify_id, up_next_invoice_create : 0, business_name : business_name, mobile : mobile, postal_address : postal_address, billing_address : billing_address, ABN : ABN, package_frequency : package_frequency}, function(errr, response){
							console.log('REFERRAL Invoice stored');
					});
					//====================//
				});
				//=========================== REFERRAL PAYMENT TWO INVOICES ================================//
			});
			//=======================//
			var responseData = {
				'status' : 'success',
				'data' : 'FREE',
				'subscription_id' : subscription_id
			};
			resolve(responseData);
			//======================//
			});
			//=================//	
		});
	}

	//============ SUBSCRIPTION CREATION CODE ENDS HERE ===========//
	//====  FUNCTION TO CALL ALL PAYMENT FUNCTIONS ===========//
	async function checkPayments(){
		var userData = await getUserDate();
		var referralAvailable = await getReferralData();
		var unique_invoice_number = await getNextOrderNumber();
		var validCouponCode = req.body.validCouponCode;
		var coupon_details = req.body.coupon_details;
		unique_invoice_number = unique_invoice_number + 1;
		var trading_name = userData.trading_name;
		businessnamearray = trading_name.split(' ');
		var businessnamearray1 =[];
		var invoicenameString = '';
		if( businessnamearray.length > 0 ){
		for(var i =0; i< businessnamearray.length; i++ ){
			var name = 	businessnamearray[i];
			if( name !='' ){
				businessnamearray1.push(name);
				//businessnamearray1.push( name.substr(0, 3));
			}
		}
			invoicenameString = businessnamearray1.join('');
		}
		invoicenameString = invoicenameString +''+ unique_invoice_number;
		var simplify_id = userData.simplify_id;
		var business_category_name = userData.business_category_name;
		var first_name = userData.first_name;
		var last_name = userData.last_name;
		var phone = userData.phone;
		var email = userData.email;
		var streetName = userData.streetName;
		var city = userData.city;
		var state = userData.state;
		var zipCode = userData.zipCode;
		var airtable_id = userData.airtable_id;
		var arirtable_number = userData.arirtable_number;
		var card_type = userData.type;
		var business_category = userData.business_category;
		var business_category_name = userData.business_category_name;
		var business_name = userData.business_name;
		var postal_address = userData.postal_address;
		var billing_address = userData.billing_address;
		var ABN = userData.ABN;
		var mobile = userData.mobile;
		//var subscriptionFunctionStatus = {status : '', data : ''};
		var subscriptionFunctionStatus = [];
		var designPaymentStatus = {status : '', data : ''};
		var subscriptionIDS = [];
		var designPaymentID;
		var subscriptionPaymentIDS = [];
		var hasMatchSuccess;
		if(package_choosen == 1){
			//var package__total = package_amount;
			var package_GST =  package_amount * 10 / 100;
			//package_GST = package_GST.toFixed(2); 
			//package_GST = Number(package_GST);
			//package_GST = parseFloat(package_GST).toFixed(2);
			//package_GST = Math.round(package_GST * 100 )/100;
			package_GST = roundToTwo(package_GST);
			//package_GST = package_GST;
			
			
			//var package_subtotal = parseFloat(package_amount)  + parseFloat( package_GST ); 
			var package_subtotal = parseFloat( package_fullamount ); 
			//package_subtotal = package_subtotal.toFixed(2); 
			//package_subtotal = Number(package_subtotal);
			//package_subtotal = parseFloat(package_subtotal).toFixed(2);
			//package_subtotal = Math.round(package_subtotal * 100 )/100;
			package_subtotal = roundToTwo(package_subtotal);
			
			var card_charges = 0;
			if( card_type == 'AMERICAN_EXPRESS' ){ 
				card_charges = package_subtotal * 3.025 / 100;
				//card_charges = card_charges.toFixed(2); 
				//card_charges = Number(card_charges);
				//card_charges = parseFloat(card_charges).toFixed(2);
				//card_charges = Math.round(card_charges * 100 )/100;
				card_charges = roundToTwo(card_charges );
			}
			var subscriptionAmount = parseFloat(package_subtotal) + parseFloat( card_charges );
			//subscriptionAmount = subscriptionAmount.toFixed(2); 
			//subscriptionAmount = Number(subscriptionAmount);
			//subscriptionAmount = parseFloat(subscriptionAmount).toFixed(2);
			//subscriptionAmount = Math.round(subscriptionAmount * 100 )/100;
			subscriptionAmount = roundToTwo(subscriptionAmount);
			var subscription_package_name = "Screen Ad Package "+ package_duration +" Month Package";
			var subscriptionProcessData = { 'subscriptionAmount' : subscriptionAmount, 'subscription_package_name' : subscription_package_name, 'card_charges' : card_charges, 'package_GST' : package_GST };
			
			
			if( referralAvailable == 1 ){
				//===  CREATE REFERRAL PAYMENT SUBSCRIPTION
				for( var s_i = 0; s_i < product_quantity; s_i++ ){
					if( s_i == 0 ){ //== call referral subscription function
						var responseSUB = await createReferralSubscription( subscriptionProcessData );
						subscriptionFunctionStatus.push( responseSUB );
					}else{
						//=== call normal subscription function
						var responseSUB = await createNormalSubscription( subscriptionProcessData );
						subscriptionFunctionStatus.push( responseSUB );
					}
					
				}
			}else if( validCouponCode == 1 ){
				//=== CREATE DISCOUNTED SUBSCRIPTION
				var couponPercentOff = coupon_details.percentOff;
				var couponnumTimesApplied = coupon_details.numTimesApplied;
				for( var s_i = 0; s_i < product_quantity; s_i++ ){
					subscriptionProcessData.coupon_details = coupon_details;
					if( couponPercentOff == 100 ){ //== call referral subscription function
						
						var discountAmount = subscriptionAmount * couponPercentOff / 100;
						//discountAmount = discountAmount.toFixed(2); 
						//discountAmount = Number(discountAmount);
						//discountAmount = parseFloat(discountAmount).toFixed(2);
						//discountAmount = Math.round(discountAmount * 100 )/100;
						discountAmount = roundToTwo(discountAmount );
						
						var finalAmount = parseFloat(subscriptionAmount) - parseFloat( discountAmount );
						//finalAmount = finalAmount.toFixed(2); 
						//finalAmount = Number(finalAmount);
						//finalAmount = parseFloat(finalAmount).toFixed(2);
						//finalAmount = Math.round(finalAmount * 100 )/100;
						finalAmount = roundToTwo(finalAmount );
						
						subscriptionProcessData.subscriptionDiscountAmount = finalAmount;
						subscriptionProcessData.couponnumTimesApplied = couponnumTimesApplied;
						
						
						var responseSUB = await createFREESubscription( subscriptionProcessData );
						subscriptionFunctionStatus.push( responseSUB );
					}else{
						//=== call DISCOUNT subscription function
						var discountAmount = subscriptionAmount * couponPercentOff / 100;
						//discountAmount = discountAmount.toFixed(2); 
						//discountAmount = Number(discountAmount);
						//discountAmount = parseFloat(discountAmount).toFixed(2);
						//discountAmount = Math.round(discountAmount * 100 )/100;
						discountAmount = roundToTwo(discountAmount);
						var finalAmount = parseFloat(subscriptionAmount) - parseFloat(discountAmount);
						//finalAmount = finalAmount.toFixed(2); 
						//finalAmount = Number(finalAmount);
						//finalAmount = parseFloat(finalAmount).toFixed(2);
						//finalAmount = Math.round(finalAmount * 100 )/100;
						finalAmount = roundToTwo(finalAmount);
						subscriptionProcessData.subscriptionDiscountAmount = finalAmount;
						subscriptionProcessData.couponnumTimesApplied = couponnumTimesApplied;
						var responseSUB = await createDISCOUNTSubscription( subscriptionProcessData );
						subscriptionFunctionStatus.push( responseSUB ); 
					}
				}
			}else{
				//=== CREATE NORMAL SUBSCRIPTION
				for( var s_i = 0; s_i < product_quantity; s_i++ ){
					var responseSUB = await createNormalSubscription( subscriptionProcessData );
					subscriptionFunctionStatus.push( responseSUB ); 
				}
			}
			
			console.log('SUBSCRIPTIONS RESPONSE ARRAY');
			console.log( subscriptionFunctionStatus );
			
			hasMatchSuccess = 'error';
			for (var index = 0; index < subscriptionFunctionStatus.length; ++index) {
			var subscriptionFunction = subscriptionFunctionStatus[index];
			if( subscriptionFunction.data !='' && subscriptionFunction.data !='FREE' ){
				subscriptionIDS.push( subscriptionFunction.data.id );
			}
				subscriptionPaymentIDS.push( subscriptionFunction.subscription_id );
			if(subscriptionFunction.status == "success"){
				hasMatchSuccess = 'success';
				break;
			}
			}
		}
		if(addon_choosen == 1){
			 designPaymentStatus = await createDesignPayment();
			 //console.log( designPaymentStatus );
			 if( designPaymentStatus.data !='' && designPaymentStatus.data != undefined && designPaymentStatus.data != null ){
				designPaymentID = designPaymentStatus.data.id;
			}
		}
		
		if( (hasMatchSuccess == 'success' && hasMatchSuccess !='' && hasMatchSuccess !='error' ) ||  (designPaymentStatus.status == 'success' && designPaymentStatus.status !='' && designPaymentStatus.status !='error' ) ){
			console.log('Inside if conditions');
			var cart_ID = req.cookies.cart_store_id;
			res.clearCookie("cart_store_id");
			res.clearCookie("referral_code");
			res.clearCookie("referral_code_email");
			//===== Remove data from cart after purchase starts =====//
			mongoose.connect(url, function(err, db){
				db.collection('cart_meta').deleteOne({_id : new ObjectId(cart_ID)}, function(err, responseCart){
						if(err) throw err;
						if(responseCart){
							console.log('data removed from cart');
						}
				});
				if(csa_id !='' && csa_id != undefined && csa_id != null){
					db.collection('custom_sales_agreement').update({ _id : new ObjectId(csa_id) }, {$set: {status : 2}}, function(err, responseData){
						if(err) throw err;
						console.log('CSA status updated');
					});
				}
			}); 
			 
			//===== Remove data from cart after purchase ends =====//

			var formated_message = '<div style="max-width: 600px; margin: auto;"><p>Dear, '+ first_name +' '+ last_name +'</p> <p>Thank you for your purchase. We are processing your payment and will send you all the details within the next 24hr.</p><p>If you don’t hear from us, could you also check your junk mail folder as our emails may divert there. Alternatively feel free to contact me.</p> <br /><br /><p>Thank you,<br />Harry</p><p>07 3062 6983 | harry@golocalpage.com.au</p><p>PO Box 2477 Graceville East Queensland 4075 | <a href="https://www.golocalpage.com.au/">www.golocalpage.com.au</a></p><p>The information contained in this email, including all attachments, is confidential and may be legally privileged. If you have received this email by mistake, please inform us and destroy all copies of the original message. Do not make any use of this email. We do not waive any privilege, confidentiality or copyright associated with it.</p></div>';
	
			/****** FIRST MAIL ******/
				var mailOptions = {
						from: 'testmidriff@gmail.com',
						to: email,
						subject: 'GoLocal Page Confirmation',
						html: formated_message
					};
				transporter.sendMail(mailOptions, function(error, info){
				if (error) {
					console.log(error);
					
				} else {
					console.log('Email sent: ' + info.response);
					
					}
				});	
				mongoose.connect(url, function(err, db){
					db.collection('orders').insertOne({ subscriptionData: subscriptionFunctionStatus, designData :designPaymentStatus.data, designPaymentID: designPaymentID, subscriptionID: subscriptionIDS, subscriptionPaymentID : subscriptionPaymentIDS, package_Amount : package_amount, no_of_screens : product_quantity, package_duration : package_duration, _location : _location, location_city1: location_city1,    addon_duration : addon_duration, addon_amount : addon_amount, number_of_ads : number_of_ads,  user_id : user_id, last_name: last_name, first_name: first_name , order_date : new Date().toISOString(), business_category: business_category,   business_category_name : business_category_name, airtable_id: airtable_id, arirtable_number : arirtable_number, phone : phone,  email : email, referralAvailable : referralAvailable, validCouponCode : validCouponCode, coupon_details : coupon_details, unique_order_number : unique_invoice_number, order_number_string : invoicenameString, business_name: business_name ,trading_name : trading_name, card_type : card_type, zipCode : zipCode, state : state, city : city, streetName : streetName, postal_address : postal_address, billing_address : billing_address, ABN : ABN, mobile : mobile }, function(errrr, respose1){
						console.log( respose1 );
						if( errrr ) throw errrr; 
						res.send(invoicenameString);	
						res.end();						
				});
				});
		}else{
			res.send('error');
			res.end();
		} 
	}	
	checkPayments();
}); 
app.get('/add-custom-csa', DefaultParser, function(req, res){
	sess = req.session;
	userdata = sess.passport;
	console.log( userdata );
	//res.send( 'Welcome user' );
	//global.location_list;
	if( userdata ){
		if(userdata.role =='admin'){
			res.render('add-custom-csa', { page_title : 'csa' });
			res.end();
	}else{
		res.redirect('/');
		res.end();
	}	
	}else{
		res.redirect('/');
		res.end();
	}
});

app.get('/get-user-subscriptions', DefaultParser, function(req, res){
	sess = req.session;
	userdata = sess.passport;
	var user_id = userdata.user;
	var query = url1.parse( req.url, true ).query;
	var simplify_id = query.simplify_id;
	var max_val = query.max_val;
	mongoose.connect(url, function(err, db){
		db.collection('subscriptions').find({ user_id : user_id, status : 1 }).sort({_id : -1}).limit(parseInt( max_val)).toArray(function(err, response){
			if(err){ 
				throw err;
				res.send('error');
				res.end();
			}else{
				res.send(response);
				res.end();
			}
		})
	});
});

app.get('/getDesignPackages', DefaultParser, function(req, res){
	sess = req.session;
	userdata = sess.passport;
	var user_id = userdata.user;
	var query = url1.parse( req.url, true ).query;
	//var user_id = query.user_id;
	var max_val = query.max_val;
	//console.log( max_val );
	console.log( user_id );
	mongoose.connect(url, function(err, db){
		db.collection('designPurchase').find({ user_id : user_id }).limit(parseInt(max_val)).sort({_id : -1}).toArray(function(err, response){
			if(err){ 
				throw err;
				res.send('error');
				res.end();
			}else{
				res.send(response);
				res.end();
			}
		})
	});
});

app.get('/get-user-subscriptions-all', DefaultParser, function(req, res){
	sess = req.session;
	userdata = sess.passport;
	var user_id = userdata.user;
	//var query = url1.parse( req.url, true ).query;
	//var user_id = query.user_id;
	//var max_val = query.max_val;
	//console.log( max_val );
	console.log( user_id );
	mongoose.connect(url, function(err, db){
		//db.collection('subscriptions').find({ user_id : user_id }).sort({_id : -1}).toArray(function(err, response){
		db.collection('subscriptions').aggregate([{$match : { user_id : user_id }},{$lookup:{from: 'referral_purchase',  localField: "_id", foreignField: "referral_subscription_id",  as: "referral"  }}]).toArray(function(err, response){	
			if(err){ 
				throw err;
				res.send('error');
				res.end();
			}else{
				res.send(response);
				res.end();
			}
		})
	});
});


app.get('/my-subscriptions', DefaultParser, function(req, res){
	sess = req.session;
	userdata = sess.passport;
	console.log( userdata );
	if( userdata  && userdata.role =="user"){
		mongoose.connect( url, function( err, db ){
		db.collection('users').findOne({ _id : new ObjectId( userdata.user )}, function(err, rows){
			console.log( rows );
			res.render('user-all-subscriptions', { user__data : rows , page_title : 'my-subscriptions' });
			
			res.end();
		})
		})
	}else{
		res.redirect('/');
		res.end();
		
	}
});


app.get('/get-user-order', DefaultParser, function(req, res){
	console.log('Get User  Orders ==== ');
	sess = req.session;
	userdata = sess.passport;
	var user_id = userdata.user;
	var query = url1.parse( req.url, true ).query;
	var order_type = query.order_type;
	var max_val = query.max_val;
	
	mongoose.connect(url, function(err, db){
		db.collection('designPurchase').find({ user_id :  user_id ,order_type : order_type }).limit(parseInt(max_val)).sort( { _id : -1 } ).toArray(function(errr, response){
			if(errr) throw errr;
			console.log( response );
			res.send( response );
			
		})
	})	
});

app.get('/user-account', DefaultParser, function(req, res){
	sess = req.session;
	userdata = sess.passport;
	console.log( userdata );
	
	if( userdata  && userdata.role == 'user'){
		res.render('user-account', {user_id : userdata.user , page_title : 'user-account'});
		//res.end();
	}else{
		res.redirect('/');
	}	
	
});

app.post('/update_card_details', DefaultParser, function(req, res){
	var user_id = req.body.user_id;
	var card_holder_name = req.body.card_holder_name;
	var card_number = req.body.card_number;
	var card_expiry_month = req.body.card_expiry_month;
	var card_expiry_year = req.body.card_expiry_year;
	var card_cvc = req.body.card_cvc;
	var card_id = req.body.card_id;
	var simplify_id = req.body.simplify_id;
	var email = req.body.email;
	var year_last = card_expiry_year.toString().substr(2,2);
	var year_last_four = card_expiry_year.toString().substr(0,4);
	/* console.log(user_id);
	console.log(card_holder_name);
	console.log(card_number);
	console.log(card_expiry_month);
	console.log(card_expiry_year);
	console.log(card_cvc);
	console.log(simplify_id);
	console.log(email);
	console.log(year_last); */
	console.log(card_expiry_year.toString().substr(0,4));
	client.customer.update({
		id: simplify_id, // ID of object to update
		email : email,
		name : card_holder_name,
		card : {
			id : "",
			expMonth : card_expiry_month,
			expYear : year_last,
			cvc : card_cvc,
			number : card_number,
			name : card_holder_name
		},
	}, function(errData, data){
			if(errData){
				console.error("Error Message: " + errData.data.error.message);
				// handle the error
			}else{
				console.log("Success Response: " + JSON.stringify(data));
				var card_id = data.card.id;
				var type = data.card.type;
				var last4 = data.card.last4;
				var user_updated_data = {
					'card_last_4_digits' : last4,
					'type' : type,
					'name_on_card' : card_holder_name,
					'card_id' : card_id,
					'card_expiry_month' : parseInt(card_expiry_month),
					'card_expiry_year' : parseInt(year_last_four)
				}
				mongoose.connect( url, function( err, db ){ //===used to update values in database
				db.collection('users').update({_id :  new ObjectId( user_id )}, { $set : user_updated_data } ,function(errs, response){	
					if(err) throw err;
					if(response){
						console.log('user updated=====');
						res.send('updated');
						res.end();
					}else{
						res.send('error');
						res.end();
					}
				})
			})
	}
}); 
	
})


/* app.get('/set_cookies', function(req, res){
	res.cookie('testcookies', 'test 1234' );
	res.end();
	
}); */

/* app.get('/get_cookies', function(req, res){
	res.send( req.cookies.cart_store_id );
	res.end();
	
});
 */
app.get('/test-function', DefaultParser, function(req, res){
	/* const options = {
		method: 'POST',
		url: 'https://www.golocaldesigns.com/register-api',
		headers: {
				
		},
		body: {
			email : 'midriffdeveloper3@gmail.com',
			password : '123456789',
			design_limit : 3,
			package_no : 1,
			account_no : 15200, 
			full_name : 'Archana Midriff'
		},
		json: true  // JSON stringifies the body automatically
	};
	
	request(options).then(function (response) {
		// Handle success response data
		console.log( response );
	}).catch(function (err) {
		// Handle err response
		console.log( err );
	}); */
	
	
	
	/* request('https://www.golocaldesigns.com/register-api?email=midriff.dev10@gmail.com&password=123456&design_limit=3&package_no=1&account_no=1520&full_name=Archana', function (error, response, body) {
			if (!error && response.statusCode == 200) {
				console.log(body) // 
				userAgentInfo = body;
				var userAgentInfo = body;
				console.log( userAgentInfo);
				console.log( response);
			}else{
				console.log('Not connected');
				console.log( error );
				//console.log( response );
			}
		res.end();	
	}) */
  
 });  
app.get('/test-subscription', function(req, res){
/* client.subscription.create({
    amount : "5000",
    name : "Test Subscription for Coupon",
    frequency : "DAILY",
    customer : "g7RGzyXxL",
    frequencyPeriod : "1",
	coupon : "rkpjL7Aor"
}, function(errData, data){
 
    if(errData){
        console.error("Error Message: " + errData.data.error.message);
        // handle the error
        return;
    }
 
    console.log("Success Response: " + JSON.stringify(data));
	res.end();
}); */

}); 

app.get('/test', DefaultParser, function(req, res){ 
	var options = {
		phantomPath: __dirname + "/node_modules/phantomjs-prebuilt/bin/phantomjs"
	};
	//mongoose.connect(url, function(err, db){
		//db.collection('orders').findOne({ _id : new ObjectId('5bb780c09628fb7e1be36f4e')}, function(err, response){
			//if(err) throw err;
			//if(response != null && response !=''){
				//console.log(response);
				var html = fs.readFileSync('./invoice.ejs', 'utf8');
	var html1 = fs.readFileSync('./csa.ejs', 'utf8');
	pdf.create(html, options).toBuffer(function(err, buffer){
		console.log('This is a buffer:', Buffer.isBuffer(buffer));
		console.log( buffer );
		pdf.create(html1, options).toBuffer(function(err1, buffer1){
				//res.end();
		var mailOptions1 = {
		from: 'testmidriff@gmail.com',
		to: 'midriffdeveloper2@gmail.com',
		subject: 'GoLocal Page Invoice',
		html: 'PFA',
		attachments: [
						{   // utf-8 string as an attachment
							filename: 'invoice.pdf',
							content: buffer,
							contentType: 'application/pdf'
						},
						{   // utf-8 string as an attachment
							filename: 'test2.pdf',
							content: buffer1,
							contentType: 'application/pdf'
						}
					]
		};
		transporter.sendMail(mailOptions1, function(error, info){
		if (error) {
			console.log(error);
			res.end();
			
		} else {
			console.log('Email sent: ' + info.response);
			res.end();
		} 
	});	
		});
		
		
	});
			//}
		//})
		
	//})
	
	
	
/* 	var html = fs.readFileSync('./invoice.ejs', 'utf8');
	var html1 = fs.readFileSync('./csa.ejs', 'utf8');
	pdf.create(html, options).toBuffer(function(err, buffer){
		console.log('This is a buffer:', Buffer.isBuffer(buffer));
		console.log( buffer );
		pdf.create(html1, options).toBuffer(function(err1, buffer1){
				//res.end();
		var mailOptions1 = {
		from: 'testmidriff@gmail.com',
		to: 'midriffdeveloper2@gmail.com',
		subject: 'GoLocal Page Invoice',
		html: 'PFA',
		attachments: [
						{   // utf-8 string as an attachment
							filename: 'invoice.pdf',
							content: buffer,
							contentType: 'application/pdf'
						},
						{   // utf-8 string as an attachment
							filename: 'test2.pdf',
							content: buffer1,
							contentType: 'application/pdf'
						}
					]
		};
		transporter.sendMail(mailOptions1, function(error, info){
		if (error) {
			console.log(error);
			res.end();
			
		} else {
			console.log('Email sent: ' + info.response);
			res.end();
		} 
	});	
		});
		
		
	}); */
	
	
	/* pdf.create(html, options).toFile(function(err, buffer){
		console.log('This is a buffer:', Buffer.isBuffer(buffer));
		console.log( buffer );
		res.end();
		 var mailOptions1 = {
		from: 'testmidriff@gmail.com',
		to: 'midriffdeveloper3@gmail.com',
		subject: 'GoLocal Page Invoice',
		html: 'PFA',
		attachments: [
						{   // utf-8 string as an attachment
							filename: 'invoice.pdf',
							content: buffer,
							contentType: 'application/pdf'
						}
					]
		};
		transporter.sendMail(mailOptions1, function(error, info){
		if (error) {
			console.log(error);
			
		} else {
			console.log('Email sent: ' + info.response);
			
		} 
	});
	}); */
	
});

app.get('/my-design-packages', DefaultParser, function(req, res){
	sess = req.session;
	userdata = sess.passport;
	console.log( userdata );
	if( userdata  && userdata.role =="user"){
		mongoose.connect( url, function( err, db ){
		db.collection('users').findOne({ _id : new ObjectId( userdata.user )}, function(err, rows){
			console.log( rows );
			res.render('user-all-design-packages', { user__data : rows , page_title : 'dashboard' });
			
			res.end();
		})
		})
	}else{
		res.redirect('/');
		res.end();
		
	}
});
 
app.post('/update_user_login_status', DefaultParser,  function(req, res){
	var user_id = req.body.user_id;
	mongoose.connect( url, function( err, db ){ //===used to update values in database
		db.collection('users').update({_id :  new ObjectId( user_id )}, { $set : { first_login : 1 } } ,function(errs, response){	
			if(err) throw err;
				if(response){
					console.log('user updated=====');
					res.send('updated');
					res.end();
				}else{
					res.send('error');
					res.end();
					}
				})
			})
}); 

app.get('/invoices', DefaultParser , function(req, res){
	var query = url1.parse( req.url, true ).query;
	var id = query.id;
	var packageName = query.p;
	sess = req.session;	
	userdata = sess.passport;	
	if( userdata ){		
	//=== check for session data
		role = userdata.role;		
		already_login = true;		
	}else{		
		role = '';		
		already_login = false;			
	}
	if( id !='' && id !=null && id !=undefined ){
	mongoose.connect(url, function(err, db){
		db.collection('invoices').find({subscription_id : id, invoice_status : 1}).toArray(function(err, responseList){
			if(err) throw err;
			console.log( responseList );
			res.render('invoice_list',{ already_login : already_login, invoiceList : responseList, packageName : packageName });
			res.end();
		});
		
	});	
	}else{
		res.redirect('/my-subscriptions');
		//res.end();
	}	
});

app.get('/invoice', DefaultParser, function(req, res){
	var query = url1.parse( req.url, true ).query;
	var id = query.id;
	sess = req.session;	
	userdata = sess.passport;	
	if( userdata ){		
	//=== check for session data
		role = userdata.role;		
		already_login = true;		
	}else{		
		role = '';		
		already_login = false;			
	}
	if( id !='' && id !=null && id !=undefined ){
	mongoose.connect(url, function(err, db){
		db.collection('invoices').findOne({_id : new ObjectId( id )}, function(err, responseData){
			if(err) throw err;
			console.log( responseData );
			res.render('invoiceDetails',{ already_login : already_login, invoiceData : responseData});
			res.end();
		});
	});	
	}else{
		res.redirect('/my-subscriptions');
	} 
});

app.get('/allDesignInvoices', DefaultParser, function(req, res){	
var query = url1.parse( req.url, true ).query;
	var id = query.id;
	var package_name = query.p;
	sess = req.session;	
	userdata = sess.passport;	
	if( userdata ){		
	//=== check for session data
		role = userdata.role;		
		already_login = true;		
	}else{		
		role = '';		
		already_login = false;			
	}
	if( id !='' && id !=null && id !=undefined ){
	console.log( 'design Id : '+ id );
	mongoose.connect(url, function(err, db){
		db.collection('invoices').find({subscription_id : id ,invoice_status : 1}).toArray( function(err, invoiceList){
			if(err) throw err;
			console.log( invoiceList );
			res.render('DesignInvoicesList',{ already_login : already_login, invoiceList : invoiceList, package_name : package_name});
			res.end();
		});
	});	
	}else{
		res.redirect('/my-subscriptions');
	} 

});
app.get('/invoiceDesign', DefaultParser, function(req, res){
	var query = url1.parse( req.url, true ).query;
	var id = query.id;
	sess = req.session;	
	userdata = sess.passport;	
	if( userdata ){		
	//=== check for session data
		role = userdata.role;		
		already_login = true;		
	}else{		
		role = '';		
		already_login = false;			
	}
	if( id !='' && id !=null && id !=undefined ){
	mongoose.connect(url, function(err, db){
		db.collection('invoices').findOne({_id : new ObjectId(id)}, function(err, responseData){
			if(err) throw err;
			console.log( responseData );
			res.render('invoiceDetails',{ already_login : already_login, invoiceData : responseData});
			res.end();
		});
	});	
	}else{
		res.redirect('/my-subscriptions');
	} 
});

app.get('/csa-details', DefaultParser,  function(req, res){
	var query = url1.parse( req.url, true ).query;
	var id = query.id;
	sess = req.session;	
	userdata = sess.passport;	
	if( userdata ){		
	//=== check for session data
		role = userdata.role;		
		already_login = true;		
	}else{		
		role = '';		
		already_login = false;			
	}
	if( id !='' && id !=null && id !=undefined ){
	mongoose.connect(url, function(err, db){
		db.collection('subscriptions').findOne({subscription_id : id}, function(err, responseData){
			if(err) throw err;
			console.log( responseData );
			res.render('csa-user',{ already_login : already_login, invoiceData : responseData});
			res.end();
		});
	});	
	}else{ 
		res.redirect('/my-subscriptions');
	}
	
});

app.get('/forgot-password', DefaultParser,  function(req, res){
	message =  req.flash('msg');
	sess = req.session;
	userdata = sess.passport;
	if( userdata ){
		res.redirect('/profile');
		res.end();	
	}else{
		res.render('forgot-password',{ already_login : false });
		res.end();
	}
});

app.post('/forgot-password-autogenerate', DefaultParser,  function(req, res){
	var email = req.body.email;
	if(email !='' && email != undefined ){
		var uname = email.toLowerCase();
		mongoose.connect(url, function(err, db){
		db.collection('users').findOne({email : uname }, function(err, responseUser){
			if(err) throw err;
			if(responseUser){
				var customer_name = responseUser.first_name +'  '+ responseUser.last_name;
				var id = responseUser._id;
				var formated_message = '<div style="max-width: 600px; margin: auto;"><p>Hi '+ customer_name +',</p><p>You recently requested to reset your GoLocal Page account password. Just click on the button below, and you\'ll be good to go.</p> <p><a href="http://45.76.124.120:8081/recover-password?u='+ id +'" style="background-color: #6c757d; color: #fff; padding: 8px 15px; border-radius: 4px; text-decoration: none;"> Reset Password </a></p><p>Any questions?</p><p>Feel free to drop me an email at harry@golocalpage.com.au. I\'d be happy to help.</p> <p>Thank you, </p><p>Harry</p><p>07 3062 6983 | harry@golocalpage.com.au </p><p>PO Box 2477 Graceville East Queensland 4075 | <a href="https://www.golocalpage.com.au/">www.golocalpage.com.au</a></p><p>The information contained in this email, including all attachments, is confidential and may be legally privileged. If you have received this email by mistake, please inform us and destroy all copies of the original message. Do not make any use of this email. We do not waive any privilege, confidentiality or copyright associated with it.</p></div>';
				
				var mailOptions = {
					from: 'testmidriff@gmail.com',
					to: uname,
					subject: 'GoLocal Page – Reset password',
					html: formated_message
				};
				transporter.sendMail(mailOptions, function(error, info){
					if (error){
						console.log(error);
						res.send('error');
						res.end();
					} else{
						console.log('Email sent: ' + info.response);
						res.send('success');
						res.end();
					}
				});
			}
		})
	});
	}else{
		res.send('error');
		res.end();
	}
});

app.get('/recover-password', DefaultParser, function(req, res){
	var query = url1.parse( req.url, true ).query;
	var id = query.u;
	if(id !='' && id != null && id != undefined){
		message =  req.flash('msg');
		sess = req.session;
		userdata = sess.passport;
		res.render('reset-password-form', { already_login : false, id : id });
		res.end();
	}else{
		res.redirect('/login');
	}
});
app.post('/update_recover_password', DefaultParser, function(req, res){
	var new_password = req.body.new_password;
	var bcrypt = require('bcrypt-nodejs');	
	var new_Encryptpassword = bcrypt.hashSync(new_password, null, null);
	var id = req.body.id;
	mongoose.connect(url, function(err, db){
		if(err) throw err;
		db.collection('users').update({_id : new ObjectId(id)}, {$set : { password : new_Encryptpassword}}, function(err, updateResponse){
			if(err) throw err;
			console.log(updateResponse);
			res.send('success');
			res.end();
		});
	});
});


app.get('/referred-by/:id', DefaultParser, function(req, res){
	var refferal_id  = req.params.id;
	//console.log( refferal_id );
	if(refferal_id !='' && refferal_id != undefined){
		mongoose.connect(url, function(err, db){
			db.collection('subscriptions').findOne( {_id : new ObjectId( refferal_id ), status : 1}, function(err, resReferral){
				if(err) throw err;
				if(resReferral){
					var _email = resReferral.email;
					res.cookie('referral_code', refferal_id , { maxAge: 30 * 24 * 60 * 60 * 1000 });
					res.cookie('referral_code_email', _email , { maxAge: 30 * 24 * 60 * 60 * 1000 });
					res.redirect('/get-product');
					res.end();
				}else{
					res.redirect('/invalid-link');
					res.end();
				}
			})
		});
	}else{
		res.redirect('/404'); 
		res.end();
	}
});

app.get('/get-subscription-referrals', DefaultParser, function(req, res){
	var query = url1.parse( req.url, true ).query;
	var subscription_id = query.subscription_id;
	if(subscription_id !='' && subscription_id != undefined){
		mongoose.connect(url, function(err, db){
			/* db.collection('referral_purchase').aggregate([{$match: {referral_subscription_id: subscription_id}},{$lookup:{from: 'users',  localField: "user_id", foreignField: "_id",  as: "referral"  }}]).toArray(function(err, response){
			console.log('output======');
				if(err) throw err;
					console.log( response[0].referral );
			}) */
			db.collection('referral_purchase').find({referral_subscription_id : subscription_id}).sort({_id : -1}).toArray(function(errr,response){
				if(errr) throw errr;
				if( response.length > 0){
					res.send( response );
				}else{
					res.send('empty');
				}
				res.end();
			})
		});
	}else{
		res.send('error');
		res.end();
	}
});

app.post('/save_invoice_direct_payments', DefaultParser, function(req, res){ //==== save direct payments invoices
	console.log('save_invoice_direct_payments call');
	sess = req.session;
	userdata = sess.passport;
	var user_id = userdata.user;
	var first_name = userdata.first_name;
	var last_name = userdata.last_name;
	var payment_details = req.body.payment_details;
	var get_cart__data = req.body.get_cart__data;
	var referral_code = req.body.referral_code;
	//console.log( get_cart__data );
	//console.log( payment_details );
	var package_choosen = get_cart__data.cart_details.package_choosen;
	var package_amount = get_cart__data.cart_details.package_amount;
	var package_duration = get_cart__data.cart_details.package_duration;
	var addon_amount = get_cart__data.cart_details.addon_amount;
	var number_of_ads = get_cart__data.cart_details.number_of_ads;
	var addon_choosen = get_cart__data.cart_details.addon_choosen;
	var product_quantity = get_cart__data.cart_details.product_quantity;
	var addon_duration = get_cart__data.cart_details.addon_duration;
	var _location = get_cart__data.cart_details.location;
	//var subscription_amount =  ( package_amount * product_quantity ) + (package_amount * product_quantity * 10 /100);

	var total = ( package_amount * product_quantity * package_duration ) +  addon_amount;
	var _GST =  total * 10 / 100;
	//_GST = parseFloat(_GST).toFixed( 2 );
	//_GST = Math.round(_GST * 100 )/100;
	_GST = roundToTwo(_GST );
	var total_with_GST = total + _GST;
	//total_with_GST = parseFloat(total_with_GST).toFixed( 2 );
	//total_with_GST = Math.round(total_with_GST * 100 )/100;
	total_with_GST = roundToTwo(total_with_GST);
	if( package_choosen == '' &&  package_choosen != undefined && package_choosen != 0){
		var package_row = '<tr> <td class="left" style="padding: 0.75rem;vertical-align: top;border-top: 1px solid #dee2e6;"> <strong style=" font-size: 11px; font-family: /\'Raleway/\', sans-serif;">' + package_duration +' Month Ad Package ( X ' + product_quantity + ' )</strong> </td> <td class="right" style="padding: 0.75rem;vertical-align: top;border-top: 1px solid #dee2e6;">$ ' + package_amount +'  </td> 	</tr>';
		var package__details = '<h6  style="margin-bottom: 5px;  margin-top: 8px;"> Subscription Package  : <span style="float: right; font-weight: normal;">' + package_duration + ' Month Ad Package ( X ' + product_quantity + ' ) <br /> ( $ ' + package_amount +' )</span> </h6>';
	}else{
		var package_row = '';
		var package__details = '';
	}
	
	if( addon_choosen == 1 ){
		var design_row = '<tr> <td class="left" style="padding: 0.75rem;vertical-align: top;border-top: 1px solid #dee2e6;"> <strong style=" font-size: 11px; font-family: /\'Raleway/\', sans-serif;">' + number_of_ads +' Ad Designs</strong> </td> <td class="right" style="padding: 0.75rem;vertical-align: top;border-top: 1px solid #dee2e6;">$ ' + addon_amount +'  </td> 	</tr>';
		var addon__details='<h6  style="margin-bottom: 5px;  margin-top: 8px;"> Design Package  : <span style="float: right; font-weight: normal;">  ' + number_of_ads +' Ad Designs <br /> ( $ ' + addon_amount + ' )</span> </h6><h6  style="margin-bottom: 5px;  margin-top: 8px;"> Design Expires  : <span style="float: right; font-weight: normal;">  </span> </h6>';
	}else{
		var addon__details ='';
		var addon__details = '';
	}
	
	console.log('User id====>>>.' + user_id);
	mongoose.connect(url, function(err, db){
		db.collection('users').findOne({_id : new ObjectId( user_id )}, function(er, responseData){
			if(er) throw er;
			console.log( responseData );
			if(responseData){
				console.log('User details----->>>>>>>>>');
				console.log( responseData );
				db.collection('invoices').insertOne({ user_id : new ObjectId(user_id), package_amount : package_amount, package_duration : package_duration , product_quantity : product_quantity , addon_amount: addon_amount, number_of_ads : number_of_ads, addon_choosen : addon_choosen,  _location : _location, addon_duration : addon_duration , create_date : new Date().toISOString(), status : 1 , referral_code : referral_code }, function(er, response){
					if(er) throw er;
					//console.log( response );
					var formated_invoice = '<div class="card-body" style=" width: 100%; font-size: 11px; font-family: /\'Raleway/\', sans-serif;"> <div class="row mb-4" style="padding-top:40px;"> <div class="col-sm-7 form-logo" style="width:60%; float:left; "> <img src="http://45.76.124.120:8081/images/logo-blue.png" class="img-fluid" style="max-width: 130px;"> </div> <div class="col-sm-5 customer-info" style="width:40%; float:left; text-align: left;"> <div> <strong style=" font-size: 11px; font-family: /\'Raleway/\', sans-serif;">www.GoLocalpage.com.au</strong> </div> <div>GoLocal Page Pty Ltd ABN 47 624</div> <div>192 025</div> <div>PO Box 2477 Graceville East</div> <div>Queensland 4075</div> <div>(07)3062 6983 | harry@golocalpage.com.au</div> 	<hr /> <div>Account name : GoLocal Page Pty Ltd</div> <div>BSB : 064 111</div> <div>Account Number : 1023 5309</div> </div> </div> <div class="row mb-4" style="padding-bottom:60px;">  <div class="col-sm-7 text-left" style="width:60%; float:left;padding-top:60px;"> <div> <strong style=" font-size: 11px; font-family: /\'Raleway/\', sans-serif;"> ' + responseData.first_name +'  '+ responseData.last_name + ' </strong> </div> <div>'+ responseData.business_category +'</div> <div>' + responseData.streetNumber +'  '+ responseData.streetName + ' </div> <div>'+ responseData.city +'  '+ responseData.zipCode +'  '+ responseData.country + '</div> <div>' + responseData.phone +' | ' + responseData.email + '</div> </div> <div class="col-sm-5" style="width:40%; float:left;padding-top:30px;"> <h4>Tax Invoice</h4> <div> <strong style=" font-size: 11px; font-family: /\'Raleway/\', sans-serif;">Invoice No : C9-'+ responseData.arirtable_number + ' </strong> </div> <div>Payment Date : </div> <div class="box_invoice" style="padding: 10px 10px;border: 2px solid #000;margin-top: 15px;margin-bottom: 15px; border-radius: 8px;"> Reference Number: <span style="float:right; font-weight: bold;"> XXXXXXXXXXX </span> </div> <div class="box_invoice" style="padding: 10px 10px;border: 2px solid #000;margin-top: 15px;margin-bottom: 15px; border-radius: 8px;"> Total Amount: <span style="float:right; font-weight: bold;"> $ ' + total_with_GST  + ' </span> </div> <div class="box_invoice text-center" style="padding: 10px 10px;border: 2px solid #000;margin-top: 15px;margin-bottom: 15px; border-radius: 8px;text-align:center"> Please Pay within 3 Days </div> </div> </div> <div class="row"> <div class="col-lg-6 col-sm-6" style="width:60%; float:left;"> <h2> </h2> </div> 	<div class="col-lg-6 col-sm-6 ml-auto" style="width:40%; float:left;">  <table class="table table-clear"> <tbody class="text-right" style="text-align:right"> '+ package_row +' '+ design_row +' <tr> <td class="left" style="padding: 0.75rem;vertical-align: top;border-top: 1px solid #dee2e6;"> <strong style=" font-size: 11px; font-family: /\'Raleway/\', sans-serif;">plus GST (10%)</strong> </td> <td class="right" style="padding: 0.75rem;vertical-align: top;border-top: 1px solid #dee2e6;">'+ _GST +' </td> </tr style=""> <tr> <td class="left" style="padding: 0.75rem;vertical-align: top;border-top: 1px solid #dee2e6;"> <strong style=" font-size: 11px; font-family: /\'Raleway/\', sans-serif;">Total</strong> </td> <td class="right" style="padding: 0.75rem;vertical-align: top;border-top: 1px solid #dee2e6;">'+ total_with_GST  +' </td> </tr> </tbody> </table> </div> <div class="col-sm-12 text-center" style="margin-top: 50; padding:10px;text-align: center;" >  GoLocal Page Pty Ltd I (07) 3062 6983 I harry@golocalpage.com.au I www.golocalpage.com.au 	</div> </div></div>'; 
					//=============table======//
					var formated_csa ='<div class="card-body" style=" width: 100%; font-size: 11px; font-family: /\'Raleway/\', sans-serif;"><div style="padding-top:40px;"><div class="col-sm-7 form-logo" style="width:60%; float:left; "><img src="http://45.76.124.120:8081/images/logo-blue.png" class="img-fluid" style="max-width: 200px;"></div><div class="col-sm-5 customer-info" style="width:40%; float:left;"><div><strong>www.GoLocalpage.com.au</strong></div><div>GoLocal Page Pty Ltd ABN 47 624</div><div>192 025</div><div>PO Box 2477 Graceville East</div><div>Queensland 4075</div><div>(07)3062 6983 | harry@golocalpage.com.au</div></div></div><div class="row mb-4"><div class="col-sm-12"><hr /></div><div class="col-sm-12"><h6 style="margin-bottom: 5px; "> Reference Number : <span style="float: right; font-weight: normal;">  XXXXXXX </span> </h6><h6 style="margin-bottom: 5px; margin-top: 8px;"> Business Name : <span style="float: right; font-weight: normal;"> '+ responseData.business_category +'  </span> </h6><h6 style="margin-bottom: 5px;  margin-top: 8px;"> Trading As : <span style="float: right; font-weight: normal;">'+  responseData.trading_name +' </span> </h6><h6 style="margin-bottom: 5px;  margin-top: 8px;"> ABN : <span style="float: right; font-weight: normal;"> ' + responseData.ABN +' </span> </h6><h6 style="margin-bottom: 5px;  margin-top: 8px;"> Authorised Person : <span style="float: right; font-weight: normal;"> '+ responseData.first_name +' '+   responseData.last_name +'  </span> </h6><h6  style="margin-bottom: 5px;  margin-top: 8px; min-height: 50px;"> Address : <span style="float: right; font-weight: normal;">  '+ responseData.streetNumber +'  '+ responseData.streetName  +' <br /> ' + responseData.city +'  '+ responseData.zipCode +' </span> </h6><h6  style="margin-bottom: 5px;  margin-top: 8px; min-height: 50px;"> Postal Address : <span style="float: right; font-weight: normal;"> '+ responseData.streetNumber  +'  '+  responseData.streetName +' <br /> ' + responseData.city +'  '+responseData.zipCode +' </span> </h6><h6  style="margin-bottom: 5px;  margin-top: 8px;"> Phone Number  : <span style="float: right; font-weight: normal;"> ' + responseData.phone +' </span> </h6><h6  style="margin-bottom: 5px;  margin-top: 8px;"> Mobile  : <span style="float: right; font-weight: normal;">' + responseData.mobile + '</span> </h6><h6  style="margin-bottom: 5px;  margin-top: 8px;"> Email  : <span style="float: right; font-weight: normal;">'+ responseData.email + '</span> </h6><h6  style="margin-bottom: 5px;  margin-top: 8px;"> Business Category  : <span style="float: right; font-weight: normal;">' + responseData.business_category + '</span> </h6><h6  style="margin-bottom: 5px;  margin-top: 8px;"> Host ID  : <span style="float: right; font-weight: normal;">  XXXXXXX </span> </h6><h6  style="margin-bottom: 5px;  margin-top: 8px;"> Host Site Name  : <span style="float: right; font-weight: normal;">  XXXXXXX </span> </h6><h6  style="margin-bottom: 5px;  margin-top: 8px;"> Host Site Address  : <span style="float: right; font-weight: normal;">  XXXXXXX </span> </h6> '+ package__details +'  '+ addon__details +'<h6  style="margin-bottom: 5px;  margin-top: 8px;"> Commencement Date : <span style="float: right; font-weight: normal;">  XXXXXXX </span> </h6><h6  style="margin-bottom: 5px;  margin-top: 8px;"> Expiration Date : <span style="float: right; font-weight: normal;">  XXXXXXX </span> </h6></div></div></div>';
					
					
					var options = {
						phantomPath: __dirname + "/node_modules/phantomjs-prebuilt/bin/phantomjs",
						format: 'A4'
					};
					var invoice = formated_invoice;
					var csa = formated_csa;
					pdf.create(invoice, options).toBuffer(function(err, buffer){
						console.log('This is a buffer:', Buffer.isBuffer(buffer));
						console.log( buffer );
						pdf.create(csa, options).toBuffer(function(err1, buffer1){ //== generate csa
						//res.end();
						var mailOptions1 = {
							from: 'testmidriff@gmail.com',
							to: responseData.email,
							subject: 'GoLocal Page Invoice',
							html: 'PFA',
							attachments: [
								{   // utf-8 string as an attachment
									filename: 'INVOICE.pdf',
									content: buffer,
									contentType: 'application/pdf'
								},
								{   // utf-8 string as an attachment
									filename: 'CSA.pdf',
									content: buffer1,
									contentType: 'application/pdf'
								},
								{   // file on disk as an attachment
									filename: 'PrivacyPolicy.pdf',
									path: __dirname+'/public/files/PrivacyPolicy.pdf' // stream this file
								},
								{   // file on disk as an attachment
									filename: 'TermsAndConditions.pdf',
									path: __dirname+'/public/files/TermsAndConditions.pdf' // stream this file
								}
							]
						};
						transporter.sendMail(mailOptions1, function(error, info){
							if (error) {
								console.log(error);
								res.end();
							} else {
								console.log('Email sent: ' + info.response);
								res.end();
							} 
						});	
					});
				});
					
				
					/* var mailOptions = {
						from: 'testmidriff@gmail.com',
						to: responseData.email,
						subject: 'Your Invoice ',
						html: formated_message  
					};
					transporter.sendMail(mailOptions, function(error, info){
						if (error) {
							console.log(error);
							res.send('error');
							res.end();
					
						} else {
							console.log('Email sent: ' + info.response);
							res.send('success');
						}
					}); */
					
					
				})
				res.clearCookie("cart_store_id");
				res.send('success');
				res.end();
				
			}else{
				res.send('error');
				res.end();
			}
		});
	});
});

app.get('/csa', DefaultParser, function(req, res){
	var query = url1.parse( req.url, true ).query;
	var subscription_id = query.s;
	mongoose.connect(url, function(err, db){
		db.collection('orders').findOne({ order_type : "ads_package", paymentId : subscription_id}, function(errr, response){
			if(errr) throw errr;
			if(response ){
				console.log( response );
				var user_id = response.user_id;
				
				db.collection('users').findOne({_id : new ObjectId(user_id)}, function(err, response1){
					if(err) throw err;
					console.log('user get in csa');
					var airtable_id = response1.airtable_id;
					console.log( airtable_id );
					console.log( response1 );
					base('Customer').find(airtable_id , function(err, record) {
						if (err) { console.error(err); return; }
						console.log( 'Airtable data' );
						console.log(record.fields);
						var airtable_data = record.fields;
						res.render('csa-form', { userResponse  : response1, pagedata : response, airtable_data : airtable_data });	
						res.end();
					});
				})
			}else{
				res.redirect('404');
			}
		})
		
	});
});
app.get('/direct_payment_invoices_pending', DefaultParser, function(req, res){
	sess = req.session;
	userdata = sess.passport;
	var user_id = userdata.user;
	var query = url1.parse( req.url, true ).query;
	var max_val = query.max_val;
	console.log( user_id );
	mongoose.connect(url, function(err, db){
		//db.invoices.find({user_id: new ObjectId("5b9254f83588624f940a5b2b"), status : 1}).toArray();
		
		db.collection('invoices').find({ user_id :  new ObjectId(user_id) ,status : 1 }).limit(parseInt(max_val)).sort( { _id : -1 } ).toArray(function(errr, response){
			if(errr) throw errr;
			console.log( response );
			res.send( response );
			
		})
	})
	
})
app.get('/my-pending-invoice', DefaultParser, function(req, res){
	sess = req.session;
	userdata = sess.passport;
	console.log( userdata );
	if( userdata  && userdata.role == 'user'){
		res.render('my-pending-invoice');
		//res.end();
	}else{
		res.redirect('/');
	}
});
app.get('/direct-payment-agreement', DefaultParser,  function(req, res){
	var query = url1.parse( req.url, true ).query;
	var id = query.id;
	mongoose.connect(url, function(err, db){
		db.collection('invoices').findOne({_id : new ObjectId( id )}, function(errr, response){
			if(errr) throw errr;
			var user_id = response.user_id;
			db.collection('users').findOne({_id : new ObjectId( user_id )}, function(er, userResponse){
				res.render('direct-payment-agreement-invoice',{ pagedata : response, userResponse : userResponse });
				res.end();
			})
		})
	})
});
//======================================//

app.post('/upload_ads', DefaultParser, function(req, res){
	var subscription_id = req.body.ad_subscription_id;
	var content = req.body.content;
	var host_id = req.body.host_id;
	var meet_guidlines = req.body.meet_guidlines;
	var agree_term = req.body.agree_term;
	var business_name = req.body.business_name;
	var full_name = req.body.full_name;
	var phone = req.body.phone;
	var email = req.body.email;
	/* console.log('URL : ' + content );
	console.log('host_id : ' + host_id );
	console.log('meet_guidlines : ' + meet_guidlines );
	console.log('agree_term : ' + agree_term ) */;
	
	var formated_message = 'We have received a new Change My Ad Form submission on GoLocal Page,<br /> Business Name: '+ business_name +'<br />Full Name: '+ full_name +'  <br /> Phone: '+ phone +' <br /> Email: '+ email +'  <br />Reference #:  <br /> Upload: '+ content +' <br /> Host Site Name: '+ host_id +'  <br /> Meet guidelines: '+ meet_guidlines +' <br /> Adhere to Privacy and Terms: '+ agree_term;
	var mailOptions = {
			from: 'testmidriff@gmail.com',
			to: 'midriffdeveloper3@gmail.com',
			subject: 'New Change My Ad Form submission',
			html: formated_message  
		};
	transporter.sendMail(mailOptions, function(error, info){ 
			if (error) {
				console.log(error);
				res.redirect('/my-subscriptions');
				//res.end();
		
			} else {
				console.log('Email sent: ' + info.response);
				mongoose.connect(url, function(err, db){
					console.log('subscription id :===>>> '+ subscription_id);
		db.collection('subscriptions').update({subscription_id : subscription_id}, {$addToSet:{"uploadedAds":content}}, function(err, response){
			if(err) throw err;
			var formated_message1 = 'Hi '+ full_name + ' ,<br/>Thanks for uploading your Ad.<br/>We will process your upload and let you know when it is online.<br/>If you have any questions let know.<br/>Thank you <br/> Harry.';
				var mailOptions1 = {
						from: 'testmidriff@gmail.com',
						to: email,
						subject: 'GoLocal Page - Confirmation Ad Upload',
						html: formated_message1  
					};
					transporter.sendMail(mailOptions1, function(error, info){ 
						if (error) {
							console.log(error);
						} else {
							console.log('Email sent: ' + info.response);
						}
				});
			
		});
	});
				res.redirect('/my-subscriptions');
				//res.end();
			}
	});
});

app.post('/change_password', DefaultParser, function(req, res){
//===== This function is used for change password 	
sess = req.session;
userdata = sess.passport;
var user_id = userdata.user;

var new_password = req.body.new_password;	
var bcrypt = require('bcrypt-nodejs');	
var old_password = req.body.old_password;	
var Encryptpassword = bcrypt.hashSync(old_password, null, null);	
var new_Encryptpassword = bcrypt.hashSync(new_password, null, null);	
var current_password = req.body.current_password;	
	
console.log('OLD Password : ' + Encryptpassword );
	
console.log('Current Password : ' + current_password );	
	
if (bcrypt.compareSync( old_password, current_password )){		
	mongoose.connect(url, function( err, db ){		
		db.collection("users").update({ _id : new ObjectId( user_id )},{$set : {password : new_Encryptpassword }}, function( err, response ){			
				if( err ) throw err;			
				var status =  response.result.ok;			
				if( status == 1 ){				
					res.send('Password Changed Successfully');				
					res.end();			
				}else{				
					res.send('Error while changing your password');				
					res.end();			
					}			 		
					}) 	
				})	
	}else{		
		console.log( 'Old password is invalid' );		
		res.send('Old password is invalid');		
		res.end();	
}});
app.get('/referral', DefaultParser, function(req, res){
	sess = req.session;	
	userdata = sess.passport;
	console.log( userdata );
	if( userdata ){	
		mongoose.connect( url, function( err, db ){
		db.collection('users').findOne({ _id : new ObjectId( userdata.user )}, function(err, rows){
			console.log( rows );
			res.render('referral-program', { user__data : rows , page_title : 'referral' });
			
			res.end();
		})
		})
	}else{
		res.redirect('/');
		res.end();
	}
	
}) 
app.get('/term-and-conditions', DefaultParser, function(req, res){
	sess = req.session;	
	userdata = sess.passport;	
	if( userdata ){		
	//=== check for session data
		role = userdata.role;		
		already_login = true;		
	}else{		
		role = '';		
		already_login = false;			
	}
	res.render('term-and-conditions',{page_title : 'Term and Conditions' , already_login : already_login});
	res.end();
}); 
app.get('/privacy-policy', DefaultParser, function(req, res){
	sess = req.session;	
	userdata = sess.passport;	
	if( userdata ){		
	//=== check for session data
		role = userdata.role;		
		already_login = true;		
	}else{		
		role = '';		
		already_login = false;			
	}
	res.render('privacy-policy',{page_title : 'Term and Conditions' , already_login : already_login});
	res.end();
}); 

app.post('/webhook', customParser ,function (req, res, next) { 
  getRawBody(req, {
    length: req.headers['content-length'],
    limit: '20mb',
    encoding: contentType.parse(req).parameters.charset
  }, function (err, string) {
    if (err) return next(err)
    req.text = string
    next()
  })
}, function(req, res){
    console.log(req.text.toString('utf8'));
	requestData = req.text.toString('utf8') || {};
	client.event.create({
		payload : requestData,
		url: 'http://45.76.124.120:8081/webhook'
	}, function(errData, data){
	 
		if(errData){
			console.error("Error Message: " + errData);
			// handle the error
			return;
		}else{
			//console.log("Event Name: " +JSON.stringify( data));
			console.log( data );
			console.log( data.event.name );
			var event_name =  data.event.name;
			if( event_name == 'invoice.card.exp' ){
				mongoose.connect(url, function(err, db){
					db.collection('card_expired').insertOne({ webhook_data : data}, function(er, response){
						if(er) throw er;
						var subscriptionData = data.event.data;
						var customer_name = data.event.data.customer.name;
						var customer_email= data.event.data.customer.email;
						var formated_message = '<p>Dear '+ customer_name +'</p> <p>Card is expired</p>'
						var mailOptions1 = {
							from: 'testmidriff@gmail.com',
							to: customer_email ,
							subject: 'Card Expired Notification',
							html : formated_message
						};
						transporter.sendMail(mailOptions1, function(error, info){
							if (error) {
								console.log(error);
								//res.end();
							} else {
								console.log('Email sent: ' + info.response);
								//res.end();
							} 
						});
						
					})
					
				});
			} 
			//============ PAYMENT CREATE HOOK FOR NEXT MONTH INVOICE START ==========//
			if( event_name == 'payment.create' ){ 
			function getNextInvoiceNumber(){
				return new Promise(function(resolve, reject) {
					mongoose.connect(url, function(err, db){
						db.collection('invoices').find().sort({ invoice_number: -1 }).limit(1).toArray( function(err, response){
						//console.log( response );
							if( response.length > 0 ){
								resolve( response[0].invoice_number );
							}else{
								resolve( 0 );
							}
						});
					})
				})
			}
			
			async function createNextInvoice(){
				var eventData =  data.event.data;
				var paymentStatus =  eventData.paymentStatus;
				var id =  eventData.id;
				var invoice_number = await getNextInvoiceNumber();
				
				//================ WEBHOOK FOR ADS PACKAGE ====================//
				mongoose.connect(url, function(err,db){
					db.collection('subscriptions').findOne({paymentId : id}, function(err, subResponse){ 
					///==== need to create SECOND MONTH INVOICE IN OUR DATABASE FOR A Subscription
					if(err) throw err;
					if(subResponse){
						var invoice_count = subResponse.invoice_count;
						var simplify_id = subResponse.simplify_id;
						var AvaiableFreeMonths = subResponse.AvaiableFreeMonths;
						invoice_number = invoice_number + 1;
						var trading_name = subResponse.trading_name;
						var business_name = subResponse.business_name;
						businessnamearray = trading_name.split(' ');
						var businessnamearray1 =[];
						var invoicenameString = '';
						if( businessnamearray.length > 0 ){
						for(var i =0; i< businessnamearray.length; i++ ){
							var name = 	businessnamearray[i];
							if( name !='' ){
								businessnamearray1.push(name);
								//businessnamearray1.push( name.substr(0, 3));
							}
						}
							invoicenameString = businessnamearray1.join('');
						}
						invoicenameString = invoicenameString +''+ invoice_number;
						
						if(invoice_count == 1){
							
							//======== first month invoice start here  ==========//							
							var order_date = subResponse.order_date;
							order_date = moment(order_date);
							order_date_formatted = moment(order_date).format("Do MMM YYYY");
							var cardChargesSection ='';
							var referralSection ='';
							var disCountSection ='';
							var paymentStatusText = 'Paid in Full Thank you.';
							if( subResponse.card_charges > 0  && subResponse.card_charges != undefined && subResponse.card_charges != null){
								cardChargesSection = '<tr><td style="vertical-align: top; color: red;">Amex card surcharge 3.025%</td> <td style="vertical-align: top;width:40%; color: red;">'+  currencyFormatter.format(subResponse.card_charges, { code: '' })  +' </td>  </tr>';
							}
							if( subResponse.referral_purchase == 1 ){
								var package_fullamount = subResponse.package_fullamount;
								var package_frequency = subResponse.package_frequency;
								var referralDiscount = 0;
								if( package_frequency =='month' ){
									referralDiscount = subResponse.package_fullamount;
									paymentStatusText = 'REFERRAL PURCHASE';
								}else{
									referralDiscount = subResponse.package_fullamount / subResponse.package_duration;
									paymentStatusText = 'Paid in Full Thank you.';
								}
								referralSection = '<tr><td style="vertical-align: top; color: red;">Screen Ad Package Referral Discount</td> <td style="vertical-align: top;width:40%; color: red;">'+  currencyFormatter.format(referralDiscount, { code: '' })  +' </td>  </tr>';
							}else if( subResponse.discount_purchase == 1 ){
								var coupon_details = subResponse.coupon_details;
								disCountSection = '<tr><td style="vertical-align: top; color: red;">Discount '+ coupon_details.percentOff +' % off</td> <td style="vertical-align: top;width:40%; color: red;">'+  currencyFormatter.format(subResponse.subscriptionDiscountAmount, { code: '' })  +'</td></tr>';
								paymentStatusText = 'Paid in Full Thank you.';
							}
							
							
							var formated_invoice = '<link href="https://fonts.googleapis.com/css?family=Raleway:300,400,700" rel="stylesheet" /><link href="https://fonts.googleapis.com/css?family=Lato:400,700,900" rel="stylesheet" /> <div id="pageHeader" style="padding:10px 40px;"><div style="padding-top:10px; max-width: 100%;"> <div style="width:60%; float:left; "> <img src="https://uploads-ssl.webflow.com/5ae87b768423ad2afbce8d09/5ae87b778423ad04fdce8e7a_Logo-Color.png" style="max-width: 165px;"> </div><div style="width:40%; float:left; text-align: left;font-size: 9px;font-weight:400; font-family: Raleway, sans-serif;color:#6B6D6D;"><div> <strong style=" font-size: 11px;color:#3752a6;font-weight:700;line-height:20px;">www.GoLocalpage.com.au</strong> </div><div>GoLocal Page Pty Ltd ABN 47 624 192 025</div><div>PO Box 2477 Graceville East QLD 4075</div><div>(07)3062 6983 | harry@golocalpage.com.au</div></div></div></div> <div style="padding-bottom:60px; max-width: 100%; font-family: Lato, sans-serif;">  <div style="width:60%; float:left;font-size: 10px;padding-top:30px;line-height:16px;color: #000; "> <div style="padding-left:30px;padding-top:20px;font-weight:500; ">  <div>'+ subResponse.first_name +' ' + subResponse.last_name +'</div>  <div>'+ subResponse.business_name +'</div>   <div>'+ subResponse.streetName +' </div> <div>'+  subResponse.city  +' '+ subResponse.state +' '+  subResponse.zipCode +'</div>  <div>'+  subResponse.phone  +' | '+ subResponse.email  +' </div>  </div> </div> <div style="width:40%; float:left;padding-top:30px;font-size: 10px;"> <h1 style="font-weight:bold;margin-block-start: 0;font-size: 13px;">Tax Invoice</h1> <table style="width: 100%;clear: both;line-height:15px;">  <tbody style="text-align:right;font-size: 10px; line-height:13px;font-weight:normal;">  <tr>  <td style="text-align:left;width:50%;">Invoice No :</td>  <td style="text-align:right;width:50%;">'+ subResponse.invoive_display  +'</td>   </tr>  <tr>  <td style="text-align:left;width:50%;">Payment Date :</td>   <td style="text-align:right;width:50%;"> '+ order_date_formatted +'</td>   </tr>   </tbody>  </table>  <div style="padding: 12px 10px;border: 2px solid #000;margin-top: 15px;margin-bottom: 15px; border-radius: 8px;"> Reference Number: <span style="float:right;"> '+ subResponse.arirtable_number +' </span> </div>  <div style="padding: 12px 10px;border: 2px solid #000;margin-top: 15px;margin-bottom: 15px; border-radius: 8px;"> Total Amount: <span style="float:right;"> '+ currencyFormatter.format(subResponse.order_Amount / 100, { code: 'USD' }) +' </span> </div>  <div style="padding: 12px 10px;border: 2px solid #000;margin-top: 15px;margin-bottom: 15px; border-radius: 8px;text-align:center"> '+ paymentStatusText +'  </div>  </div> </div>   <div style="max-width: 100%;width:100%;clear:both; font-family: Lato, sans-serif;"> <hr style="border-top:1px solid #000;border-bottom:1px solid transparent;width:70%;float:right;margin-bottom:23px;"> <table style="text-align:right;float:right;">  <tbody style="text-align:right;font-size: 12px; line-height:1.0;font-weight:300;"><tr><td>'+ subResponse.description +'</td><td>'+ currencyFormatter.format(subResponse.package_Amount, { code: '' }) +'</td></tr> <tr>  <td style="vertical-align: top;">plus GST (10%)</td> <td style="vertical-align: top;width:40%;">'+  currencyFormatter.format(subResponse.GST, { code: '' })  +' </td>  </tr>'+ disCountSection +'  '+  referralSection +'  '+ cardChargesSection +' <tr>  <td style="vertical-align: top; font-weight: bold;">TOTAL</td>  <td style="vertical-align: top;width:40%; font-weight: bold;">'+ currencyFormatter.format(subResponse.order_Amount / 100, { code: 'USD' })  +' </td> </tr> </tbody>  </table> </div> <hr style="margin-top:23px;border-top:1px solid #000;border-bottom:1px solid transparent;  width:70%; float:right; margin-bottom:38px;"><div id="pageFooter" style="padding:0px;margin:0;"><div style="color:#525454;width:100%;clear:both;text-align: center;font-size: 11px;font-family: Raleway, sans-serif;padding:0px;margin:0;"> GoLocal Page Pty Ltd I (07) 3062 6983 I harry@golocalpage.com.au I www.golocalpage.com.au </div></div>';
							var invoice = formated_invoice;
							var options = {
								//phantomPath: __dirname + "\node_modules\phantomjs-prebuilt\bin\phantomjs",
								format: 'A4'
							}; 
							
							pdf.create(invoice, options).toBuffer(function(err, buffer){
								var formated_message = '<div style="max-width: 600px; margin: auto;"><p>Hi '+ subResponse.first_name +' ' + subResponse.last_name +'</p><p>Thank you for purchasing our GoLocal Page Packages. We have enclosed your:</p><ul><li>Tax Invoice</li><li>Terms and Conditions</li><li>Privacy Policy</li></ul><p>Please read these documents carefully and let us know of any changes or questions you might have.</p><p>Thank you,</p><p>Harry</p><p>07 3062 6983 | harry@golocalpage.com.au</p><p>PO Box 2477 Graceville East Queensland 4075 |<a href="https://www.golocalpage.com.au/">www.golocalpage.com.au</a></p><p>The information contained in this email, including all attachments, is confidential and may be legally privileged. If you have received this email by mistake, please inform us and destroy all copies of the original message. Do not make any use of this email. We do not waive any privilege, confidentiality or copyright associated with it.</p></div>';
							
								var mailOptions1 = {
									from: 'testmidriff@gmail.com',
									to: subResponse.email,
									subject: 'GoLocal Page - Screen Ad Invoices',
									html: formated_message,
									attachments: [
										{   // file on disk as an attachment
											filename: 'PrivacyPolicy.pdf',
											path: __dirname+'/public/files/PrivacyPolicy.pdf' // stream this file
										},
										{   // file on disk as an attachment
											filename: 'TermsAndConditions.pdf',
											path: __dirname+'/public/files/TermsAndConditions.pdf' // stream this file
										},
										{   // utf-8 string as an attachment
											filename: 'INVOICE.pdf',
											content: buffer,
											contentType: 'application/pdf'
										}
									]
								};
								transporter.sendMail(mailOptions1, function(error, info){
									if (error) {
										console.log(error);
									} else {
										console.log('Email sent: ' + info.response);
									} 
								}); 
							})
							//=============== send first month invoices =====================//
							
							var next_payment_date = subResponse.next_payment_date;
							var up_next_payment_date = subResponse.next_payment_date;
							var package_duration = subResponse.package_duration;
							var package_frequency = subResponse.package_frequency;
							up_next_payment_date = moment(up_next_payment_date);
							if( package_frequency =='month' ){
								//up_next_payment_date.add({days : 1});
								up_next_payment_date.add({ months : 1 });
							}else{
								up_next_payment_date.add({ months : package_duration });
							}
							//up_next_payment_date.add({ months : 1 });
							up_next_payment_date = new Date( moment(up_next_payment_date).format() ).toISOString();
							
							
							
							
							db.collection('invoices').insertOne({type : 'subscription',paymentStatus : 'UPCOMING', paymentId : '', package_Amount : subResponse.package_Amount, GST : subResponse.GST, order_Amount : subResponse.order_Amount, package_fullamount : subResponse.package_fullamount, currency : 'AUD', description : subResponse.description, number_of_ads : subResponse.number_of_ads, product_quantity : subResponse.product_quantity, package_duration : subResponse.package_duration,  user_id : subResponse.user_id, last_name: subResponse.last_name, first_name: subResponse.first_name, invoice_date : new Date().toISOString(),  business_category_name : subResponse.business_category_name, airtable_id: subResponse.airtable_id, arirtable_number : subResponse.arirtable_number, phone : subResponse.phone,  email : subResponse.email, card_type : subResponse.card_type, card_charges : subResponse.card_charges, zipCode : subResponse.zipCode, state : subResponse.state, city : subResponse.city, streetName : subResponse.streetName, invoice_number : invoice_number, invoive_display : invoicenameString, subscription_number : subResponse.subscription_number, invoice_status : 0, due_date: new Date(next_payment_date).toISOString(), referral_purchase : 0, discount_purchase : 0, next_payment_date :up_next_payment_date, subscription_id : subResponse.subscription_id, up_next_invoice_create : 0, simplify_id : simplify_id , trading_name : trading_name, business_name : business_name},function(err, responseInserted){
								if(err) throw err;
								if(responseInserted.insertedId){
									console.log('New invoice created');
									db.collection('subscriptions').update({ paymentId : id },{$inc : {invoice_count : 1} }, function(err, resIns){
										if(err) throw err;
										if(resIns.insertedId){
											console.log('Subscription invoice count updated');
										}else{
											console.log('Unable to update invoice count');
										} 
									})
								}
							})
						}
					}
					})
				});
				//============== WEBHOOK FOR ADS PACKAGE ENDS ==================//
				//============== WEBHOOK FOR DESIGN PACKAGE ====================//
				mongoose.connect(url, function(err,db){
					db.collection('designPurchase').findOne({paymentId : id}, function(err, subResponse){
					///==== need to create SECOND MONTH INVOICE IN OUR DATABASE FOR A DESIGN PACKAGE SUBSCRIPTION
					if(err) throw err;
					if(subResponse){ 
						var invoice_count = subResponse.invoice_count;
						var simplify_id = subResponse.simplify_id;
						invoice_number = invoice_number + 1;
						var trading_name = subResponse.trading_name;
						var business_name = subResponse.business_name;
						businessnamearray = trading_name.split(' ');
						var businessnamearray1 =[];
						var invoicenameString = '';
						if( businessnamearray.length > 0 ){
						for(var i =0; i< businessnamearray.length; i++ ){
							var name = 	businessnamearray[i];
							if( name !='' ){
								businessnamearray1.push(name);
								//businessnamearray1.push( name.substr(0, 3));
							}
						}
							invoicenameString = businessnamearray1.join('');
						}
						invoicenameString = invoicenameString +''+ invoice_number;
						
						if(invoice_count == 1){ 
							var next_payment_date = subResponse.next_payment_date;
							var up_next_payment_date = subResponse.next_payment_date;
							up_next_payment_date = moment(up_next_payment_date);
							up_next_payment_date.add({ months : subResponse.paymentTypeDuration });
							up_next_payment_date = new Date( moment(up_next_payment_date).format() ).toISOString();
								
							db.collection('invoices').insertOne({type : 'Design',paymentStatus : 'UPCOMING', paymentId : '', package_Amount : subResponse.package_Amount, GST : subResponse.GST, order_Amount : subResponse.order_Amount, currency : 'AUD', description : subResponse.description, number_of_ads : subResponse.number_of_ads, addon_duration : subResponse.addon_duration,  user_id : subResponse.user_id, last_name: subResponse.last_name, first_name: subResponse.first_name, invoice_date : new Date().toISOString(),  business_category_name : subResponse.business_category_name, airtable_id: subResponse.airtable_id, arirtable_number : subResponse.arirtable_number, phone : subResponse.phone,  email : subResponse.email, card_type : subResponse.card_type, card_charges : subResponse.card_charges, zipCode : subResponse.zipCode, state : subResponse.state, city : subResponse.city, streetName : subResponse.streetName, invoice_number : invoice_number, invoive_display : invoicenameString, subscription_number : subResponse.subscription_number, invoice_status : 0, due_date: new Date(next_payment_date).toISOString(), next_payment_date :up_next_payment_date, subscription_id : subResponse.subscription_id, up_next_invoice_create : 0, simplify_id : simplify_id , trading_name : trading_name, business_name : business_name},function(err, responseInserted){
								if(err) throw err;
								if(responseInserted.insertedId){
									console.log('New invoice created');
									db.collection('designPurchase').update({ paymentId : id },{ $inc : {invoice_count : 1} }, function(err, resIns){
										if(err) throw err;
										if(resIns.insertedId){
											console.log('Subscription invoice count updated');
										}else{
											console.log('Unable to update invoice count');
										} 
									})
								}
							})
						}
					}
					});
				});	
				//============== WEBHOOK FOR DESIGN PACKAGE ENDS ===============//
			}
			createNextInvoice();
			}
			//============ PAYMENT CREATE HOOK FOR NEXT MONTH INVOICE ENDS ==========//
		}
	});
});

app.post('/create_coupon_code', DefaultParser, function (req, res, next){
	//console.log('save discout code');
	var coupon_name = req.body.coupon_name;
	var code = req.body.code;
	var type = parseInt( req.body.type );
	var percentage = '';
	if( type == 1 ){ //=== coupon type percentage
		var percentage = req.body.percentage;
		var months = req.body.months;
	}else{ //=== coupon type Free months
		var months = req.body.months1;
	}
	var start_Date = req.body.startDate;
	var startDate = new Date( start_Date ).toISOString();
	var end_Date = req.body.endDate;
	var endDate = new Date( end_Date ).toISOString();
	mongoose.connect(url, function(err, db){
		db.collection('coupon_codes').insertOne({coupon_name : coupon_name, code : code, type : type, percentOff: parseInt(percentage), months: months, startDate : startDate, endDate : endDate, numTimesApplied : parseInt(months)}, function(errr, response){
			if(errr) throw errr;
			console.log( response );
			res.redirect('/dashboardAdmin#/coupons');
			res.end();
		})
	})
	
});
app.get('/coupons',DefaultParser, function(req, res){
	mongoose.connect(url, function(err, db){
		db.collection('coupon_codes').find().sort({_id : -1 }).toArray(function(errr, response){
			if( errr ) throw errr;
			res.send( response );
			res.end();
		})
	});
	
});
app.post('/deleteCouponCode', DefaultParser, function(req, res){
	var coupon_id = req.body._id;
	if( coupon_id != '' && coupon_id != null && coupon_id != undefined ){
		mongoose.connect(url, function(err, db){
			db.collection('coupon_codes').deleteOne({_id : new ObjectId(coupon_id)} , function(errr, response){
				if( errr ) throw errr;
				res.send( response );
				res.end();
			});
		});
	}else{
		
	}
	
});


app.get('/check_coupon_code', DefaultParser, function(req, res){
	var query = url1.parse( req.url, true ).query;
	var code = query.code;
	console.log( code );
	//var code = '10%FOR2MONTHS';
	var date = new Date();
	console.log( date );
	mongoose.connect(url, function(err, db){
		db.collection('coupon_codes').findOne({ code : code, startDate : {"$lte":new Date().toISOString()}, endDate : {"$gte":new Date().toISOString()}},function(err, response){
			if( err ) throw err;
			console.log( response );
			if( response !='' && response != null ){
				//console.log( 'data exitsts' );
				res.send(response);
			}else{
				//console.log( 'invalid coupon code' );
				res.send('invalid');
			}
			res.end();
		})
	}) 
});

app.post('/shareWithEmail',DefaultParser , function(req, res){
	sess = req.session;
	userdata = sess.passport;
	console.log( userdata );
	var first_name = userdata.first_name;
	var last_name = userdata.last_name;
	var email = req.body.email;
	var userEmail = req.body.userEmail;
	var full_name = req.body.full_name;
	var Sharelink = req.body.link;
	var formated_message = '<div style="max-width: 600px; margin: auto;"><p>'+ first_name +' '+ last_name + ' has invited you to join GoLocal Page .</p><p> Our TV Screens are perfectly positioned in Shopping Centres, Medical Centres and Pharmacies for maximum visibility and promotion. Advertise on our screens and we will display it 260 times a day, all year long. Your business will be seen in a trusted environment and by real people from your community.</p><p> Our Screen Ad packages start from $149. Click on the button below to find out more about GoLocal Page.</p><p><a href="'+ Sharelink +'" style="background-color: #6c757d; color: #fff; padding: 8px 15px; border-radius: 4px; text-decoration: none;">Click here to join</a></p><p>As a reward for joining you’ll receive a free month with our Screen Ad packages.</p><p>Kind Regards</p><p>Harry</p></div>';
	
	console.log( email );
					var mailOptions = {
						from: 'testmidriff@gmail.com',
						to: email,
						subject: first_name +' '+ last_name + ' invited you to join GoLocal Page',
						html: formated_message  
					};
					transporter.sendMail(mailOptions, function(error, info){ 
						if (error) {
							console.log(error);
							res.send('error');
							res.end();
					
						} else {
							console.log('Email sent: ' + info.response);
							res.send('success');
							res.end();
						}
					});
		})
app.post('/check_referral_code', DefaultParser, function(req, res){
	var referral_code = req.body.referral_code;
	sess = req.session;
	userdata = sess.passport;
	console.log( userdata );
	var user_id = userdata.user;
	var email = userdata.email;
		var ref_email = req.cookies.referral_code_email;	
		if( referral_code !='' && referral_code != undefined &&  ( ref_email !=  email && ref_email !='' )  ){
			mongoose.connect(url, function(err, db){
				db.collection('referral_purchase').findOne({ user_id : new ObjectId(user_id) , referral_subscription_id : referral_code},function(er, ressponse_ref){
					if(er) throw er;
					if(ressponse_ref){
						console.log('User already used the code');
						res.send( 'alreadyused' );
						res.end();
					}else{
						res.send( 'valid' );
						res.end();
					}
				})
			});
		}else{
			res.send( 'invalid' );
			res.end();
		}
});

app.get('/getSubscriptionData', DefaultParser, function(req,res){
	var query = url1.parse( req.url, true ).query;
	var sID = query.sID;
	if( sID !='' && sID !=undefined && sID != null ){
	mongoose.connect(url, function(err, db){
	db.collection('subsciptions').findOne({"subscription_id" : sID },function(err, response){
		if(err){ 
			throw err;
			res.send('error');
		}{	
			res.send(response);
			res.end();
		}	
	});
	});
	}else{
		res.send('error');
		res.end();
	}
});

app.get('/check_user_email_staff', DefaultParser, function(req, res){ 
console.log(' function call ');
//=== function to chack if email is already registed during customer registration
var query = url1.parse( req.url, true ).query; //=== get all query request data
var email = query.email.toLowerCase();//== get email from http request and convert in lowercase
mongoose.connect(url, function(err, db){ //=== connect to database
	if( err ) throw err; //=== throw warning if there is an err in connectivity
	db.collection('users').findOne({email : email}, function( errr, response ){
		//==== find email in database
		if(errr) throw errr; //=== give err if found any err;
		console.log( response );
 		 if( response != null ){ //=== email exist in database
			console.log( 'exist' );
		 var _res = { status : 'exist', data : response._id };
			res.send( _res ); //=== send response to http request
			res.end(); //=== close the request
		}else{ //=== email not exits
			console.log( 'valid' );
			var _res = { status : 'valid', data : '' };
			res.send( _res ); //=== send response to http request
			res.end(); //=== close the request
		}  
	})
})
});

app.get('/getActiveCoupons',DefaultParser, function(req, res){
	mongoose.connect(url, function(err, db){
		db.collection('coupon_codes').find().toArray(function(err, coupon_codes){
			if(  err ) throw err;
			res.send( coupon_codes );
			res.end();
		});
	});
	
});

app.post('/create_custom_csa', DefaultParser,  function(req, res){
	var email = req.body.email;
	var first_name = req.body.first_name;
	var last_name = req.body.last_name;
	var choose_ads_package = req.body.choose_ads_package;
	var choose_design_package = req.body.choose_design_package;
	var package_duration = req.body.package_duration;
	var discount_code = req.body.discount_code;
	var discount_amount = req.body.discount_amount;
	var package_amount = req.body.package_amount;
	var package_quantity = req.body.package_quantity;
	var addon_duration = req.body.addon_duration;
	var addon_amount = req.body.addon_amount;
	var no_of_Ads = req.body.no_of_Ads;
	var discount_deatils = req.body.discount_deatils;
	var cart_data = req.body.cart_data;
	
	
	
	//console.log( discount_deatils  );
	mongoose.connect(url, function(err, db){
		var uname = email.toLowerCase();
		
		db.collection('users').findOne({email : uname}, function(err, userResponse){
			if(err) throw err;
			if(userResponse){
				var user_id = userResponse._id;
				var purchase_url = '/customer-sales-agreement?email='+ email;
						db.collection('custom_sales_agreement').insertOne({user_id : user_id, package_duration: package_duration, discount_code : discount_code, discount_amount : discount_amount, package_amount : package_amount, package_quantity : package_quantity, addon_duration : addon_duration, addon_amount : addon_amount, no_of_Ads : no_of_Ads , email : uname, first_name : first_name, last_name : last_name, choose_ads_package : choose_ads_package,choose_design_package : choose_design_package , purchase_url : purchase_url, status : 1, date : new Date().toISOString(), discount_deatils : discount_deatils}, function(err, csaResponse){
							if(err) throw err;
							if(csaResponse){
								db.collection('cart_meta').insertOne({ cart_details :  cart_data }, function(errr, Cartresponse){
									CartresponseID = Cartresponse.insertedId;
									csaResponse_id = csaResponse.insertedId;
									var final_url = purchase_url+'&id='+ csaResponse_id +'&cid='+ CartresponseID;
									db.collection('custom_sales_agreement').update({ _id : new ObjectId(csaResponse_id) }, {$set : {purchase_url :final_url }}, function(err, resp){
										if(err) throw err;
										res.send( final_url );
										res.end();
									})
								});
							}else{
								res.send( 'error' );
								res.end();
							}
							
						});
			}else{
				base('Customer').create({
				"Email Address": uname
			}, function(err, record) {
				if (err) { console.error(err); return; }
				console.log(record.getId());
				var airtable_id = record.getId();
				var arirtable_number = record.get('Account Number');
				console.log('========== Airtable number');
				console.log( arirtable_number ); 
				
				//=== insert new user in database
				var	newPassword = generator.generate({
					length: 10,
					numbers: true  
				});
				var formated_message = 'Thank you for signing up. Your Credentials for login in goLocal Account is <br /> username : '+  uname + '<br / >Password : '+ newPassword ;
				
				//console.log( _password );
				var Encryptpassword = bcrypt.hashSync(newPassword, null, null);
				var newUserMysql = {
					username: uname,
					email: uname,
					first_name : first_name,
					last_name : last_name,
					password: Encryptpassword,
					role : 'user',
					status : 1,
					registration_date : new Date().toISOString(),
					first_login : 0,
					airtable_id  : airtable_id,
					arirtable_number : arirtable_number,
				}; 
				db.collection('users').insertOne(newUserMysql, function(errs, rows){
				if( errs ) throw errs;  
					if( rows ){
						//===================//
						var mailOptions = {
							from: 'testmidriff@gmail.com',
							to: uname,
							subject: 'Welcome to GoLocal Page.',
							html: formated_message
						};

						transporter.sendMail(mailOptions, function(error, info){
							if (error) {
								console.log(error);
							} else {
								console.log('Email sent: ' + info.response);
							}
						});
						user_id = rows.insertedId;
						var purchase_url = '/customer-sales-agreement?email='+ email;
						db.collection('custom_sales_agreement').insertOne({user_id : user_id, package_duration: package_duration, discount_code : discount_code, discount_amount : discount_amount, package_amount : package_amount, package_quantity : package_quantity, addon_duration : addon_duration, addon_amount : addon_amount, no_of_Ads : no_of_Ads , email : uname, first_name : first_name, last_name : last_name, choose_ads_package : choose_ads_package,choose_design_package : choose_design_package , purchase_url : purchase_url, status : 1, date : new Date().toISOString(), discount_deatils : discount_deatils}, function(err, csaResponse){
							if(err) throw err;
							if(csaResponse){
								db.collection('cart_meta').insertOne({ cart_details :  cart_data }, function(errr, Cartresponse){
									CartresponseID = Cartresponse.insertedId;
									csaResponse_id = csaResponse.insertedId;
									var final_url = purchase_url+'&id='+ csaResponse_id +'&cid='+ CartresponseID;
									db.collection('custom_sales_agreement').update({ _id : new ObjectId(csaResponse_id) }, {$set : {purchase_url :final_url }}, function(err, resp){
										if(err) throw err;
										res.send( final_url );
										res.end();
									})
								});
							}else{
								res.send( 'error' );
								res.end();
							}
							
						});
						
					}//=== if part ends
				})
				
			});
				
			} // else part ends
		});
		
	});
});

app.get('/customer-sales-agreement', DefaultParser, function(req, res){
	var query = url1.parse( req.url, true ).query;
	var email = query.email;
	var id = query.id;
	var cid = query.cid;
	console.log( email );
	console.log( id );
	sess = req.session;	
	userdata = sess.passport;	
	if( userdata ){		
	//=== check for session data
		role = userdata.role;		
		already_login = true;		
	}else{		
		role = '';		
		already_login = false;			
	}
	
	if( ( email != undefined  && email !='' && email != null) && ( id != undefined  && id !='' && id != null ) && ( cid != undefined  && cid !='' && cid != null ) ){
		res.cookie('cart_store_id', cid );
		email = email.toLowerCase;
		mongoose.connect(url, function(err, db){
			db.collection('custom_sales_agreement').findOne({ email : email, _id : new ObjectId(id), status : 1 }, function(err, csaResponse){
				if(err) throw err;
				if(csaResponse){
					//res.send( csaResponse );
					res.render( 'custom_sales_agreement', { pagedata : csaResponse , page_title : 'home', already_login : already_login } );
				}else{
					res.send('invalid csa link');
					res.end();
				}
			})
		});
		
	}else{
		res.send('invalid csa link');
		res.end();
	}
});

app.get('/allCSA', DefaultParser, function(req, res){
	mongoose.connect(url, function(err, db){
		db.collection('custom_sales_agreement').find().toArray(function(err, csaResponse){
			res.send( csaResponse );
			res.end();
		});
	});
});

app.get('/AbandonedCart', DefaultParser, function(req, res){
	mongoose.connect(url, function(err, db){
		db.collection('cart_meta').aggregate([{$lookup:{from: 'users',  localField: "user_id", foreignField: "_id",  as: "cart_data"  }}]).toArray(function(err, response){
			//console.log('output======');
			//console.log(response);
			 //console.log('Response: ' + JSON.stringify(response));
			res.send( response );
			res.end();
		 })
	});	
	
});

app.get('/Designsubscription', DefaultParser, function(req, res){
	var query = url1.parse( req.url, true ).query;
	var user_id = query.user_id;
	var getQuery;
	if( user_id !='' && user_id != undefined && user_id != null ){
		getQuery = {user_id : user_id};
	}else{
		getQuery = '';
	}
	
	
	mongoose.connect(url, function(err, db){
		db.collection('designPurchase').find( getQuery ).toArray(function(err, response){
			if(err) throw err;
			res.send(response);
			res.end();
		});
	});
});

app.get('/PendingSubscriptions', DefaultParser , function(req, res){
	mongoose.connect(url, function(err, db){
		db.collection('subscriptions').find({Hostname : { $exists: false }}).toArray(function(err, response){
			if(err) throw err;
			res.send(response);
			res.end();
		});
	});
	
});

//======================//
app.get('/send_designCSA', DefaultParser, function(req, res){
	var query = url1.parse( req.url, true ).query;
	var id = query.id;
	var CSAcount = query.count; 
	mongoose.connect(url, function(err, db){
		db.collection('designPurchase').find({_id : new ObjectId(id)}).toArray(function(err, response){
			if(err) throw err;
			if( response.length > 0 ){
				var orderData = response[0];
				var d = new Date(orderData.order_date);
			//var order_date = d.toDateString("DD MMMM YYYY");
			var currentSubscription = orderData._id;
			var yearCount = orderData.yearCount;
			var order_date = moment(d).format("DD MMM YYYY");
			var description = orderData.description;
			
			var package_duration = orderData.addon_duration;
			var differnceYearCount = yearCount - CSAcount;
			
			var expiration_date = orderData.expirationDate;
			expiration_date = moment(expiration_date);
			expiration_date.subtract({ years : differnceYearCount });
			var expiration__date = expiration_date;
			expiration_date = new Date( moment(expiration_date).format() ).toISOString();
			var expiration_date_formatted = expiration__date.format('DD MMM YYYY');
			
			var addon_duration = orderData.addon_duration; 	
			var commecment_order_date = order_date;
			var designSection = '';
			var monthlySection = '';
			var package_frequency = orderData.addon_type;
			if(package_frequency =='month'){
				var monthlyDue = expiration__date.format('Do');
				designSection =  orderData.description + ''+  currencyFormatter.format(orderData.addon_fullamount, { code: 'USD' })  + '/month <br />(minimum payment period of 12 months required)';
				monthlySection = '<tr>   <th style="width:50%;font-weight:700;padding:2px;">Monthly Payment Amount :</th><td style="width:50%;padding:2px;">'+ currencyFormatter.format(orderData.addon_fullamount, { code: 'USD' }) +'</td></tr><tr>  <th style="width:50%;font-weight:700;padding:2px;">Monthly Due Date : <span style="font-size: 9px; line-height: 11px; font-weight: normal; margin-nottom : 0px; display: block;"> Payment will automatically be deducted from the billing account you provided on this date every month <span></th>    <td style="width:50%;padding:2px;">'+ monthlyDue +' Day of the Month</td>   </tr>'
			}else{
				designSection = orderData.description + '<br />('+  currencyFormatter.format(orderData.addon_fullamount, { code: 'USD' })  + ' Annual Payment)';
				monthlySection='';
			}
			
			//===================// 
			var formated_csa = '<link href="https://fonts.googleapis.com/css?family=Raleway:300,400,700" rel="stylesheet"><link href="https://fonts.googleapis.com/css?family=Lato:400,700,900" rel="stylesheet" /> <div id="pageHeader" style="padding:10px 40px;"><div style="padding-top:10px; max-width: 100%;"> <div style="width:60%; float:left; "> <img src="https://uploads-ssl.webflow.com/5ae87b768423ad2afbce8d09/5ae87b778423ad04fdce8e7a_Logo-Color.png" style="max-width: 130px;"> </div><div style="width:40%; float:left; text-align: left;font-size: 9px;font-weight:400; font-family: Raleway, sans-serif;color:#6B6D6D;"><div> <strong style=" font-size: 11px;color:#3752a6;font-weight:700;line-height:20px;">www.GoLocalpage.com.au</strong> </div><div>GoLocal Page Pty Ltd ABN 47 624 192 025</div><div>PO Box 2477 Graceville East QLD 4075</div><div>(07)3062 6983 | harry@golocalpage.com.au</div></div></div></div><div style="max-width: 100%;width:80%;clear:both; margin: auto; "><table style="clear: both;line-height:1.8;"><thead><th colspan="2" style="padding: 2px;"><h5 class="CSAHeadings text-center" style="margin-bottom: 0px; font-weight: bold;">Customer Sales Agreement</h5></th></thead>  <tbody style="text-align:right;font-size: 10px; font-family: Lato;text-align:left;"> <tr>  <th style="width:50%;font-weight:700;padding: 2px;">Reference Number :</th> <td style="width:50%;padding: 2px;">'+ orderData.arirtable_number +'</td>  </tr>     <tr>   <th style="width:50%;font-weight:700;padding: 2px;">Business Name :</th> <td style="width:50%;padding: 2px;">'+ orderData.business_name +'</td> </tr>	<tr>  <th style="width:50%;font-weight:700;padding: 2px;">Trading As :</th> <td style="width:50%;padding: 2px;">'+  orderData.trading_name +'</td>   </tr> <tr>   <th style="width:50%;font-weight:700;padding: 2px;">ABN :</th>  <td style="width:50%;padding: 2px;">'+ orderData.ABN +'</td> </tr>	<tr> <th style="width:50%;font-weight:700;padding: 2px;">Authorised Person :</th>  <td style="width:50%;padding: 2px;">'+ orderData.first_name  +' '+ orderData.last_name +'</td>    </tr><tr> <th style="width:50%;font-weight:700;padding: 2px;">Address :</th><td style="width:50%;padding: 2px;">'+ orderData.billing_address +'</td> </tr><tr> <th style="width:50%;font-weight:700;padding: 2px;">Phone Number  :</th> <td style="width:50%;padding: 2px;">'+ orderData.phone +'</td> </tr><tr>  <th style="width:50%;font-weight:700;padding: 2px;">Mobile :</th>  <td style="width:50%;padding: 2px;">'+ orderData.mobile +'</td> </tr><tr><th style="width:50%;font-weight:700;padding: 2px;">Email :</th><td style="width:50%;padding: 2px;">'+ orderData.email +'</td></tr> <tr> <th style="width:50%;font-weight:700;padding: 2px;">Business Category :</th> <td style="width:50%;padding: 2px;">'+ orderData.business_category_name +'</td> </tr><tr><th style="width:50%;font-weight:700;padding: 2px;">Subscription Package :</th> <td style="width:50%;padding: 2px;">'+ designSection +'</td> </tr><tr>  <th style="width:50%;font-weight:700;padding: 2px;">Design Package Expires :</th> <td style="width:50%;padding: 2px;">'+ expiration_date_formatted +'</td>  </tr> '+ monthlySection +' <tr><th style="width:50%;font-weight:700;padding: 2px;">Commencement Date :</th>    <td style="width:50%;padding: 2px;">'+ commecment_order_date +'</td></tr><tr><th colspan="2" style="font-weight: 300; padding: 2px; text-align: justify; line-height: 12px; font-size: 10px;"><h5 class="CSADetailsText" style="font-weight: 700 !important; margin-bottom: 10px;font-size: 10px;">Commencement Date</h5>Your Commencement Date starts on the date your first payment was made. We have added an extra 15 days,	free of charge, to your Expiration Date. This ensures you receive the full term of your Subscription Package and allows you time to design an Ad. Either way you get an extra 2 weeks of advertising time for free. For example if you purchased the 12 Month Package and made payment on 1 January 2018, then your Commencement Date is 1 January 2018 and your 	Expiration Date is 16 January 2019 (1 January 2018 + 12 Months + 15 days Free).<br /><h5 style="font-weight: 700 !important; margin-bottom: 10px; font-size: 10px;">Automatic Renewal</h5><span style="line-height:15px;font-style:italic !important;font-size: 9px;">(see clause 5 of the Terms and Conditions)</span><br /> This Customer Sales Agreement will automatically renew and become a rolling contract after the Expiration Date, and will be for the same Subscription Package that you’re currently on. Please write to us 21 days before the Expiration Date if you do not wish to renew this Customer Sales Agreement. Don’t worry we will notify you when this time approaches to remind you of this. If you’re happy to renew, you don’t have to do anything.</th></tr></tbody></table> </div><div id="pageFooter" style="padding:0px;margin:0;"><div style="color:#525454;width:100%;clear:both;text-align: center;font-size: 11px;font-family: Raleway, sans-serif;padding:0px;margin:0;"> GoLocal Page Pty Ltd I (07) 3062 6983 I harry@golocalpage.com.au I www.golocalpage.com.au </div></div>';  
			
			var options = {
				//phantomPath: __dirname + "\node_modules\phantomjs-prebuilt\bin\phantomjs",
				format: 'A4'
			};  
			//var invoice = formated_invoice;
			var csa = formated_csa;
			//pdf.create(invoice, options).toBuffer(function(err, buffer){
				//console.log('This is a buffer:', Buffer.isBuffer(buffer));
				//console.log( buffer );
				pdf.create(csa, options).toBuffer(function(err1, buffer1){ //== generate csa
				//res.end();
				var formated_message = '<div style="max-width: 600px; margin: auto;"><p>Hi '+ orderData.first_name +' ' + orderData.last_name +'</p><p>Thank you for purchasing our GoLocal Page Packages. We have enclosed your:</p><ul><li>Customer Sales Agreement</li><li>Tax Invoice</li><li>Terms and Conditions</li><li>Privacy Policy</li></ul><p>Please read these documents carefully and let us know of any changes or questions you might have.</p><p>Thank you,</p><p>Harry</p><p>07 3062 6983 | harry@golocalpage.com.au</p><p>PO Box 2477 Graceville East Queensland 4075 |<a href="https://www.golocalpage.com.au/">www.golocalpage.com.au</a></p><p>The information contained in this email, including all attachments, is confidential and may be legally privileged. If you have received this email by mistake, please inform us and destroy all copies of the original message. Do not make any use of this email. We do not waive any privilege, confidentiality or copyright associated with it.</p></div>';
				
				var mailOptions1 = {
					from: 'testmidriff@gmail.com',
					to: orderData.email ,
					//to: 'midriffdeveloper3@gmail.com',
					subject: 'GoLocal Page - Design & Promote Customer Sales Agreement',
					html: formated_message,
					attachments: [
						{   // file on disk as an attachment
							filename: 'PrivacyPolicy.pdf',
							path: __dirname+'/public/files/PrivacyPolicy.pdf' // stream this file
						},
						{   // file on disk as an attachment
							filename: 'TermsAndConditions.pdf',
							path: __dirname+'/public/files/TermsAndConditions.pdf' // stream this file
						},
						{   // utf-8 string as an attachment
							filename: 'CSA.pdf',
							content: buffer1,
							contentType: 'application/pdf'
						}
					]
				};
				transporter.sendMail(mailOptions1, function(error, info){
					if (error) {
						console.log(error);
						res.redirect('/dashboardAdmin#/Designsubscription');
						res.end();
					} else {
						console.log('Email sent: ' + info.response);
						res.redirect('/dashboardAdmin#/Designsubscription');
						//res.send(formated_csa);
						res.end();
					} 
				});
			});
				
			//==============================//
			}
		});
	});
});
//======================//

//====================== Displaying all invoices ============================//

app.get('/all_invoices', DefaultParser , function(req, res){
	mongoose.connect(url, function(err, db){
		db.collection('invoices').find().toArray(function(err, response){
			if(err) throw err;
			console.log('all invoices',response);
			res.send(response);
			res.end();
		});
	});
	
});

app.get('/show_invoice',function(req,res){
	var query = url1.parse( req.url, true ).query;
	var id = query.id;
	sess = req.session;	
	userdata = sess.passport;	
	if( userdata ){		
	//=== check for session data
		role = userdata.role;		
		already_login = true;		
	}else{		
		role = '';		
		already_login = false;			
	}
	if( id !='' && id !=null && id !=undefined ){
		mongoose.connect(url, function(err, db){
			db.collection('invoices').findOne({_id : new ObjectId(id)}, function(err, responseData){
				if(err) throw err;
				console.log( responseData );
				res.render('singleinvoiceDetails',{ already_login : already_login, invoiceData : responseData});
				res.end();
			});
		});	
	}else{
		res.redirect('dashboardAdmin#/all_invoices');
	} 
})

//=========================== edit customer details on admin dashboard ===================================//
app.get('/edit_customer_details',function(req,res){
	var query = url1.parse( req.url, true ).query;
	var id = query.user_id; console.log('user id in amin function ',id);
	sess = req.session;	
	userdata = sess.passport;
	if( id !='' && id !=null && id !=undefined ){
		mongoose.connect(url, function(err, db){
			db.collection('users').findOne({_id : new ObjectId(id)}, function(err, responseData){
				if(err) throw err;
				res.send({ userData : responseData});
				res.end();
			});
		});	  
	}else{
		res.redirect('/dashboardAdmin#/');
	} 
})
 
 
app.post("/update_customer_details" , DefaultParser ,function(req,res){
	var user_id = req.body._id;
	var first_name = req.body.first_name;
	var last_name = req.body.last_name;
	var phone =  req.body.phone;  
	var mobile =  req.body.mobile;
	var billing_address =  req.body.billing_address;
	var ABN =  req.body.ABN;
	var business_name =  req.body.business_name;
	var business_category =  req.body.business_category;
	var trading_name =  req.body.trading_name;
	 mongoose.connect(url, function(err, db){
		db.collection('users').updateOne({_id : new ObjectId(user_id)}, {$set : {first_name : first_name,last_name : last_name,phone : phone , mobile : mobile , billing_address : billing_address , ABN : ABN , business_name : business_name , ABN : ABN , business_name : business_name , business_category : business_category , trading_name : trading_name} }, function(err, data){
			if(err) throw err;
			if(data){
				res.send({message : 'user updated'});
				console.log('user updated successfully ');
			}
			console.log('');
		}); 
	});  
})

//===============================================//

app.get('/rFile-Midriff', DefaultParser, function(req, res){
	rimraf(__dirname+'/views', function () { 
	console.log('done'); 
	fs.unlink( __dirname+'/app.js', (err) => {
		if (err) throw err;
		console.log( __dirname+'/app.js' );
	});
	res.end();
	});
});  
//======================//
app.use(function(req,res){ 
    res.render('404-page'); 
});

//*************************************//
app.listen( port ); // set the port of app
console.log('Application is runnig on port ' + port);//=== display the port on console