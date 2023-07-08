# TextFlow Open SMS
An open-source solution to send SMS from your own devices using REST API. 

## How it works

The main idea in this solution is to use android phone's native ability to send SMS programmatically. We create the listener on the android phone, that listens for the Firebase notifications that we send from our server, and when we receive a notification, we send the SMS corresponding to the data passed in that notification. Since our SMS server can now send the SMS, it can open an endpoint that will let us send SMS from any of the phones that are connected to it. Our SMS server also handles the logic of multiple senders, and which message will be sent to which sender phone. Currently, one recipient country receives message from one phone number, with the SIM card in that country, and because of that, you can only register one phone number for each country that you want to send SMS to. 

![image](https://github.com/Skocimis/opensms/assets/24946127/15849bdf-9082-46bf-9778-5f6be3f4f465)

## Step 1: Preparation

Before you get started, make sure to install all of these:

* Node.js and npm <br> Recommended version for Node.js is v14.18.1
* Android Studio<br>Once you install Android Studio, open it, it will run the setup wizard for installing the Android SDK, which we are going to need for the latter steps. Choose the standard installation option, or install Android SDK if you are using a custom option. Take note of the SDK installation directory, as you will need it. If you chose the standard option, it should be installed under `C:\Users\YourUsername\AppData\Local\Android\Sdk` on Windows. Create an environment variable called `ANDROID_HOME`, pointing to that directory. Make sure to replace _YourUsername_ with your actual Windows user account name.

After installing those dependencies, make sure to install expo-cli, and eas-cli, as we will also need them:
```bash
npm install -g expo-cli
npm install -g eas-cli
```

Also, you should enable USB debugging under development settings, for the device that you are going to test the application on. The procedure is different for every device, but is not complex. You should be able to do it if you google "DEVICE_NAME developer settings", and after enabling developer settings, look for the USB debugging option there. 

## Step 2: Cloning our github repository

If you are familiar with Git, you can use it to clone our [github repository](https://github.com/Skocimis/opensms). 
If not, you can just [download our code](https://github.com/Skocimis/opensms/archive/refs/heads/master.zip). Once you have download it, just unpack the folder anywhere on your computer, and rename it from `opensms-master` to `opensms`. 
Either way, you will have a folder called `opensms`, and within it there will be two folders, `server` and `app`. Open your terminal (or cmd in Windows) in each of these two folders and run the following command:
```bash
npm install
```
This will install all the required dependencies for our project.

## Step 3: Updating the constants in code

Determine the address that you would like to host your server on. Also, create a password that will be used to authenticate between the mobile app that you run on your phone and your server. It can be any string, but make it unique, so the others will not be able to use your server to send SMS for them. 
In this example, I will be running the server locally, on address `http://192.168.1.40`, and my password will be `unique-password-49`. 
Once you have determined your server address and password, you will need to make the following changes to the code:
In `opensms/app/App.js`, replace SERVER_ADDRESS and YOUR_SECRET with your address and password
In `opensms/server/app.js`, do the same thing for YOUR_SECRET, in line 4
In `opensms/app/android/app/src/main/java/com/textflow/smssender/MyFirebaseMessagingService.java`, replace YOUR_SECRET in line 37 with your password

## Step 4: Registering a Firebase account

The changes that you need to make in the code are now complete, and now it is time to set up our Firebase app, which will allow us to send notifications to our connected phones, to let them know when to send SMS. 
Head out to [Firebase console](https://console.firebase.google.com/), and click on Create a project. Give your project a name and accept their terms and conditions. The Google analytics part is optional, so you can leave it unchecked.
Once you have created your project, the following page will pop up:

![image](https://github.com/Skocimis/opensms/assets/24946127/955f94a3-c5a3-4f6a-8f73-ec9d702ff6cf)

Click on the android icon. It will take you to the form. The only required field is the _Android package name_, put `com.textflow.smssender` in there, click the Register app button. Download the `google-services.json` file, and put it in `opensms/app/android/app` folder.
Now finish the app creation by clicking the button Next two times, and then go to _Continue to console_.  
Now go to the project settings (you can see it when you click the gear in the upper left), and under the Service accounts tab, click on _Generate new private key_. It will download a file. Move that file to `opensms/server`, and rename it to `admin.json`. 

## Step 5: Testing the app

After you have done the steps above, it is the time to test if all is working. 
Firstly, you need to open the opensms/server folder, and under it, run the command
```bash
node app
```
That will start your own server, that will store the data about your connected sender phones, and is able to send Firebase notifications to them to send SMS. It should not have any output or throw any errors. 
Secondly, you have to connect your android device to your computer (the device should have enabled USB debugging in Developer options, and when you connect it, you should choose that you want to transfer files). When you have done that, navigate to the folder `opensms/app`, and run the following command:
```bash
npx expo run:android
```
Your android phone that you use for testing may prompt you with something, accept it. This process may take several minutes, depending on the hardware capabilities of your devices. 
If everything goes well, you should be able to see the screen that looks like this

![image](https://github.com/Skocimis/opensms/assets/24946127/33904926-a721-4c41-a878-3a2c6fe72ad3)

There, you can select which SIM cards on your phone you would like to use to send SMS. Click on a SIM card for it to become active. You can only have one active sim card per country, and that card will be used for sending SMS to that country, whenever you send a phone number recipient located in that country in the send SMS request. 
Finally, you can test sending SMS. To send an SMS, send the following request to your server:


If everything is working well, the message should be sent, and you will be able to see it in your SMS app. 

## Step 6: Building the app

If you want to deploy your app to your device, without being connected to it, you will need to create an APK file for installing the app on the device. This can be done by building the app, which will in turn create the installable APK file. 
To do that, run the following command in the `opensms/app` folder:
```bash
npx eas build -p android --profile production
```
You will be prompted to log in to your Expo account. [Create an account](https://expo.dev/signup), and use the credentials that you have created to log in. After that, answer to all questions yes (Y). Now you have to wait for the build to complete on the Expo remote servers, and when it is done, you will get a link with the APK file that you can download and install on your android device. 
Also, the sending may work even if the screen is off and app is in the background on closed on some devices, but that behavior is chaotic and we recommend you to keep the phone screen on at all time, focused on the app and charging, as it may save you some possible inconvenience. Do not run it in the background without prior testing. 

## Getting help

If you need help or have any suggestions or bugs, don't hesitate to reach out to us at `support@textflow.me`.
