try {
  var fs = require('fs');
  var glob = require('glob');
  var addAndroidPermissions = process.env.RNFB_ANDROID_PERMISSIONS == 'true';
  var MANIFEST_PATH = glob.sync(process.cwd() + '/android/app/src/main/**/AndroidManifest.xml')[0];
  var PACKAGE_JSON = process.cwd() + '/package.json';
  var package = JSON.parse(fs.readFileSync(PACKAGE_JSON));
  var APP_NAME = package.name;
  var PACKAGE_GRADLE = process.cwd() + '/node_modules/react-native-fetch-blob/android/build.gradle'
  var VERSION = checkVersion();

  console.log('RNFetchBlob detected app version => ' + VERSION);

  if(VERSION < 0.28) {
    console.log('You project version is '+ VERSION + ' which may not compatible to react-native-fetch-blob 7.0+, please consider upgrade your application template to react-native 0.27+.')
    // add OkHttp3 dependency fo pre 0.28 project
    var main = fs.readFileSync(PACKAGE_GRADLE);
    console.log('adding OkHttp3 dependency to pre 0.28 project .. ')
    main = String(main).replace('//{RNFetchBlob_PRE_0.28_DEPDENDENCY}', "compile 'com.squareup.okhttp3:okhttp:3.4.1'");
    fs.writeFileSync(PACKAGE_GRADLE, main);
    console.log('adding OkHttp3 dependency to pre 0.28 project .. ok')
  }

  if (VERSION < 0.40) {
    console.log('Removing RN040_IMPORT for RN < 0.40 project ..')
    glob('**/RNFetchBlob.h',{}, function(err, files) {
      if(Array.isArray(files)) {
        var target = process.cwd() + '/' + files[0];
        console.log('\033[92mPatching .. \033[97m' + target);
        var data = fs.readFileSync(target);
        fs.writeFileSync(target, String(data).replace(/#define RN040_IMPORT/, ''));
        console.log('done.')
      }
    })
  }

  console.log('Add Android permissions => ' + (addAndroidPermissions == "true"))

  if(addAndroidPermissions) {

    // set file access permission for Android < 6.0
    fs.readFile(MANIFEST_PATH, function(err, data) {

      if(err)
        console.log('failed to locate AndroidManifest.xml file, you may have to add file access permission manually.');
      else {

        console.log('RNFetchBlob patching AndroidManifest.xml .. ');
        // append fs permission
        data = String(data).replace(
          '<uses-permission android:name="android.permission.INTERNET" />',
          '<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" /> '
        )
        // append DOWNLOAD_COMPLETE intent permission
        data = String(data).replace(
          '<category android:name="android.intent.category.LAUNCHER" />',
          '<category android:name="android.intent.category.LAUNCHER" />\n     <action android:name="android.intent.action.DOWNLOAD_COMPLETE"/>'
        )
        fs.writeFileSync(MANIFEST_PATH, data);
        console.log('RNFetchBlob patching AndroidManifest.xml .. ok');

      }

    })
  }
  else {
    console.log(
      '\033[95mreact-native-fetch-blob \033[97mwill not automatically add Android permissions after \033[92m0.9.4 '+
      '\033[97mplease run the following command if you want to add default permissions :\n\n' +
      '\033[96m\tRNFB_ANDROID_PERMISSIONS=true react-native link \n')
  }

  function checkVersion() {
    console.log('RNFetchBlob checking app version ..');
    return parseFloat(/\d\.\d+(?=\.)/.exec(package.dependencies['react-native']));
  }

} catch(err) {
  console.log(
    '\033[95mreact-native-fetch-blob\033[97m link \033[91mFAILED \033[97m\nCould not automatically link package :'+
    err.stack +
    'please follow the instructions to manually link the library : ' +
    '\033[4mhttps://github.com/wkh237/react-native-fetch-blob/wiki/Manually-Link-Package\n')
}
